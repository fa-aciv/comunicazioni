<?php

use App\Models\Citizen;
use App\Models\CitizenRegistrationInvitation;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\URL;

test('citizen can confirm a pending registration and the account is created only after otp verification', function () {
    $invitation = CitizenRegistrationInvitation::query()->create([
        'name' => 'Mario Rossi',
        'email' => 'mario.rossi@example.com',
        'phone_number' => '+390916661111',
        'fiscal_code' => 'RSSMRA80A01H501U',
        'otp_code_hash' => Hash::make('123456'),
        'magic_link_expires_at' => now()->addMinutes(30),
        'otp_sent_at' => now(),
        'otp_expires_at' => now()->addMinutes(5),
    ]);

    $signedUrl = URL::temporarySignedRoute(
        'citizen.registration.challenge',
        now()->addMinutes(30),
        ['invitation' => $invitation]
    );

    $this->get($signedUrl)
        ->assertOk();

    $this->post(route('citizen.registration.verify'), [
        'accept' => 'on',
        'otp' => '123456',
    ])->assertRedirect(route('citizen.dashboard'));

    $citizen = Citizen::query()->first();

    expect($citizen)->not->toBeNull()
        ->and($citizen?->email)->toBe('mario.rossi@example.com')
        ->and($citizen?->phone_number)->toBe('+390916661111')
        ->and($citizen?->normalized_fiscal_code)->toBe('RSSMRA80A01H501U');

    $this->assertAuthenticatedAs($citizen, 'citizen');

    $invitation->refresh();

    expect($invitation->citizen_id)->toBe($citizen?->id)
        ->and($invitation->accepted_at)->not->toBeNull()
        ->and($invitation->completed_at)->not->toBeNull();
});
