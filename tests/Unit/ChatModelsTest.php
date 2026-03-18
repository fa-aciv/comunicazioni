<?php

uses(Tests\TestCase::class);

use App\Models\ChatMessage;
use App\Models\ChatParticipant;
use App\Models\ChatThread;
use App\Models\MessageAttachment;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;

test('chat factories can instantiate all chat models', function () {
    expect(ChatThread::factory()->make())->toBeInstanceOf(ChatThread::class)
        ->and(ChatParticipant::factory()->make())->toBeInstanceOf(ChatParticipant::class)
        ->and(ChatMessage::factory()->make())->toBeInstanceOf(ChatMessage::class)
        ->and(MessageAttachment::factory()->make())->toBeInstanceOf(MessageAttachment::class);
});

test('chat thread exposes expected relationships', function () {
    $thread = new ChatThread();

    expect($thread->creator())->toBeInstanceOf(MorphTo::class)
        ->and($thread->participants())->toBeInstanceOf(HasMany::class)
        ->and($thread->messages())->toBeInstanceOf(HasMany::class);
});

test('chat participant exposes expected relationships', function () {
    $participant = new ChatParticipant();

    expect($participant->chat())->toBeInstanceOf(BelongsTo::class)
        ->and($participant->participant())->toBeInstanceOf(MorphTo::class);
});

test('chat message exposes expected relationships', function () {
    $message = new ChatMessage();

    expect($message->chat())->toBeInstanceOf(BelongsTo::class)
        ->and($message->author())->toBeInstanceOf(MorphTo::class)
        ->and($message->attachments())->toBeInstanceOf(HasMany::class);
});

test('message attachment exposes expected relationships', function () {
    $attachment = new MessageAttachment();

    expect($attachment->message())->toBeInstanceOf(BelongsTo::class)
        ->and($attachment->chat())->toBeInstanceOf(BelongsTo::class)
        ->and($attachment->author())->toBeInstanceOf(MorphTo::class);
});

test('citizen and employee models expose chat polymorphic relations', function () {
    $citizen = new \App\Models\Citizen();
    $user = new \App\Models\User();

    expect($citizen->createdChats())->toBeInstanceOf(MorphMany::class)
        ->and($citizen->chatParticipations())->toBeInstanceOf(MorphMany::class)
        ->and($citizen->chatMessages())->toBeInstanceOf(MorphMany::class)
        ->and($citizen->messageAttachments())->toBeInstanceOf(MorphMany::class)
        ->and($user->createdChats())->toBeInstanceOf(MorphMany::class)
        ->and($user->chatParticipations())->toBeInstanceOf(MorphMany::class)
        ->and($user->chatMessages())->toBeInstanceOf(MorphMany::class)
        ->and($user->messageAttachments())->toBeInstanceOf(MorphMany::class);
});
