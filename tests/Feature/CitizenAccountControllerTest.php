<?php

use App\Actions\Citizen\DeleteCitizenAccount;
use App\Actions\Citizen\RequestCitizenAccountDeletion;
use App\Actions\Citizen\RequestCitizenContactChange;
use App\Models\Citizen;
use App\Models\CitizenAccountDeletionRequest;
use App\Models\CitizenContactChangeRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\URL;
use Mockery\MockInterface;

test('citizens can request confirmation for updating their own account contacts', function () {
    if (! extension_loaded('pdo_sqlite')) {
        test()->markTestSkipped('pdo_sqlite extension is required for account update validation.');
    }

    $citizen = new Citizen([
        'id' => 31,
        'name' => 'Mario Rossi',
        'email' => 'mario@example.com',
        'phone_number' => '+390916661111',
        'fiscal_code' => 'RSSMRA80A01H501U',
    ]);
    $citizen->id = 31;

    $mock = Mockery::mock(RequestCitizenContactChange::class, function (MockInterface $mock) use ($citizen): void {
        $mock->shouldReceive('handle')
            ->once()
            ->with($citizen, [
                'email' => 'nuova@example.com',
                'phoneNumber' => '+393331112233',
            ]);
    });

    $this->app->instance(RequestCitizenContactChange::class, $mock);

    $this->actingAs($citizen, 'citizen')
        ->patch(route('citizen.account.update'), [
            'email' => 'nuova@example.com',
            'phoneNumber' => '+393331112233',
        ])
        ->assertRedirect()
        ->assertSessionHas('status', 'Ti abbiamo inviato una email di conferma. Le modifiche saranno applicate dopo la verifica con OTP SMS.');
});

test('citizens can request confirmation for deleting their own account', function () {
    $citizen = new Citizen([
        'id' => 31,
        'name' => 'Mario Rossi',
        'email' => 'mario@example.com',
        'phone_number' => '+390916661111',
        'fiscal_code' => 'RSSMRA80A01H501U',
    ]);
    $citizen->id = 31;

    $mock = Mockery::mock(RequestCitizenAccountDeletion::class, function (MockInterface $mock) use ($citizen): void {
        $mock->shouldReceive('handle')
            ->once()
            ->with($citizen);
    });

    $this->app->instance(RequestCitizenAccountDeletion::class, $mock);

    $this->actingAs($citizen, 'citizen')
        ->delete(route('citizen.account.destroy'))
        ->assertRedirect()
        ->assertSessionHas('status', 'Ti abbiamo inviato una email di conferma. L’account verrà eliminato dopo la verifica con OTP SMS.');

    expect(auth('citizen')->check())->toBeTrue();
});

test('citizens can confirm a pending contact change before the new contacts are applied', function () {
    if (! extension_loaded('pdo_sqlite')) {
        test()->markTestSkipped('pdo_sqlite extension is required for contact change confirmation.');
    }

    config()->set('services.esendex.api_url', null);
    config()->set('services.esendex.user_key', null);
    config()->set('services.esendex.access_token', null);

    $citizen = Citizen::query()->create([
        'name' => 'Mario Rossi',
        'email' => 'mario@example.com',
        'phone_number' => '+390916661111',
        'fiscal_code' => 'RSSMRA80A01H501U',
    ]);

    $changeRequest = CitizenContactChangeRequest::query()->create([
        'citizen_id' => $citizen->id,
        'new_email' => 'nuova@example.com',
        'new_phone_number' => '+393331112233',
        'verification_email' => 'nuova@example.com',
        'verification_phone_number' => '+393331112233',
        'otp_code_hash' => Hash::make('123456'),
        'magic_link_expires_at' => now()->addMinutes(30),
        'otp_sent_at' => now(),
        'otp_expires_at' => now()->addMinutes(5),
    ]);

    $signedUrl = URL::temporarySignedRoute(
        'citizen.account.change.challenge',
        now()->addMinutes(30),
        ['changeRequest' => $changeRequest]
    );

    $this->get($signedUrl)->assertOk();

    $this->post(route('citizen.account.change.verify'), [
        'accept' => 'on',
        'otp' => '123456',
    ])->assertRedirect(route('citizen.account.index'));

    $citizen->refresh();
    $changeRequest->refresh();

    expect($citizen->email)->toBe('nuova@example.com')
        ->and($citizen->phone_number)->toBe('+393331112233')
        ->and($changeRequest->completed_at)->not->toBeNull();
});

test('citizens can confirm a pending account deletion before the account is removed', function () {
    if (! extension_loaded('pdo_sqlite')) {
        test()->markTestSkipped('pdo_sqlite extension is required for account deletion confirmation.');
    }

    config()->set('services.esendex.api_url', null);
    config()->set('services.esendex.user_key', null);
    config()->set('services.esendex.access_token', null);

    $citizen = Citizen::query()->create([
        'name' => 'Mario Rossi',
        'email' => 'mario@example.com',
        'phone_number' => '+390916661111',
        'fiscal_code' => 'RSSMRA80A01H501U',
    ]);

    $deletionRequest = CitizenAccountDeletionRequest::query()->create([
        'citizen_id' => $citizen->id,
        'verification_email' => $citizen->email,
        'verification_phone_number' => $citizen->phone_number,
        'otp_code_hash' => Hash::make('123456'),
        'magic_link_expires_at' => now()->addMinutes(30),
        'otp_sent_at' => now(),
        'otp_expires_at' => now()->addMinutes(5),
    ]);

    $signedUrl = URL::temporarySignedRoute(
        'citizen.account.deletion.challenge',
        now()->addMinutes(30),
        ['deletionRequest' => $deletionRequest]
    );

    $this->get($signedUrl)->assertOk();

    $this->post(route('citizen.account.deletion.verify'), [
        'accept' => 'on',
        'otp' => '123456',
    ])->assertRedirect(route('citizen.login'));

    expect(Citizen::query()->find($citizen->id))->toBeNull();
});
