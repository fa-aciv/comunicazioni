<?php

use App\Actions\Chat\RemoveEmployeeParticipant;
use App\Models\ChatThread;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;

if (! extension_loaded('pdo_sqlite')) {
    test('remove employee participant action tests require pdo_sqlite', function () {
        $this->markTestSkipped('The pdo_sqlite extension is not available in this environment.');
    });

    return;
}

uses(Tests\TestCase::class, RefreshDatabase::class);

test('remove employee participant removes another employee from the chat', function () {
    $actor = User::factory()->create();
    $participant = User::factory()->create();

    $thread = ChatThread::factory()->create([
        'creator_id' => $actor->getKey(),
        'creator_type' => User::class,
    ]);

    $thread->participants()->create([
        'participant_id' => $actor->getKey(),
        'participant_type' => User::class,
    ]);

    $thread->participants()->create([
        'participant_id' => $participant->getKey(),
        'participant_type' => User::class,
    ]);

    $updatedThread = app(RemoveEmployeeParticipant::class)->handle(
        $thread->getKey(),
        $actor,
        $participant->getKey(),
    );

    expect($updatedThread->participants()
        ->where('participant_type', User::class)
        ->where('participant_id', $participant->getKey())
        ->exists())->toBeFalse()
        ->and($updatedThread->participants()
            ->where('participant_type', User::class)
            ->where('participant_id', $actor->getKey())
            ->exists())->toBeTrue();
});

test('remove employee participant does not allow removing yourself', function () {
    $actor = User::factory()->create();

    $thread = ChatThread::factory()->create([
        'creator_id' => $actor->getKey(),
        'creator_type' => User::class,
    ]);

    $thread->participants()->create([
        'participant_id' => $actor->getKey(),
        'participant_type' => User::class,
    ]);

    try {
        app(RemoveEmployeeParticipant::class)->handle(
            $thread->getKey(),
            $actor,
            $actor->getKey(),
        );

        $this->fail('Expected self-removal to throw a validation exception.');
    } catch (ValidationException $exception) {
        expect($exception->errors())->toMatchArray([
            'employee_id' => ['Non puoi rimuovere te stesso dalla chat.'],
        ]);
    }
});
