<?php

namespace App\Http\Controllers;

use App\Actions\Citizen\DeleteCitizenAccount;
use App\Actions\Citizen\UpdateCitizenAccount;
use App\Models\Citizen;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        UpdateCitizenAccount $updateCitizenAccount
    ): RedirectResponse {
        /** @var Citizen|null $citizen */
        $citizen = Auth::guard('citizen')->user();

        abort_unless($citizen instanceof Citizen, 403);

        $validated = $request->validate([
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

        $updateCitizenAccount->handle($citizen, $validated);

        return back()->with('status', 'I tuoi contatti sono stati aggiornati.');
    }

    public function destroy(
        Request $request,
        DeleteCitizenAccount $deleteCitizenAccount
    ): RedirectResponse {
        /** @var Citizen|null $citizen */
        $citizen = Auth::guard('citizen')->user();

        abort_unless($citizen instanceof Citizen, 403);

        $deleteCitizenAccount->handle($citizen);

        Auth::guard('citizen')->logout();
        $request->session()->forget('citizen_auth');
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()
            ->route('citizen.login')
            ->with('status', 'Il tuo account è stato eliminato.');
    }
}
