<?php

use App\Models\ChatMessage;
use App\Models\ChatParticipant;
use App\Models\ChatThread;
use App\Models\Citizen;
use App\Models\Group;
use App\Models\GroupContactRequestNotification;
use App\Models\GroupMembership;
use App\Models\GroupRole;
use App\Models\User;
use App\Notifications\EmployeeGroupContactRequestsReminder;
use App\Notifications\EmployeeUnreadChatsReminder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;

function assignNotificationGroupMembership(Group $group, User $user, string $roleKey): GroupMembership
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

test('scheduled reminders send an email for unread employee chat messages', function () {
    Notification::fake();

    $employee = User::factory()->withoutTwoFactor()->create();
    $citizen = Citizen::factory()->create();

    $employee->notificationPreferences()->forceFill([
        'email_notifications_enabled' => true,
        'notify_unread_chat_messages' => true,
        'unread_chat_email_delay_minutes' => 30,
        'notify_group_contact_requests' => false,
    ])->save();

    $thread = ChatThread::query()->create([
        'creator_id' => $citizen->getKey(),
        'creator_type' => $citizen::class,
        'title' => 'Pratica anagrafica',
        'latest_message_date' => now()->subMinutes(45),
        'last_activity_at' => now()->subMinutes(45),
    ]);

    $participant = ChatParticipant::query()->create([
        'chat_id' => $thread->getKey(),
        'participant_id' => $employee->getKey(),
        'participant_type' => $employee::class,
        'last_read_at' => now()->subHours(2),
    ]);

    ChatParticipant::query()->create([
        'chat_id' => $thread->getKey(),
        'participant_id' => $citizen->getKey(),
        'participant_type' => $citizen::class,
        'last_read_at' => now(),
    ]);

    $message = ChatMessage::query()->create([
        'chat_id' => $thread->getKey(),
        'author_id' => $citizen->getKey(),
        'author_type' => $citizen::class,
        'content' => 'Vorrei aggiornare i miei dati.',
    ]);
    $message->forceFill([
        'created_at' => now()->subMinutes(45),
        'updated_at' => now()->subMinutes(45),
    ])->save();

    Artisan::call('employees:send-email-notification-reminders');

    Notification::assertSentTo($employee, EmployeeUnreadChatsReminder::class, function (EmployeeUnreadChatsReminder $notification, array $channels) use ($employee): bool {
        expect($channels)->toContain('mail');

        $mailMessage = $notification->toMail($employee)->toArray();

        expect($mailMessage['subject'])->toBe('Hai 1 chat con 1 messaggio non letto');
        expect($mailMessage['introLines'])->toContain('Hai 1 chat con 1 messaggio non letto in totale.');
        expect(implode(' ', $mailMessage['introLines']))->not->toContain('Pratica anagrafica');

        return true;
    });

    expect($participant->fresh()->last_unread_notification_sent_at)->not->toBeNull();
});

test('unread chat reminders are not resent until a new unread message becomes due', function () {
    Notification::fake();

    $employee = User::factory()->withoutTwoFactor()->create();
    $citizen = Citizen::factory()->create();

    $employee->notificationPreferences()->forceFill([
        'email_notifications_enabled' => true,
        'notify_unread_chat_messages' => true,
        'unread_chat_email_delay_minutes' => 30,
    ])->save();

    $thread = ChatThread::query()->create([
        'creator_id' => $citizen->getKey(),
        'creator_type' => $citizen::class,
        'title' => 'Richiesta certificato',
        'latest_message_date' => now()->subMinutes(45),
        'last_activity_at' => now()->subMinutes(45),
    ]);

    ChatParticipant::query()->create([
        'chat_id' => $thread->getKey(),
        'participant_id' => $employee->getKey(),
        'participant_type' => $employee::class,
        'last_read_at' => now()->subHours(2),
    ]);

    ChatParticipant::query()->create([
        'chat_id' => $thread->getKey(),
        'participant_id' => $citizen->getKey(),
        'participant_type' => $citizen::class,
        'last_read_at' => now(),
    ]);

    $firstMessage = ChatMessage::query()->create([
        'chat_id' => $thread->getKey(),
        'author_id' => $citizen->getKey(),
        'author_type' => $citizen::class,
        'content' => 'Primo messaggio non letto.',
    ]);
    $firstMessage->forceFill([
        'created_at' => now()->subMinutes(45),
        'updated_at' => now()->subMinutes(45),
    ])->save();

    Artisan::call('employees:send-email-notification-reminders');
    Artisan::call('employees:send-email-notification-reminders');

    Notification::assertSentToTimes($employee, EmployeeUnreadChatsReminder::class, 1);

    $secondMessage = ChatMessage::query()->create([
        'chat_id' => $thread->getKey(),
        'author_id' => $citizen->getKey(),
        'author_type' => $citizen::class,
        'content' => 'Secondo messaggio non letto.',
    ]);
    $secondMessage->forceFill([
        'created_at' => now(),
        'updated_at' => now(),
    ])->save();

    $thread->forceFill([
        'latest_message_date' => now(),
        'last_activity_at' => now(),
    ])->save();

    $this->travel(31)->minutes();

    Artisan::call('employees:send-email-notification-reminders');

    Notification::assertSentToTimes($employee, EmployeeUnreadChatsReminder::class, 2);
});

test('scheduled reminders send an email for pending group contact requests', function () {
    Notification::fake();

    $employee = User::factory()->withoutTwoFactor()->create();
    $groupOne = Group::factory()->create(['name' => 'Group1']);
    $groupTwo = Group::factory()->create(['name' => 'Group2']);

    $employee->notificationPreferences()->forceFill([
        'email_notifications_enabled' => true,
        'notify_unread_chat_messages' => false,
        'notify_group_contact_requests' => true,
        'group_contact_request_email_delay_minutes' => 30,
    ])->save();

    assignNotificationGroupMembership($groupOne, $employee, 'user');
    assignNotificationGroupMembership($groupTwo, $employee, 'user');

    $firstContactRequest = \App\Models\GroupContactRequest::factory()->create([
        'group_id' => $groupOne->getKey(),
        'created_at' => now()->subMinutes(40),
        'updated_at' => now()->subMinutes(40),
        'subject' => 'Cambio residenza',
    ]);

    $secondContactRequest = \App\Models\GroupContactRequest::factory()->create([
        'group_id' => $groupOne->getKey(),
        'created_at' => now()->subMinutes(35),
        'updated_at' => now()->subMinutes(35),
        'subject' => 'ISEE',
    ]);

    $thirdContactRequest = \App\Models\GroupContactRequest::factory()->create([
        'group_id' => $groupTwo->getKey(),
        'created_at' => now()->subMinutes(32),
        'updated_at' => now()->subMinutes(32),
        'subject' => 'Carta identita',
    ]);

    Artisan::call('employees:send-email-notification-reminders');

    Notification::assertSentTo($employee, EmployeeGroupContactRequestsReminder::class, function (EmployeeGroupContactRequestsReminder $notification, array $channels) use ($employee): bool {
        expect($channels)->toContain('mail');

        $mailMessage = $notification->toMail($employee)->toArray();
        $introLines = implode(' ', $mailMessage['introLines']);

        expect($mailMessage['subject'])->toBe('Hai 3 richieste indirizzate ai tuoi gruppi');
        expect($mailMessage['introLines'])->toContain('Hai 3 richieste indirizzate ai tuoi gruppi:');
        expect($introLines)->toContain('• 2 richieste per Group1');
        expect($introLines)->toContain('• 1 richiesta per Group2');
        expect($introLines)->not->toContain('Cambio residenza');
        expect($introLines)->not->toContain('ISEE');
        expect($introLines)->not->toContain('Carta identita');

        return true;
    });

    expect(GroupContactRequestNotification::query()
        ->whereIn('group_contact_request_id', [
            $firstContactRequest->getKey(),
            $secondContactRequest->getKey(),
            $thirdContactRequest->getKey(),
        ])
        ->where('user_id', $employee->getKey())
        ->count())->toBe(3);
});
