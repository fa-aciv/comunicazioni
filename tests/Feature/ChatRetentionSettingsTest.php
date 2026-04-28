<?php

use App\Models\ChatMessage;
use App\Models\ChatRetentionSetting;
use App\Models\ChatThread;
use App\Models\Citizen;
use App\Models\Group;
use App\Models\GroupContactRequest;
use App\Models\GroupMembership;
use App\Models\GroupRole;
use App\Models\MessageAttachment;
use App\Models\User;
use App\Services\EmployeeAuthorizationService;
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

function attachEmployeeToGroup(Group $group, User $user, string $roleKey): GroupMembership
{
    $role = GroupRole::query()
        ->where('key', $roleKey)
        ->firstOrFail();

    return GroupMembership::query()->create([
        'group_id' => $group->getKey(),
        'user_id' => $user->getKey(),
        'group_role_id' => $role->getKey(),
        'role' => $role->key,
    ]);
}

function makeEmployeeAdminForRetention(User $user): User
{
    app(EmployeeAuthorizationService::class)->syncCatalog();
    $user->assignRole('admin');

    return $user->refresh();
}

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

test('admins can update group chat retention settings', function () {
    $employee = makeEmployeeAdminForRetention(User::factory()->withoutTwoFactor()->create());
    $group = Group::factory()->create();

    $this->actingAs($employee, 'employee')
        ->patch(route('employee.groups.retention.update', $group), [
            'chatMessageRetentionDays' => 12,
            'chatInactiveThreadRetentionDays' => 40,
        ])
        ->assertRedirect()
        ->assertSessionHas('status', 'Impostazioni del gruppo aggiornate correttamente.');

    $group->refresh();

    expect($group->chat_message_retention_days)->toBe(12)
        ->and($group->chat_inactive_thread_retention_days)->toBe(40);
});

test('group managers without admin permissions cannot update group chat retention settings', function () {
    $employee = User::factory()->withoutTwoFactor()->create();
    $group = Group::factory()->create();

    attachEmployeeToGroup($group, $employee, 'manager');

    $this->actingAs($employee, 'employee')
        ->patch(route('employee.groups.retention.update', $group), [
            'chatMessageRetentionDays' => 12,
            'chatInactiveThreadRetentionDays' => 40,
        ])
        ->assertForbidden();

    $group->refresh();

    expect($group->chat_message_retention_days)->not->toBe(12)
        ->and($group->chat_inactive_thread_retention_days)->not->toBe(40);
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

test('chat cleanup command applies group-specific retention policies', function () {
    Carbon::setTestNow('2026-04-20 10:00:00');

    $settings = ChatRetentionSetting::current();
    $settings->forceFill([
        'message_retention_days' => 15,
        'inactive_thread_retention_days' => 60,
    ])->save();

    $employee = User::factory()->withoutTwoFactor()->create();
    $citizen = Citizen::factory()->create();

    $strictGroup = Group::factory()->create([
        'chat_message_retention_days' => 5,
        'chat_inactive_thread_retention_days' => 10,
    ]);

    $lenientGroup = Group::factory()->create([
        'chat_message_retention_days' => 30,
        'chat_inactive_thread_retention_days' => 90,
    ]);

    $nonGroupThread = ChatThread::factory()->create([
        'creator_id' => $employee->id,
        'creator_type' => User::class,
        'last_activity_at' => now()->subDays(20),
        'latest_message_date' => now()->subDays(7),
    ]);

    $nonGroupMessage = ChatMessage::factory()->create([
        'chat_id' => $nonGroupThread->id,
        'author_id' => $citizen->id,
        'author_type' => Citizen::class,
        'created_at' => now()->subDays(7),
        'updated_at' => now()->subDays(7),
    ]);

    $strictDeletedThread = ChatThread::factory()->create([
        'creator_id' => $employee->id,
        'creator_type' => User::class,
        'last_activity_at' => now()->subDays(20),
        'latest_message_date' => now()->subDays(20),
    ]);

    GroupContactRequest::factory()->create([
        'group_id' => $strictGroup->getKey(),
        'citizen_id' => $citizen->getKey(),
        'chat_thread_id' => $strictDeletedThread->getKey(),
    ]);

    $strictDeletedThreadMessage = ChatMessage::factory()->create([
        'chat_id' => $strictDeletedThread->id,
        'author_id' => $citizen->id,
        'author_type' => Citizen::class,
        'created_at' => now()->subDays(20),
        'updated_at' => now()->subDays(20),
    ]);

    $strictActiveThread = ChatThread::factory()->create([
        'creator_id' => $employee->id,
        'creator_type' => User::class,
        'last_activity_at' => now()->subDay(),
        'latest_message_date' => now()->subDay(),
    ]);

    GroupContactRequest::factory()->create([
        'group_id' => $strictGroup->getKey(),
        'citizen_id' => $citizen->getKey(),
        'chat_thread_id' => $strictActiveThread->getKey(),
    ]);

    $strictExpiredMessage = ChatMessage::factory()->create([
        'chat_id' => $strictActiveThread->id,
        'author_id' => $employee->id,
        'author_type' => User::class,
        'created_at' => now()->subDays(7),
        'updated_at' => now()->subDays(7),
    ]);

    $strictRecentMessage = ChatMessage::factory()->create([
        'chat_id' => $strictActiveThread->id,
        'author_id' => $citizen->id,
        'author_type' => Citizen::class,
        'created_at' => now()->subDay(),
        'updated_at' => now()->subDay(),
    ]);

    $lenientThread = ChatThread::factory()->create([
        'creator_id' => $employee->id,
        'creator_type' => User::class,
        'last_activity_at' => now()->subDays(70),
        'latest_message_date' => now()->subDays(20),
    ]);

    GroupContactRequest::factory()->create([
        'group_id' => $lenientGroup->getKey(),
        'citizen_id' => $citizen->getKey(),
        'chat_thread_id' => $lenientThread->getKey(),
    ]);

    $lenientOldMessage = ChatMessage::factory()->create([
        'chat_id' => $lenientThread->id,
        'author_id' => $employee->id,
        'author_type' => User::class,
        'created_at' => now()->subDays(20),
        'updated_at' => now()->subDays(20),
    ]);

    $this->artisan('chats:cleanup')
        ->assertExitCode(0);

    expect(ChatThread::query()->find($nonGroupThread->id))->not->toBeNull()
        ->and(ChatMessage::query()->find($nonGroupMessage->id))->not->toBeNull()
        ->and(ChatThread::query()->find($strictDeletedThread->id))->toBeNull()
        ->and(ChatMessage::query()->find($strictDeletedThreadMessage->id))->toBeNull()
        ->and(ChatThread::query()->find($strictActiveThread->id))->not->toBeNull()
        ->and(ChatMessage::query()->find($strictExpiredMessage->id))->toBeNull()
        ->and(ChatMessage::query()->find($strictRecentMessage->id))->not->toBeNull()
        ->and(ChatThread::query()->find($lenientThread->id))->not->toBeNull()
        ->and(ChatMessage::query()->find($lenientOldMessage->id))->not->toBeNull();

    Carbon::setTestNow();
});

test('employee-created chats use the selected group retention policy', function () {
    Carbon::setTestNow('2026-04-20 10:00:00');

    $settings = ChatRetentionSetting::current();
    $settings->forceFill([
        'message_retention_days' => 30,
        'inactive_thread_retention_days' => 90,
    ])->save();

    $employee = User::factory()->withoutTwoFactor()->create();
    $citizen = Citizen::factory()->create([
        'email' => 'mario@example.com',
    ]);
    $group = Group::factory()->create([
        'chat_message_retention_days' => 5,
        'chat_inactive_thread_retention_days' => 10,
    ]);

    attachEmployeeToGroup($group, $employee, 'user');

    $this->actingAs($employee, 'employee')
        ->post(route('employee.chats.store'), [
            'title' => 'Pratica urgente',
            'citizen_identifier' => 'mario@example.com',
            'group_id' => $group->getKey(),
        ])
        ->assertRedirect();

    $thread = ChatThread::query()->latest('id')->firstOrFail();

    expect($thread->group_id)->toBe($group->getKey());

    $thread->forceFill([
        'last_activity_at' => now()->subDays(20),
        'latest_message_date' => now()->subDays(7),
    ])->save();

    ChatMessage::factory()->create([
        'chat_id' => $thread->getKey(),
        'author_id' => $citizen->getKey(),
        'author_type' => Citizen::class,
        'created_at' => now()->subDays(7),
        'updated_at' => now()->subDays(7),
    ]);

    $this->artisan('chats:cleanup')
        ->assertExitCode(0);

    expect(ChatThread::query()->find($thread->getKey()))->toBeNull();

    Carbon::setTestNow();
});

test('employee-created chats fall back to global retention when the employee has no group', function () {
    Carbon::setTestNow('2026-04-20 10:00:00');

    $settings = ChatRetentionSetting::current();
    $settings->forceFill([
        'message_retention_days' => 15,
        'inactive_thread_retention_days' => 60,
    ])->save();

    $employee = User::factory()->withoutTwoFactor()->create();
    $citizen = Citizen::factory()->create([
        'email' => 'giulia@example.com',
    ]);

    $this->actingAs($employee, 'employee')
        ->post(route('employee.chats.store'), [
            'title' => 'Chat senza gruppo',
            'citizen_identifier' => 'giulia@example.com',
        ])
        ->assertRedirect();

    $thread = ChatThread::query()->latest('id')->firstOrFail();

    expect($thread->group_id)->toBeNull();

    $thread->forceFill([
        'last_activity_at' => now()->subDays(20),
        'latest_message_date' => now()->subDays(20),
    ])->save();

    $this->artisan('chats:cleanup')
        ->assertExitCode(0);

    expect(ChatThread::query()->find($thread->getKey()))->not->toBeNull();

    Carbon::setTestNow();
});

test('employee chat creation requires a group selection when the employee belongs to a group', function () {
    $employee = User::factory()->withoutTwoFactor()->create();
    $citizen = Citizen::factory()->create([
        'email' => 'alessia@example.com',
    ]);
    $group = Group::factory()->create();

    attachEmployeeToGroup($group, $employee, 'user');

    $this->actingAs($employee, 'employee')
        ->post(route('employee.chats.store'), [
            'title' => 'Chat senza gruppo selezionato',
            'citizen_identifier' => $citizen->email,
        ])
        ->assertSessionHasErrors(['group_id']);

    expect(ChatThread::query()->count())->toBe(0);
});
