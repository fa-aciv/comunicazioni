<?php

use App\Models\Citizen;
use App\Models\CitizenRegistrationInvitation;
use App\Notifications\SendCitizenRegistrationInvitation;
use App\Models\User;
use Illuminate\Contracts\Notifications\Dispatcher;
use Illuminate\Support\Facades\Notification;
use Mockery\MockInterface;
use Symfony\Component\Mailer\Exception\TransportException;

test('guests cannot register citizens from the employee area', function () {
    $this->post(route('employee.citizens.store'), [
        'name' => 'Mario Rossi',
        'email' => 'mario.rossi@example.com',
        'phoneNumber' => '+390916661111',
        'fiscalCode' => 'RSSMRA80A01H501U',
    ])->assertRedirect(route('employee.login'));
});

test('employee citizen registration validates required fields', function () {
    $this->from(route('employee.citizens.create'))
        ->actingAs(new User([
            'name' => 'Operatore',
            'email' => 'operatore@example.com',
            'password' => 'password',
        ]), 'employee')
        ->post(route('employee.citizens.store'), [])
        ->assertRedirect(route('employee.citizens.create'))
        ->assertSessionHasErrors(['name', 'email', 'phoneNumber', 'fiscalCode']);
});

test('employee citizen registration sends a confirmation invite and does not create the account immediately', function () {
    Notification::fake();

    $this->actingAs(new User([
        'name' => 'Operatore',
        'email' => 'operatore@example.com',
        'password' => 'password',
    ]), 'employee')
        ->post(route('employee.citizens.store'), [
            'name' => 'Mario Rossi',
            'email' => 'mario.rossi@example.com',
            'phoneNumber' => '+390916661111',
            'fiscalCode' => 'RSSMRA80A01H501U',
        ])
        ->assertRedirect(route('employee.citizens.index'));

    expect(Citizen::query()->count())->toBe(0);

    $invitation = CitizenRegistrationInvitation::query()->first();

    expect($invitation)->not->toBeNull()
        ->and($invitation?->email)->toBe('mario.rossi@example.com')
        ->and($invitation?->completed_at)->toBeNull();

    Notification::assertSentTo($invitation, SendCitizenRegistrationInvitation::class);
});

test('employee citizen registration fails gracefully when invitation email cannot be delivered', function () {
    $mock = Mockery::mock(Dispatcher::class, function (MockInterface $mock): void {
        $mock->shouldReceive('send')
            ->once()
            ->andThrow(new TransportException('Connection refused'));
    });

    $this->app->instance(Dispatcher::class, $mock);

    $this->from(route('employee.citizens.create'))
        ->actingAs(new User([
            'name' => 'Operatore',
            'email' => 'operatore@example.com',
            'password' => 'password',
        ]), 'employee')
        ->post(route('employee.citizens.store'), [
            'name' => 'Mario Rossi',
            'email' => 'mario.rossi@example.com',
            'phoneNumber' => '+390916661111',
            'fiscalCode' => 'RSSMRA80A01H501U',
        ])
        ->assertRedirect(route('employee.citizens.create'))
        ->assertSessionHasErrors(['email']);

    expect(CitizenRegistrationInvitation::query()->count())->toBe(0);
});
