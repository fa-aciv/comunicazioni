<?php

namespace App\Http\Controllers;

use App\Models\ChatRetentionSetting;
use App\Models\User;
use App\Services\EmployeeAuthorizationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeSettingsController extends Controller
{
    public function index(
        Request $request,
        EmployeeAuthorizationService $employeeAuthorization
    ): Response
    {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $employeeAuthorization->syncCatalog();

        $settings = ChatRetentionSetting::current();
        $notificationPreferences = $employee->notificationPreferences();
        $groupCount = $employee->groupMemberships()->count();
        $canOpenAdminGroupPanel = $employee->can('groups.create')
            || $employee->can('groups.managers.assign')
            || $employee->can('groups.roles.manage');
        $canOpenManagerGroupPanel = $employee->can('groups.managers.assign')
            || $employee->groupMemberships()
                ->whereHas('groupRole.permissions', fn ($query) => $query->whereIn('key', [
                    'group.members.add',
                    'group.members.remove',
                ]))
                ->exists();

        return Inertia::render('employee/settings/index', [
            'status' => $request->session()->get('status'),
            'settings' => [
                'messageRetentionDays' => $settings->message_retention_days,
                'inactiveThreadRetentionDays' => $settings->inactive_thread_retention_days,
                'lastCleanupAt' => $settings->last_cleanup_at?->toIso8601String(),
                'notifications' => [
                    'emailNotificationsEnabled' => $notificationPreferences->email_notifications_enabled,
                    'notifyUnreadChatMessages' => $notificationPreferences->notify_unread_chat_messages,
                    'unreadChatEmailDelayMinutes' => $notificationPreferences->unread_chat_email_delay_minutes,
                    'notifyGroupContactRequests' => $notificationPreferences->notify_group_contact_requests,
                    'groupContactRequestEmailDelayMinutes' => $notificationPreferences->group_contact_request_email_delay_minutes,
                ],
            ],
            'groupCount' => $groupCount,
            'groupsOverviewUrl' => route('employee.groups.index'),
            'canOpenAdminGroupPanel' => $canOpenAdminGroupPanel,
            'adminGroupPanelUrl' => $canOpenAdminGroupPanel ? route('employee.groups.admin') : null,
            'canOpenManagerGroupPanel' => $canOpenManagerGroupPanel,
            'managerGroupPanelUrl' => $canOpenManagerGroupPanel ? route('employee.groups.manage') : null,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $messages = [];

        if ($request->hasAny(['messageRetentionDays', 'inactiveThreadRetentionDays'])) {
            $validated = $request->validate([
                'messageRetentionDays' => ['required', 'integer', 'min:1', 'max:3650'],
                'inactiveThreadRetentionDays' => ['required', 'integer', 'min:1', 'max:3650', 'gte:messageRetentionDays'],
            ], [
                'inactiveThreadRetentionDays.gte' => 'La retention delle chat inattive deve essere uguale o superiore a quella dei messaggi.',
            ]);

            $settings = ChatRetentionSetting::current();

            $settings->forceFill([
                'message_retention_days' => (int) $validated['messageRetentionDays'],
                'inactive_thread_retention_days' => (int) $validated['inactiveThreadRetentionDays'],
            ])->save();

            $messages[] = 'Impostazioni di retention aggiornate correttamente.';
        }

        if ($request->hasAny([
            'emailNotificationsEnabled',
            'notifyUnreadChatMessages',
            'unreadChatEmailDelayMinutes',
            'notifyGroupContactRequests',
            'groupContactRequestEmailDelayMinutes',
        ])) {
            $validated = $request->validate([
                'emailNotificationsEnabled' => ['required', 'boolean'],
                'notifyUnreadChatMessages' => ['required', 'boolean'],
                'unreadChatEmailDelayMinutes' => ['required', 'integer', 'min:1', 'max:10080'],
                'notifyGroupContactRequests' => ['required', 'boolean'],
                'groupContactRequestEmailDelayMinutes' => ['required', 'integer', 'min:1', 'max:10080'],
            ]);

            $employee->notificationPreferences()->forceFill([
                'email_notifications_enabled' => (bool) $validated['emailNotificationsEnabled'],
                'notify_unread_chat_messages' => (bool) $validated['notifyUnreadChatMessages'],
                'unread_chat_email_delay_minutes' => (int) $validated['unreadChatEmailDelayMinutes'],
                'notify_group_contact_requests' => (bool) $validated['notifyGroupContactRequests'],
                'group_contact_request_email_delay_minutes' => (int) $validated['groupContactRequestEmailDelayMinutes'],
            ])->save();

            $messages[] = 'Preferenze notifiche email aggiornate correttamente.';
        }

        return back()->with('status', implode(' ', $messages !== [] ? $messages : ['Nessuna modifica applicata.']));
    }
}
