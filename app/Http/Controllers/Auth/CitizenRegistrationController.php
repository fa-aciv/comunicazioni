<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Citizen;
use App\Models\CitizenRegistrationInvitation;
use App\Services\EsendexSmsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CitizenRegistrationController extends Controller
{
    public function show(
        Request $request,
        CitizenRegistrationInvitation $invitation,
        EsendexSmsService $smsSender
    ): Response|RedirectResponse {
        if ($invitation->completed_at !== null || $invitation->isExpired()) {
            return redirect()
                ->route('citizen.login')
                ->withErrors(['email' => 'Il link di conferma non è piu valido.']);
        }

        if (blank($invitation->phone_number)) {
            return redirect()
                ->route('citizen.login')
                ->withErrors(['email' => 'Per questa registrazione non è disponibile un numero di cellulare.']);
        }

        if ($this->shouldIssueOtp($invitation)) {
            $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            $invitation->forceFill([
                'otp_code_hash' => Hash::make($otp),
                'otp_sent_at' => now(),
                'otp_expires_at' => now()->addMinutes(config('auth.citizen.otp_expire')),
            ])->save();

            $message = str_replace(
                [':app', ':otp'],
                [config('app.name'), $otp],
                (string) config('services.esendex.otp_template')
            );

            $smsResult = $smsSender->sendSms($invitation->phone_number, $message);

            if (! ($smsResult['ok'] ?? false)) {
                report(new \RuntimeException('Citizen registration OTP SMS delivery failed.'));

                return redirect()
                    ->route('citizen.login')
                    ->withErrors([
                        'email' => 'Non è stato possibile inviare il codice OTP. Riprova tra qualche minuto.',
                    ]);
            }
        }

        $invitation->forceFill([
            'magic_link_opened_at' => $invitation->magic_link_opened_at ?? now(),
            'last_ip_address' => $request->ip(),
        ])->save();

        $request->session()->put('citizen_registration.invitation_id', $invitation->id);

        return Inertia::render('auth/citizen-registration-challenge', [
            'invitation' => [
                'name' => $invitation->name,
                'email' => $invitation->email,
                'phoneNumber' => $invitation->phone_number,
                'fiscalCode' => $invitation->normalized_fiscal_code,
                'maskedPhoneNumber' => $invitation->masked_phone_number,
            ],
            'expiresAt' => optional($invitation->otp_expires_at)?->toIso8601String(),
            'status' => $request->session()->get('status', 'Ti abbiamo inviato un codice OTP via SMS.'),
        ]);
    }

    public function verify(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'accept' => ['accepted'],
            'otp' => ['required', 'string', 'size:6'],
        ], [
            'accept.accepted' => 'Devi confermare che i dati sono corretti per creare l\'account.',
        ]);

        /** @var CitizenRegistrationInvitation|null $invitation */
        $invitation = CitizenRegistrationInvitation::query()
            ->find($request->session()->get('citizen_registration.invitation_id'));

        if (! $invitation || ! $invitation->isOpen()) {
            throw ValidationException::withMessages([
                'otp' => 'Sessione di conferma non valida. Apri di nuovo il link ricevuto via email.',
            ]);
        }

        if ($invitation->otp_expires_at === null || $invitation->otp_expires_at->isPast()) {
            throw ValidationException::withMessages([
                'otp' => 'Il codice OTP è scaduto. Apri di nuovo il link ricevuto via email.',
            ]);
        }

        if (! Hash::check($validated['otp'], (string) $invitation->otp_code_hash)) {
            throw ValidationException::withMessages([
                'otp' => 'Codice OTP non valido.',
            ]);
        }

        if (Citizen::query()->where('email', $invitation->email)->exists()
            || Citizen::query()->where('fiscal_code', $invitation->normalized_fiscal_code)->exists()) {
            throw ValidationException::withMessages([
                'otp' => 'Per questi dati esiste gia un account cittadino.',
            ]);
        }

        $citizen = DB::transaction(function () use ($invitation): Citizen {
            $citizen = Citizen::query()->create([
                'name' => $invitation->name,
                'email' => mb_strtolower(trim($invitation->email)),
                'phone_number' => $invitation->phone_number,
                'fiscal_code' => $invitation->normalized_fiscal_code,
                'last_login_at' => now(),
            ]);

            $invitation->forceFill([
                'citizen_id' => $citizen->id,
                'accepted_at' => now(),
                'completed_at' => now(),
                'otp_code_hash' => null,
                'otp_expires_at' => null,
            ])->save();

            return $citizen;
        });

        Auth::guard('citizen')->login($citizen);
        $request->session()->regenerate();
        $request->session()->forget('citizen_registration');

        return redirect()->intended(route('citizen.dashboard'));
    }

    private function shouldIssueOtp(CitizenRegistrationInvitation $invitation): bool
    {
        if ($invitation->otp_code_hash === null || $invitation->otp_expires_at === null) {
            return true;
        }

        if ($invitation->otp_expires_at->isPast()) {
            return true;
        }

        return $invitation->otp_sent_at === null
            || $invitation->otp_sent_at->lte(now()->subSeconds(config('auth.citizen.otp_resend_cooldown')));
    }
}
