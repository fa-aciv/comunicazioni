<?php

use App\Models\User;

test('guests cannot register citizens from the employee area', function () {
    $this->post(route('employee.citizens.store'), [
        'name' => 'Mario Rossi',
        'email' => 'mario.rossi@example.com',
        'phoneNumber' => '+390916661111',
        'fiscalCode' => 'RSSMRA80A01H501U',
    ])->assertRedirect(route('employee.login'));
});

test('employee citizen registration validates required fields', function () {
    $this->from(route('employee.dashboard'))
        ->actingAs(new User([
            'name' => 'Operatore',
            'email' => 'operatore@example.com',
            'password' => 'password',
        ]), 'employee')
        ->post(route('employee.citizens.store'), [])
        ->assertRedirect(route('employee.dashboard'))
        ->assertSessionHasErrors(['name', 'email', 'phoneNumber', 'fiscalCode']);
});
