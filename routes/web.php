<?php

use App\Http\Controllers\Auth\CitizenAuthController;
use App\Http\Controllers\Auth\CitizenAccountDeletionController;
use App\Http\Controllers\Auth\CitizenContactChangeController;
use App\Http\Controllers\Auth\CitizenRegistrationController;
use App\Http\Controllers\Auth\EmployeeSessionController;
use App\Http\Controllers\ChatAttachmentController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\CitizenAccountController;
use App\Http\Controllers\CitizenChatIndexController;
use App\Http\Controllers\CitizenDashboardController;
use App\Http\Controllers\EmployeeChatIndexController;
use App\Http\Controllers\EmployeeDashboardController;
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
    Route::get('account/delete/{deletionRequest}', [CitizenAccountDeletionController::class, 'show'])
        ->middleware('signed')
        ->name('account.deletion.challenge');
    Route::post('account/delete/verify', [CitizenAccountDeletionController::class, 'verify'])
        ->middleware('throttle:citizen-account-deletion-verify')
        ->name('account.deletion.verify');
    Route::get('account/change/{changeRequest}', [CitizenContactChangeController::class, 'show'])
        ->middleware('signed')
        ->name('account.change.challenge');
    Route::post('account/change/verify', [CitizenContactChangeController::class, 'verify'])
        ->middleware('throttle:citizen-contact-change-verify')
        ->name('account.change.verify');

    Route::middleware(['guest:citizen'])->group(function () {
        Route::get('login', [CitizenAuthController::class, 'create'])->name('login');
        Route::post('login/link', [CitizenAuthController::class, 'requestMagicLink'])
            ->middleware('throttle:citizen-link')
            ->name('login.link');
        Route::get('register/challenge/{invitation}', [CitizenRegistrationController::class, 'show'])
            ->middleware('signed')
            ->name('registration.challenge');
        Route::post('register/verify', [CitizenRegistrationController::class, 'verify'])
            ->middleware('throttle:citizen-registration-verify')
            ->name('registration.verify');
        Route::get('login/challenge/{challenge}', [CitizenAuthController::class, 'showChallenge'])
            ->middleware('signed')
            ->name('login.challenge');
        Route::post('login/verify', [CitizenAuthController::class, 'verify'])
            ->middleware('throttle:citizen-verify')
            ->name('login.verify');
    });

    Route::middleware(['auth.guard:citizen', 'auth:citizen'])->group(function () {
        Route::get('dashboard', CitizenDashboardController::class)->name('dashboard');
        Route::get('chats', CitizenChatIndexController::class)->name('chats.index');
        Route::get('attachments/{attachment}', [ChatAttachmentController::class, 'show'])->name('attachments.show');
        Route::get('attachments/{attachment}/download', [ChatAttachmentController::class, 'download'])->name('attachments.download');
        Route::post('chats/{chat}/messages', [ChatController::class, 'storeMessage'])->name('chats.messages.store');
        Route::delete('chats/{chat}/messages/{message}', [ChatController::class, 'deleteMessage'])->name('chats.messages.destroy');
        Route::delete('chats/{chat}', [ChatController::class, 'destroyThread'])->name('chats.destroy');
        Route::get('account', [CitizenAccountController::class, 'index'])->name('account.index');
        Route::patch('account', [CitizenAccountController::class, 'update'])->name('account.update');
        Route::delete('account', [CitizenAccountController::class, 'destroy'])->name('account.destroy');

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
        Route::get('dashboard', EmployeeDashboardController::class)->name('dashboard');
        Route::get('chats', EmployeeChatIndexController::class)->name('chats.index');
        Route::get('attachments/{attachment}', [ChatAttachmentController::class, 'show'])->name('attachments.show');
        Route::get('attachments/{attachment}/download', [ChatAttachmentController::class, 'download'])->name('attachments.download');
        Route::post('chats', [ChatController::class, 'storeThread'])->name('chats.store');
        Route::delete('chats/{chat}', [ChatController::class, 'destroyThread'])->name('chats.destroy');
        Route::post('chats/{chat}/messages', [ChatController::class, 'storeMessage'])->name('chats.messages.store');
        Route::delete('chats/{chat}/messages/{message}', [ChatController::class, 'deleteMessage'])->name('chats.messages.destroy');
        Route::post('chats/{chat}/participants', [ChatController::class, 'storeParticipant'])->name('chats.participants.store');
        Route::delete('chats/{chat}/participants/{employee}', [ChatController::class, 'destroyParticipant'])->name('chats.participants.destroy');
        Route::get('citizens', [EmployeeCitizenController::class, 'index'])->name('citizens.index');
        Route::get('citizens/create', [EmployeeCitizenController::class, 'create'])->name('citizens.create');
        Route::post('citizens', [EmployeeCitizenController::class, 'store'])->name('citizens.store');
        Route::get('citizens/{citizen}/edit', [EmployeeCitizenController::class, 'edit'])->name('citizens.edit');
        Route::patch('citizens/{citizen}', [EmployeeCitizenController::class, 'update'])->name('citizens.update');

        Route::post('logout', [EmployeeSessionController::class, 'destroy'])->name('logout');
    });
});
