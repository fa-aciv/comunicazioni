<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Citizen;
use App\Models\CitizenLoginChallenge;
use App\Notifications\SendCitizenMagicLink;
use App\Services\EsendexSmsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CitizenAuthController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('auth/citizen-login', [
            'status' => $request->session()->get('status'),
        ]);
    }

    public function requestMagicLink(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email:rfc'],
        ]);

        $citizen = Citizen::query()
            ->where('email', $validated['email'])
            ->first();

        $status = 'Se l\'indirizzo email e registrato, ti abbiamo inviato un link di accesso.';

        if (! $citizen) {
            return back()->with('status', $status);
        }

        $challenge = CitizenLoginChallenge::create([
            'citizen_id' => $citizen->id,
            'uuid' => (string) Str::uuid(),
            'magic_link_expires_at' => now()->addMinutes(config('auth.citizen.magic_link_expire')),
            'last_ip_address' => $request->ip(),
        ]);

        $citizen->notify(new SendCitizenMagicLink($challenge));

        return back()->with('status', $status);
    }

    public function showChallenge(
        Request $request,
        CitizenLoginChallenge $challenge,
        EsendexSmsService $smsSender
    ): Response|RedirectResponse {
        $challenge->loadMissing('citizen');

        if ($challenge->completed_at !== null || $challenge->isExpired()) {
            return redirect()
                ->route('citizen.login')
                ->withErrors(['email' => 'Il link di accesso non e piu valido.']);
        }

        if (! $challenge->citizen || blank($challenge->citizen->phone_number)) {
            return redirect()
                ->route('citizen.login')
                ->withErrors(['email' => 'Per questo profilo non e disponibile un numero di cellulare.']);
        }

        if ($this->shouldIssueOtp($challenge)) {
            $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            $challenge->forceFill([
                'otp_code_hash' => Hash::make($otp),
                'otp_sent_at' => now(),
                'otp_expires_at' => now()->addMinutes(config('auth.citizen.otp_expire')),
            ])->save();

            $message = str_replace(
                [':app', ':otp'],
                [config('app.name'), $otp],
                (string) config('services.esendex.otp_template')
            );

            $smsResult = $smsSender->sendSms($challenge->citizen->phone_number, $message);

            if (! ($smsResult['ok'] ?? false)) {
                report(new \RuntimeException('Citizen OTP SMS delivery failed.'));

                return redirect()
                    ->route('citizen.login')
                    ->withErrors([
                        'email' => 'Non e stato possibile inviare il codice OTP. Riprova tra qualche minuto.',
                    ]);
            }
        }

        $challenge->forceFill([
            'magic_link_opened_at' => $challenge->magic_link_opened_at ?? now(),
            'last_ip_address' => $request->ip(),
        ])->save();

        $request->session()->put('citizen_auth.challenge_id', $challenge->id);
        $request->session()->put('citizen_auth.challenge_guard', 'citizen');

        return Inertia::render('auth/citizen-challenge', [
            'email' => $challenge->citizen->email,
            'maskedPhoneNumber' => $challenge->citizen->masked_phone_number,
            'expiresAt' => optional($challenge->otp_expires_at)?->toIso8601String(),
            'status' => $request->session()->get('status', 'Ti abbiamo inviato un codice OTP via SMS.'),
        ]);
    }

    public function verify(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'fiscal_code' => ['required', 'string', 'size:16'],
            'otp' => ['required', 'string', 'size:6'],
        ]);

        /** @var CitizenLoginChallenge|null $challenge */
        $challenge = CitizenLoginChallenge::query()
            ->with('citizen')
            ->find($request->session()->get('citizen_auth.challenge_id'));

        if (! $challenge || ! $challenge->citizen || ! $challenge->isOpen()) {
            throw ValidationException::withMessages([
                'otp' => 'Sessione di accesso non valida. Richiedi un nuovo link.',
            ]);
        }

        if ($challenge->otp_expires_at === null || $challenge->otp_expires_at->isPast()) {
            throw ValidationException::withMessages([
                'otp' => 'Il codice OTP e scaduto. Apri di nuovo il link ricevuto via email.',
            ]);
        }

        if (! hash_equals(
            $challenge->citizen->normalized_fiscal_code,
            strtoupper($validated['fiscal_code'])
        )) {
            throw ValidationException::withMessages([
                'fiscal_code' => 'Codice fiscale non corrispondente.',
            ]);
        }

        if (! Hash::check($validated['otp'], (string) $challenge->otp_code_hash)) {
            throw ValidationException::withMessages([
                'otp' => 'Codice OTP non valido.',
            ]);
        }

        Auth::guard('citizen')->login($challenge->citizen);
        $request->session()->regenerate();
        $request->session()->forget('citizen_auth');

        $challenge->forceFill([
            'completed_at' => now(),
            'otp_code_hash' => null,
            'otp_expires_at' => null,
        ])->save();

        $challenge->citizen->forceFill([
            'last_login_at' => now(),
        ])->save();

        return redirect()->intended(route('citizen.dashboard'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('citizen')->logout();
        $request->session()->forget('citizen_auth');
        $request->session()->regenerateToken();

        return redirect()->route('citizen.login');
    }

    private function shouldIssueOtp(CitizenLoginChallenge $challenge): bool
    {
        if ($challenge->otp_code_hash === null || $challenge->otp_expires_at === null) {
            return true;
        }

        if ($challenge->otp_expires_at->isPast()) {
            return true;
        }

        return $challenge->otp_sent_at === null
            || $challenge->otp_sent_at->lte(now()->subSeconds(config('auth.citizen.otp_resend_cooldown')));
    }
}
