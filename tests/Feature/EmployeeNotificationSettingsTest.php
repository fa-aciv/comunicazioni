<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('employees can update their email notification preferences', function () {
    $employee = User::factory()->withoutTwoFactor()->create();

    $this->actingAs($employee, 'employee')
        ->patch(route('employee.settings.update'), [
            'emailNotificationsEnabled' => true,
            'notifyUnreadChatMessages' => true,
            'unreadChatEmailDelayMinutes' => 20,
            'notifyGroupContactRequests' => true,
            'groupContactRequestEmailDelayMinutes' => 45,
        ])
        ->assertRedirect()
        ->assertSessionHas('status', 'Preferenze notifiche email aggiornate correttamente.');

    $preferences = $employee->notificationPreferences()->fresh();

    expect($preferences->email_notifications_enabled)->toBeTrue()
        ->and($preferences->notify_unread_chat_messages)->toBeTrue()
        ->and($preferences->unread_chat_email_delay_minutes)->toBe(20)
        ->and($preferences->notify_group_contact_requests)->toBeTrue()
        ->and($preferences->group_contact_request_email_delay_minutes)->toBe(45);
});

test('employee settings page exposes email notification preferences', function () {
    $employee = User::factory()->withoutTwoFactor()->create();

    $employee->notificationPreferences()->forceFill([
        'email_notifications_enabled' => true,
        'notify_unread_chat_messages' => true,
        'unread_chat_email_delay_minutes' => 15,
        'notify_group_contact_requests' => false,
        'group_contact_request_email_delay_minutes' => 30,
    ])->save();

    $this->actingAs($employee, 'employee')
        ->get(route('employee.settings.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employee/settings/index')
            ->where('settings.notifications.emailNotificationsEnabled', true)
            ->where('settings.notifications.notifyUnreadChatMessages', true)
            ->where('settings.notifications.unreadChatEmailDelayMinutes', 15)
            ->where('settings.notifications.notifyGroupContactRequests', false)
            ->where('settings.notifications.groupContactRequestEmailDelayMinutes', 30)
        );
});
