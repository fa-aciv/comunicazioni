<?php

use Illuminate\Contracts\Auth\StatefulGuard;
use Illuminate\Support\Facades\Auth;

test('employee login screen can be rendered', function () {
    $this->get(route('employee.login'))
        ->assertOk();
});

test('employees can authenticate using ldap credentials', function () {
    $guard = Mockery::mock(StatefulGuard::class);
    $guard->shouldReceive('check')->once()->andReturnFalse();
    $guard->shouldReceive('attempt')->once()->andReturnTrue();
    $guard->shouldReceive('user')->andReturnNull();

    $citizenGuard = Mockery::mock(StatefulGuard::class);
    $citizenGuard->shouldReceive('user')->andReturnNull();

    Auth::shouldReceive('guard')
        ->with('employee')
        ->andReturn($guard);
    Auth::shouldReceive('guard')
        ->with('citizen')
        ->andReturn($citizenGuard);

    $this->post(route('employee.login.store'), [
        'username' => 'mario.rossi',
        'password' => 'secret',
    ])->assertRedirect(route('employee.dashboard'));
});

test('employees receive a validation error when ldap authentication fails', function () {
    $guard = Mockery::mock(StatefulGuard::class);
    $guard->shouldReceive('check')->once()->andReturnFalse();
    $guard->shouldReceive('attempt')->once()->andReturnFalse();
    $guard->shouldReceive('user')->andReturnNull();

    $citizenGuard = Mockery::mock(StatefulGuard::class);
    $citizenGuard->shouldReceive('user')->andReturnNull();

    Auth::shouldReceive('guard')
        ->with('employee')
        ->andReturn($guard);
    Auth::shouldReceive('guard')
        ->with('citizen')
        ->andReturn($citizenGuard);

    $this->from(route('employee.login'))
        ->post(route('employee.login.store'), [
            'username' => 'mario.rossi',
            'password' => 'wrong',
        ])
        ->assertRedirect(route('employee.login'))
        ->assertSessionHasErrors('username');
});

test('guests are redirected to the employee login page for the employee portal', function () {
    $this->get(route('employee.dashboard'))
        ->assertRedirect(route('employee.login'));
});

test('guests are redirected to the employee login page for employee chats', function () {
    $this->get(route('employee.chats.index'))
        ->assertRedirect(route('employee.login'));
});

test('guests are redirected to the employee login page for employee citizen management', function () {
    $this->get(route('employee.citizens.index'))
        ->assertRedirect(route('employee.login'));
});

test('guests are redirected to the employee login page for employee citizen creation', function () {
    $this->get(route('employee.citizens.create'))
        ->assertRedirect(route('employee.login'));
});
