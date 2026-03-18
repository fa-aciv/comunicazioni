<?php

use App\Http\Controllers\Auth\CitizenAuthController;
use App\Http\Controllers\Auth\EmployeeSessionController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\EmployeeCitizenController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'hasCitizenSession' => Auth::guard('citizen')->check(),
        'hasEmployeeSession' => Auth::guard('employee')->check(),
    ]);
})->name('home');

Route::get('/dashboard', function () {
    if (Auth::guard('employee')->check()) {
        return redirect()->route('employee.dashboard');
    }

    if (Auth::guard('citizen')->check()) {
        return redirect()->route('citizen.dashboard');
    }

    return redirect()->route('home');
})->name('dashboard');

Route::prefix('citizen')->name('citizen.')->group(function () {
    Route::middleware(['guest:citizen'])->group(function () {
        Route::get('login', [CitizenAuthController::class, 'create'])->name('login');
        Route::post('login/link', [CitizenAuthController::class, 'requestMagicLink'])
            ->middleware('throttle:citizen-link')
            ->name('login.link');
        Route::get('login/challenge/{challenge}', [CitizenAuthController::class, 'showChallenge'])
            ->middleware('signed')
            ->name('login.challenge');
        Route::post('login/verify', [CitizenAuthController::class, 'verify'])
            ->middleware('throttle:citizen-verify')
            ->name('login.verify');
    });

    Route::middleware(['auth.guard:citizen', 'auth:citizen'])->group(function () {
        Route::get('dashboard', function () {
            return Inertia::render('portal/dashboard', [
                'portal' => [
                    'name' => 'citizen',
                    'title' => 'Area cittadini',
                    'description' => 'Consulta i servizi e le comunicazioni dedicate ai cittadini.',
                    'highlights' => [
                        ['title' => 'Accesso sicuro', 'description' => 'Login con magic link, codice fiscale e OTP via SMS.'],
                        ['title' => 'Sessione dedicata', 'description' => 'La tua sessione rimane separata da quella del personale interno.'],
                        ['title' => 'Servizi mirati', 'description' => 'Questa area puo ospitare solo funzionalita per i cittadini.'],
                    ],
                ],
            ]);
        })->name('dashboard');
        Route::post('chats/{chat}/messages', [ChatController::class, 'storeMessage'])->name('chats.messages.store');

        Route::post('logout', [CitizenAuthController::class, 'destroy'])->name('logout');
    });
});

Route::prefix('employee')->name('employee.')->group(function () {
    Route::middleware(['guest:employee'])->group(function () {
        Route::get('login', [EmployeeSessionController::class, 'create'])->name('login');
        Route::post('login', [EmployeeSessionController::class, 'store'])
            ->middleware('throttle:employee-login')
            ->name('login.store');
    });

    Route::middleware(['auth.guard:employee', 'auth:employee'])->group(function () {
        Route::get('dashboard', function () {
            return Inertia::render('employee/dashboard', [
                'status' => session('status'),
            ]);
        })->name('dashboard');
        Route::post('chats', [ChatController::class, 'storeThread'])->name('chats.store');
        Route::post('chats/{chat}/messages', [ChatController::class, 'storeMessage'])->name('chats.messages.store');
        Route::post('citizens', [EmployeeCitizenController::class, 'store'])->name('citizens.store');

        Route::post('logout', [EmployeeSessionController::class, 'destroy'])->name('logout');
    });
});
