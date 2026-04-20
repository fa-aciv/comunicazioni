<?php

use App\Models\ChatMessage;
use App\Models\ChatRetentionSetting;
use App\Models\ChatThread;
use App\Models\Citizen;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

if (! extension_loaded('pdo_sqlite')) {
    test('chat retention tests require pdo_sqlite', function () {
        $this->markTestSkipped('The pdo_sqlite extension is not available in this environment.');
    });

    return;
}

uses(RefreshDatabase::class);

test('employees can update chat retention settings', function () {
    $employee = User::factory()->withoutTwoFactor()->create();

    $this->actingAs($employee, 'employee')
        ->patch(route('employee.settings.update'), [
            'messageRetentionDays' => 21,
            'inactiveThreadRetentionDays' => 75,
        ])
        ->assertRedirect()
        ->assertSessionHas('status', 'Impostazioni di retention aggiornate correttamente.');

    $settings = ChatRetentionSetting::current();

    expect($settings->message_retention_days)->toBe(21)
        ->and($settings->inactive_thread_retention_days)->toBe(75);
});

test('chat cleanup command deletes inactive threads and expired messages', function () {
    Carbon::setTestNow('2026-04-20 10:00:00');
    Storage::fake('local');

    $settings = ChatRetentionSetting::current();
    $settings->forceFill([
        'message_retention_days' => 15,
        'inactive_thread_retention_days' => 60,
    ])->save();

    $employee = User::factory()->withoutTwoFactor()->create();
    $citizen = Citizen::factory()->create();

    $inactiveThread = ChatThread::factory()->create([
        'creator_id' => $employee->id,
        'creator_type' => User::class,
        'title' => 'Thread inattivo',
        'latest_message_date' => now()->subDays(70),
        'last_activity_at' => now()->subDays(70),
    ]);

    $inactiveMessage = ChatMessage::factory()->create([
        'chat_id' => $inactiveThread->id,
        'author_id' => $citizen->id,
        'author_type' => Citizen::class,
        'content' => 'Messaggio vecchio',
        'created_at' => now()->subDays(70),
        'updated_at' => now()->subDays(70),
    ]);

    $inactiveAttachmentPath = 'attachments/inactive/message.pdf';
    Storage::disk('local')->put($inactiveAttachmentPath, 'pdf');
    MessageAttachment::factory()->create([
        'message_id' => $inactiveMessage->id,
        'chat_id' => $inactiveThread->id,
        'author_id' => $citizen->id,
        'author_type' => Citizen::class,
        'file_path' => $inactiveAttachmentPath,
        'file_name' => 'message.pdf',
    ]);

    $activeThread = ChatThread::factory()->create([
        'creator_id' => $employee->id,
        'creator_type' => User::class,
        'title' => 'Thread attivo',
        'latest_message_date' => now()->subDay(),
        'last_activity_at' => now()->subDay(),
    ]);

    $expiredMessage = ChatMessage::factory()->create([
        'chat_id' => $activeThread->id,
        'author_id' => $employee->id,
        'author_type' => User::class,
        'content' => 'Da eliminare',
        'created_at' => now()->subDays(20),
        'updated_at' => now()->subDays(20),
    ]);

    $expiredAttachmentPath = 'attachments/active/expired.pdf';
    Storage::disk('local')->put($expiredAttachmentPath, 'pdf');
    MessageAttachment::factory()->create([
        'message_id' => $expiredMessage->id,
        'chat_id' => $activeThread->id,
        'author_id' => $employee->id,
        'author_type' => User::class,
        'file_path' => $expiredAttachmentPath,
        'file_name' => 'expired.pdf',
    ]);

    $recentMessage = ChatMessage::factory()->create([
        'chat_id' => $activeThread->id,
        'author_id' => $citizen->id,
        'author_type' => Citizen::class,
        'content' => 'Messaggio recente',
        'created_at' => now()->subDay(),
        'updated_at' => now()->subDay(),
    ]);

    $this->artisan('chats:cleanup')
        ->assertExitCode(0);

    expect(ChatThread::query()->find($inactiveThread->id))->toBeNull()
        ->and(ChatMessage::query()->find($inactiveMessage->id))->toBeNull()
        ->and(ChatThread::query()->find($activeThread->id))->not->toBeNull()
        ->and(ChatMessage::query()->find($expiredMessage->id))->toBeNull()
        ->and(ChatMessage::query()->find($recentMessage->id))->not->toBeNull();

    Storage::disk('local')->assertMissing($inactiveAttachmentPath);
    Storage::disk('local')->assertMissing($expiredAttachmentPath);

    expect($settings->fresh()->last_cleanup_at)->not->toBeNull();

    Carbon::setTestNow();
});

test('chat cleanup dry run does not delete records or update last cleanup', function () {
    Carbon::setTestNow('2026-04-20 10:00:00');

    $settings = ChatRetentionSetting::current();
    $settings->forceFill([
        'message_retention_days' => 15,
        'inactive_thread_retention_days' => 60,
        'last_cleanup_at' => null,
    ])->save();

    $thread = ChatThread::factory()->create([
        'last_activity_at' => now()->subDays(90),
    ]);

    $message = ChatMessage::factory()->create([
        'chat_id' => $thread->id,
        'created_at' => now()->subDays(20),
        'updated_at' => now()->subDays(20),
    ]);

    $this->artisan('chats:cleanup', ['--dry-run' => true])
        ->assertExitCode(0);

    expect(ChatThread::query()->find($thread->id))->not->toBeNull()
        ->and(ChatMessage::query()->find($message->id))->not->toBeNull()
        ->and($settings->fresh()->last_cleanup_at)->toBeNull();

    Carbon::setTestNow();
});
