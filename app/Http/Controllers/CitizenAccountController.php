<?php

namespace App\Http\Controllers;

use App\Actions\Citizen\DeleteCitizenAccount;
use App\Actions\Citizen\RequestCitizenAccountDeletion;
use App\Actions\Citizen\RequestCitizenContactChange;
use App\Exceptions\NotificationDeliveryException;
use App\Models\CitizenContactChangeRequest;
use App\Models\Citizen;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CitizenAccountController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var Citizen|null $citizen */
        $citizen = Auth::guard('citizen')->user();

        abort_unless($citizen instanceof Citizen, 403);

        return Inertia::render('citizen/account/index', [
            'status' => $request->session()->get('status'),
            'citizen' => [
                'name' => $citizen->name,
                'email' => $citizen->email,
                'phoneNumber' => $citizen->phone_number,
                'fiscalCode' => $citizen->normalized_fiscal_code,
                'lastLoginAt' => $citizen->last_login_at?->toIso8601String(),
            ],
        ]);
    }

    public function update(
        Request $request,
        RequestCitizenContactChange $requestCitizenContactChange
    ): RedirectResponse {
        /** @var Citizen|null $citizen */
        $citizen = Auth::guard('citizen')->user();

        abort_unless($citizen instanceof Citizen, 403);

        $validator = Validator::make($request->all(), [
            'email' => [
                'required',
                'email:rfc',
                'max:255',
                Rule::unique(Citizen::class, 'email')->ignore($citizen),
            ],
            'phoneNumber' => ['required', 'string', 'max:30', 'regex:/^\+?[0-9]+$/'],
        ], [
            'phoneNumber.regex' => 'Il numero di telefono deve contenere solo cifre e l\'eventuale prefisso internazionale.',
        ]);

        $validator->after(function ($validator) use ($request, $citizen): void {
            $email = mb_strtolower(trim((string) $request->input('email')));

            if ($email !== '' && CitizenContactChangeRequest::query()
                ->where('citizen_id', '!=', $citizen->id)
                ->whereNull('completed_at')
                ->where('magic_link_expires_at', '>', now())
                ->where('new_email', $email)
                ->exists()) {
                $validator->errors()->add('email', 'Esiste gia una richiesta di modifica in attesa per questa email.');
            }
        });

        $validated = $validator->validate();

        $normalizedEmail = mb_strtolower(trim($validated['email']));
        $normalizedPhoneNumber = $validated['phoneNumber'];

        if ($normalizedEmail === $citizen->email && $normalizedPhoneNumber === $citizen->phone_number) {
            return back()->with('status', 'Nessuna modifica da confermare.');
        }

        try {
            $requestCitizenContactChange->handle($citizen, $validated);
        } catch (NotificationDeliveryException $exception) {
            return back()
                ->withInput($request->only(['email', 'phoneNumber']))
                ->withErrors([
                    'email' => $exception->getMessage(),
                ]);
        }

        return back()->with('status', 'Ti abbiamo inviato una email di conferma. Le modifiche saranno applicate dopo la verifica con OTP SMS.');
    }

    public function destroy(
        Request $request,
        RequestCitizenAccountDeletion $requestCitizenAccountDeletion
    ): RedirectResponse {
        /** @var Citizen|null $citizen */
        $citizen = Auth::guard('citizen')->user();

        abort_unless($citizen instanceof Citizen, 403);

        try {
            $requestCitizenAccountDeletion->handle($citizen);
        } catch (NotificationDeliveryException $exception) {
            return back()->withErrors([
                'account' => $exception->getMessage(),
            ]);
        }

        return back()->with('status', 'Ti abbiamo inviato una email di conferma. L’account verrà eliminato dopo la verifica con OTP SMS.');
    }
}
