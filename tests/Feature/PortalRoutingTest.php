<?php

test('the welcome page can be rendered', function () {
    $this->get(route('home'))
        ->assertOk();
});

test('the generic dashboard route redirects guests back home', function () {
    $this->get(route('dashboard'))
        ->assertRedirect(route('home'));
});
