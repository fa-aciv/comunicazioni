<?php

test('citizen login screen can be rendered', function () {
    $this->get(route('citizen.login'))
        ->assertOk();
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
