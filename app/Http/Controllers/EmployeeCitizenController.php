<?php

namespace App\Http\Controllers;

use App\Models\Citizen;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EmployeeCitizenController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255', Rule::unique(Citizen::class, 'email')],
            'phoneNumber' => ['required', 'string', 'max:30', 'regex:/^\+?[0-9]+$/'],
            'fiscalCode' => ['required', 'string', 'size:16', 'regex:/^[A-Z0-9]{16}$/', Rule::unique(Citizen::class, 'fiscal_code')],
        ], [
            'phoneNumber.regex' => 'Il numero di telefono deve contenere solo cifre e l\'eventuale prefisso internazionale.',
            'fiscalCode.regex' => 'Il codice fiscale deve contenere 16 caratteri alfanumerici in maiuscolo.',
        ]);

        Citizen::query()->create([
            'name' => trim($validated['name']),
            'email' => mb_strtolower(trim($validated['email'])),
            'phone_number' => $validated['phoneNumber'],
            'fiscal_code' => strtoupper($validated['fiscalCode']),
        ]);

        return redirect()
            ->route('employee.dashboard')
            ->with('status', 'Cittadino registrato correttamente.');
    }
}
