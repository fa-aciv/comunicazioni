<?php

use App\Models\Citizen;
use App\Models\CitizenLoginChallenge;
use Illuminate\Contracts\Notifications\Dispatcher;
use Mockery\MockInterface;
use Symfony\Component\Mailer\Exception\TransportException;

test('citizen login screen can be rendered', function () {
    $this->get(route('citizen.login'))
        ->assertOk();
});

test('citizen login link request fails gracefully when mail delivery is unavailable', function () {
    $citizen = Citizen::factory()->create([
        'email' => 'mario@example.com',
    ]);

    $mock = Mockery::mock(Dispatcher::class, function (MockInterface $mock): void {
        $mock->shouldReceive('send')
            ->once()
            ->andThrow(new TransportException('Connection refused'));
    });

    $this->app->instance(Dispatcher::class, $mock);

    $this->from(route('citizen.login'))
        ->post(route('citizen.login.link'), [
            'email' => $citizen->email,
        ])
        ->assertRedirect(route('citizen.login'))
        ->assertSessionHasErrors(['email']);

    expect(CitizenLoginChallenge::query()->count())->toBe(0);
});

test('citizen otp verification validates required fields before loading a challenge', function () {
    $this->from(route('citizen.login'))
        ->post(route('citizen.login.verify'), [])
        ->assertRedirect(route('citizen.login'))
        ->assertSessionHasErrors(['fiscal_code', 'otp']);
});

test('guests are redirected to the citizen login page for the citizen portal', function () {
    $this->get(route('citizen.dashboard'))
        ->assertRedirect(route('citizen.login'));
});

test('guests are redirected to the citizen login page for citizen chats', function () {
    $this->get(route('citizen.chats.index'))
        ->assertRedirect(route('citizen.login'));
});

test('guests are redirected to the citizen login page for the citizen account page', function () {
    $this->get(route('citizen.account.index'))
        ->assertRedirect(route('citizen.login'));
});

test('guests are redirected to the citizen login page for citizen account deletion', function () {
    $this->delete(route('citizen.account.destroy'))
        ->assertRedirect(route('citizen.login'));
});

test('guests are redirected to the citizen login page for citizen account updates', function () {
    $this->patch(route('citizen.account.update'), [
        'email' => 'mario@example.com',
        'phoneNumber' => '+390916661111',
    ])->assertRedirect(route('citizen.login'));
});
