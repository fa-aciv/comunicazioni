<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Citizen\DeleteCitizenAccount;
use App\Http\Controllers\Controller;
use App\Models\CitizenAccountDeletionRequest;
use App\Services\EsendexSmsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CitizenAccountDeletionController extends Controller
{
    public function show(
        Request $request,
        CitizenAccountDeletionRequest $deletionRequest,
        EsendexSmsService $smsSender
    ): Response|RedirectResponse {
        $deletionRequest->loadMissing('citizen');

        if ($deletionRequest->completed_at !== null || $deletionRequest->isExpired() || ! $deletionRequest->citizen) {
            return redirect()
                ->route('citizen.login')
                ->withErrors(['email' => 'Il link di conferma non è piu valido.']);
        }

        if (blank($deletionRequest->verification_phone_number)) {
            return redirect()
                ->route('citizen.login')
                ->withErrors(['email' => 'Per questa richiesta non è disponibile un numero di cellulare per la verifica.']);
        }

        if ($this->shouldIssueOtp($deletionRequest)) {
            $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            $deletionRequest->forceFill([
                'otp_code_hash' => Hash::make($otp),
                'otp_sent_at' => now(),
                'otp_expires_at' => now()->addMinutes(config('auth.citizen.otp_expire')),
            ])->save();

            $message = str_replace(
                [':app', ':otp'],
                [config('app.name'), $otp],
                (string) config('services.esendex.otp_template')
            );

            $smsResult = $smsSender->sendSms($deletionRequest->verification_phone_number, $message);

            if (! ($smsResult['ok'] ?? false)) {
                report(new \RuntimeException('Citizen account deletion OTP SMS delivery failed.'));

                return redirect()
                    ->route('citizen.login')
                    ->withErrors([
                        'email' => 'Non è stato possibile inviare il codice OTP. Riprova tra qualche minuto.',
                    ]);
            }
        }

        $deletionRequest->forceFill([
            'magic_link_opened_at' => $deletionRequest->magic_link_opened_at ?? now(),
            'last_ip_address' => $request->ip(),
        ])->save();

        $request->session()->put('citizen_account_deletion.request_id', $deletionRequest->id);

        return Inertia::render('auth/citizen-account-deletion-challenge', [
            'deletionRequest' => [
                'name' => $deletionRequest->citizen->name,
                'email' => $deletionRequest->verification_email,
                'maskedPhoneNumber' => $deletionRequest->masked_verification_phone_number,
            ],
            'expiresAt' => optional($deletionRequest->otp_expires_at)?->toIso8601String(),
            'status' => $request->session()->get('status', 'Ti abbiamo inviato un codice OTP via SMS.'),
        ]);
    }

    public function verify(
        Request $request,
        DeleteCitizenAccount $deleteCitizenAccount
    ): RedirectResponse {
        $validated = $request->validate([
            'accept' => ['accepted'],
            'otp' => ['required', 'string', 'size:6'],
        ], [
            'accept.accepted' => 'Devi confermare l’eliminazione del tuo account prima di procedere.',
        ]);

        /** @var CitizenAccountDeletionRequest|null $deletionRequest */
        $deletionRequest = CitizenAccountDeletionRequest::query()
            ->with('citizen')
            ->find($request->session()->get('citizen_account_deletion.request_id'));

        if (! $deletionRequest || ! $deletionRequest->citizen || ! $deletionRequest->isOpen()) {
            throw ValidationException::withMessages([
                'otp' => 'Sessione di conferma non valida. Apri di nuovo il link ricevuto via email.',
            ]);
        }

        if ($deletionRequest->otp_expires_at === null || $deletionRequest->otp_expires_at->isPast()) {
            throw ValidationException::withMessages([
                'otp' => 'Il codice OTP è scaduto. Apri di nuovo il link ricevuto via email.',
            ]);
        }

        if (! Hash::check($validated['otp'], (string) $deletionRequest->otp_code_hash)) {
            throw ValidationException::withMessages([
                'otp' => 'Codice OTP non valido.',
            ]);
        }

        $citizen = $deletionRequest->citizen;

        $deletionRequest->forceFill([
            'completed_at' => now(),
            'otp_code_hash' => null,
            'otp_expires_at' => null,
        ])->save();

        $deleteCitizenAccount->handle($citizen);

        Auth::guard('citizen')->logout();
        $request->session()->forget([
            'citizen_auth',
            'citizen_contact_change',
            'citizen_account_deletion',
        ]);
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()
            ->route('citizen.login')
            ->with('status', 'Il tuo account è stato eliminato.');
    }

    private function shouldIssueOtp(CitizenAccountDeletionRequest $deletionRequest): bool
    {
        if ($deletionRequest->otp_code_hash === null || $deletionRequest->otp_expires_at === null) {
            return true;
        }

        if ($deletionRequest->otp_expires_at->isPast()) {
            return true;
        }

        return $deletionRequest->otp_sent_at === null
            || $deletionRequest->otp_sent_at->lte(now()->subSeconds(config('auth.citizen.otp_resend_cooldown')));
    }
}
