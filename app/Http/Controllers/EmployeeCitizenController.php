<?php

namespace App\Http\Controllers;

use App\Exceptions\NotificationDeliveryException;
use App\Models\CitizenRegistrationInvitation;
use App\Models\Citizen;
use App\Notifications\SendCitizenRegistrationInvitation;
use App\Services\NotificationDeliveryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeCitizenController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
        ]);

        $search = trim((string) ($validated['search'] ?? ''));
        $resultsLimit = 50;

        $citizens = Citizen::query()
            ->select([
                'uuid',
                'name',
                'email',
                'phone_number',
                'fiscal_code',
                'last_login_at',
            ])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($subQuery) use ($search): void {
                    $likeSearch = '%'.$search.'%';

                    $subQuery
                        ->where('name', 'like', $likeSearch)
                        ->orWhere('email', 'like', $likeSearch)
                        ->orWhere('phone_number', 'like', $likeSearch)
                        ->orWhere('fiscal_code', 'like', strtoupper($likeSearch));
                });
            })
            ->orderBy('name')
            ->limit($resultsLimit)
            ->get()
            ->map(fn (Citizen $citizen) => [
                'uuid' => $citizen->uuid,
                'name' => $citizen->name,
                'email' => $citizen->email,
                'phoneNumber' => $citizen->phone_number,
                'fiscalCode' => $citizen->normalized_fiscal_code,
                'lastLoginAt' => $citizen->last_login_at?->toIso8601String(),
            ])
            ->values();

        return Inertia::render('employee/citizens/index', [
            'status' => $request->session()->get('status'),
            'filters' => [
                'search' => $search,
            ],
            'resultsLimit' => $resultsLimit,
            'citizens' => $citizens,
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('employee/citizens/create', [
            'status' => $request->session()->get('status'),
        ]);
    }

    public function store(
        Request $request,
        NotificationDeliveryService $notifications
    ): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc', 'max:255', Rule::unique(Citizen::class, 'email')],
            'phoneNumber' => ['required', 'string', 'max:30', 'regex:/^\+?[0-9]+$/'],
            'fiscalCode' => ['required', 'string', 'size:16', 'regex:/^[A-Z0-9]{16}$/', Rule::unique(Citizen::class, 'fiscal_code')],
        ], [
            'phoneNumber.regex' => 'Il numero di telefono deve contenere solo cifre e l\'eventuale prefisso internazionale.',
            'fiscalCode.regex' => 'Il codice fiscale deve contenere 16 caratteri alfanumerici in maiuscolo.',
        ]);

        $validator->after(function ($validator) use ($request): void {
            $email = mb_strtolower(trim((string) $request->input('email')));
            $fiscalCode = strtoupper(trim((string) $request->input('fiscalCode')));

            if ($email !== '' && CitizenRegistrationInvitation::query()
                ->whereNull('completed_at')
                ->where('magic_link_expires_at', '>', now())
                ->where('email', $email)
                ->exists()) {
                $validator->errors()->add('email', 'Esiste gia una registrazione cittadino in attesa di conferma per questa email.');
            }

            if ($fiscalCode !== '' && CitizenRegistrationInvitation::query()
                ->whereNull('completed_at')
                ->where('magic_link_expires_at', '>', now())
                ->where('fiscal_code', $fiscalCode)
                ->exists()) {
                $validator->errors()->add('fiscalCode', 'Esiste gia una registrazione cittadino in attesa di conferma per questo codice fiscale.');
            }
        });

        $validated = $validator->validate();

        $invitation = CitizenRegistrationInvitation::query()->create([
            'name' => trim($validated['name']),
            'email' => mb_strtolower(trim($validated['email'])),
            'phone_number' => $validated['phoneNumber'],
            'fiscal_code' => strtoupper($validated['fiscalCode']),
            'magic_link_expires_at' => now()->addMinutes(config('auth.citizen.magic_link_expire')),
        ]);

        try {
            $notifications->send(
                $invitation,
                new SendCitizenRegistrationInvitation($invitation),
                'Non è stato possibile inviare l\'email di invito. Riprova tra qualche minuto.'
            );
        } catch (NotificationDeliveryException $exception) {
            $invitation->delete();

            return redirect()
                ->route('employee.citizens.create')
                ->withInput()
                ->withErrors([
                    'email' => $exception->getMessage(),
                ]);
        }

        return redirect()
            ->route('employee.citizens.index')
            ->with('status', 'Invito inviato al cittadino. L\'account verra creato dopo la conferma dei dati via email e OTP SMS.');
    }

    public function edit(Request $request, Citizen $citizen): Response
    {
        return Inertia::render('employee/citizens/edit', [
            'status' => $request->session()->get('status'),
            'citizen' => [
                'uuid' => $citizen->uuid,
                'name' => $citizen->name,
                'email' => $citizen->email,
                'phoneNumber' => $citizen->phone_number,
                'fiscalCode' => $citizen->normalized_fiscal_code,
                'lastLoginAt' => $citizen->last_login_at?->toIso8601String(),
            ],
        ]);
    }

    public function update(Request $request, Citizen $citizen): RedirectResponse
    {
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

        $citizen->update([
            'email' => mb_strtolower(trim($validated['email'])),
            'phone_number' => $validated['phoneNumber'],
        ]);

        return back()->with('status', 'Account del cittadino aggiornato correttamente.');
    }
}
