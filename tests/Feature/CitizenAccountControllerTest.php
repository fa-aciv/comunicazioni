<?php

use App\Actions\Citizen\DeleteCitizenAccount;
use App\Actions\Citizen\UpdateCitizenAccount;
use App\Models\Citizen;
use Mockery\MockInterface;

test('citizens can update their own account contacts', function () {
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

    $mock = Mockery::mock(UpdateCitizenAccount::class, function (MockInterface $mock) use ($citizen): void {
        $mock->shouldReceive('handle')
            ->once()
            ->with($citizen, [
                'email' => 'nuova@example.com',
                'phoneNumber' => '+393331112233',
            ]);
    });

    $this->app->instance(UpdateCitizenAccount::class, $mock);

    $this->actingAs($citizen, 'citizen')
        ->patch(route('citizen.account.update'), [
            'email' => 'nuova@example.com',
            'phoneNumber' => '+393331112233',
        ])
        ->assertRedirect()
        ->assertSessionHas('status', 'I tuoi contatti sono stati aggiornati.');
});

test('citizens can delete their own account', function () {
    $citizen = new Citizen([
        'id' => 31,
        'name' => 'Mario Rossi',
        'email' => 'mario@example.com',
        'phone_number' => '+390916661111',
        'fiscal_code' => 'RSSMRA80A01H501U',
    ]);
    $citizen->id = 31;

    $mock = Mockery::mock(DeleteCitizenAccount::class, function (MockInterface $mock) use ($citizen): void {
        $mock->shouldReceive('handle')
            ->once()
            ->with($citizen);
    });

    $this->app->instance(DeleteCitizenAccount::class, $mock);

    $this->actingAs($citizen, 'citizen')
        ->delete(route('citizen.account.destroy'))
        ->assertRedirect(route('citizen.login'))
        ->assertSessionHas('status', 'Il tuo account è stato eliminato.');

    expect(auth('citizen')->check())->toBeFalse();
});
