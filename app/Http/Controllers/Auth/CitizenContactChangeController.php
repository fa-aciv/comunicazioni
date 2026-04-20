<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Citizen\UpdateCitizenAccount;
use App\Http\Controllers\Controller;
use App\Models\Citizen;
use App\Models\CitizenContactChangeRequest;
use App\Services\EsendexSmsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CitizenContactChangeController extends Controller
{
    public function show(
        Request $request,
        CitizenContactChangeRequest $changeRequest
    ): Response|RedirectResponse {
        $changeRequest->loadMissing('citizen');

        if ($changeRequest->completed_at !== null || $changeRequest->isExpired() || ! $changeRequest->citizen) {
            return redirect()
                ->route('citizen.login')
                ->withErrors(['email' => 'Il link di conferma non è piu valido.']);
        }

        if (blank($changeRequest->verification_phone_number)) {
            return redirect()
                ->route('citizen.login')
                ->withErrors(['email' => 'Per questa modifica non è disponibile un numero di cellulare per la verifica.']);
        }

        if ($this->shouldIssueOtp($changeRequest)) {
            $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            $changeRequest->forceFill([
                'otp_code_hash' => Hash::make($otp),
                'otp_sent_at' => now(),
                'otp_expires_at' => now()->addMinutes(config('auth.citizen.otp_expire')),
            ])->save();

            $message = str_replace(
                [':app', ':otp'],
                [config('app.name'), $otp],
                (string) config('services.esendex.otp_template')
            );

            $smsResult = app(EsendexSmsService::class)
                ->sendSms($changeRequest->verification_phone_number, $message);

            if (! ($smsResult['ok'] ?? false)) {
                report(new \RuntimeException('Citizen contact change OTP SMS delivery failed.'));

                return redirect()
                    ->route('citizen.login')
                    ->withErrors([
                        'email' => 'Non è stato possibile inviare il codice OTP. Riprova tra qualche minuto.',
                    ]);
            }
        }

        $changeRequest->forceFill([
            'magic_link_opened_at' => $changeRequest->magic_link_opened_at ?? now(),
            'last_ip_address' => $request->ip(),
        ])->save();

        $request->session()->put('citizen_contact_change.request_id', $changeRequest->id);

        return Inertia::render('auth/citizen-contact-change-challenge', [
            'changeRequest' => [
                'name' => $changeRequest->citizen->name,
                'email' => $changeRequest->new_email,
                'phoneNumber' => $changeRequest->new_phone_number,
                'fiscalCode' => $changeRequest->citizen->normalized_fiscal_code,
                'maskedPhoneNumber' => $changeRequest->masked_verification_phone_number,
            ],
            'expiresAt' => optional($changeRequest->otp_expires_at)?->toIso8601String(),
            'status' => $request->session()->get('status', 'Ti abbiamo inviato un codice OTP via SMS.'),
        ]);
    }

    public function verify(
        Request $request,
        UpdateCitizenAccount $updateCitizenAccount
    ): RedirectResponse {
        $validated = $request->validate([
            'accept' => ['accepted'],
            'otp' => ['required', 'string', 'size:6'],
        ], [
            'accept.accepted' => 'Devi confermare le modifiche richieste prima di applicarle.',
        ]);

        /** @var CitizenContactChangeRequest|null $changeRequest */
        $changeRequest = CitizenContactChangeRequest::query()
            ->with('citizen')
            ->find($request->session()->get('citizen_contact_change.request_id'));

        if (! $changeRequest || ! $changeRequest->citizen || ! $changeRequest->isOpen()) {
            throw ValidationException::withMessages([
                'otp' => 'Sessione di conferma non valida. Apri di nuovo il link ricevuto via email.',
            ]);
        }

        if ($changeRequest->otp_expires_at === null || $changeRequest->otp_expires_at->isPast()) {
            throw ValidationException::withMessages([
                'otp' => 'Il codice OTP è scaduto. Apri di nuovo il link ricevuto via email.',
            ]);
        }

        if (! Hash::check($validated['otp'], (string) $changeRequest->otp_code_hash)) {
            throw ValidationException::withMessages([
                'otp' => 'Codice OTP non valido.',
            ]);
        }

        if (Citizen::query()
            ->where('email', $changeRequest->new_email)
            ->whereKeyNot($changeRequest->citizen->id)
            ->exists()) {
            throw ValidationException::withMessages([
                'otp' => 'L\'email scelta è gia associata a un altro account.',
            ]);
        }

        $updateCitizenAccount->handle($changeRequest->citizen, [
            'email' => $changeRequest->new_email,
            'phoneNumber' => $changeRequest->new_phone_number,
        ]);

        $changeRequest->forceFill([
            'completed_at' => now(),
            'otp_code_hash' => null,
            'otp_expires_at' => null,
        ])->save();

        Auth::guard('citizen')->login($changeRequest->citizen);
        $request->session()->regenerate();
        $request->session()->forget('citizen_contact_change');

        return redirect()
            ->route('citizen.account.index')
            ->with('status', 'I tuoi contatti sono stati aggiornati.');
    }

    private function shouldIssueOtp(CitizenContactChangeRequest $changeRequest): bool
    {
        if ($changeRequest->otp_code_hash === null || $changeRequest->otp_expires_at === null) {
            return true;
        }

        if ($changeRequest->otp_expires_at->isPast()) {
            return true;
        }

        return $changeRequest->otp_sent_at === null
            || $changeRequest->otp_sent_at->lte(now()->subSeconds(config('auth.citizen.otp_resend_cooldown')));
    }
}
