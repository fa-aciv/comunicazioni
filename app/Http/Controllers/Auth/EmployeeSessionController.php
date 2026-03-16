<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeSessionController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('auth/employee-login', [
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        $username = Str::lower(trim($validated['username']));
        $throttleKey = Str::transliterate($username.'|'.$request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            throw ValidationException::withMessages([
                'username' => "Troppi tentativi di accesso. Riprova tra {$seconds} secondi.",
            ]);
        }

        $authenticated = Auth::guard('employee')->attempt([
            'samaccountname' => $username,
            'password' => $validated['password'],
        ], (bool) ($validated['remember'] ?? false));

        if (! $authenticated) {
            RateLimiter::hit($throttleKey, 60);

            throw ValidationException::withMessages([
                'username' => 'Credenziali LDAP non valide.',
            ]);
        }

        RateLimiter::clear($throttleKey);
        $request->session()->regenerate();

        return redirect()->intended(route('employee.dashboard'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('employee')->logout();
        $request->session()->regenerateToken();

        return redirect()->route('employee.login');
    }
}
