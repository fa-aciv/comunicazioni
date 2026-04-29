<?php

namespace App\Actions\Notification;

use App\Enums\GroupContactRequestStatus;
use App\Models\ChatParticipant;
use App\Models\ChatThread;
use App\Models\EmployeeNotificationPreference;
use App\Models\GroupContactRequest;
use App\Models\GroupContactRequestNotification;
use App\Models\GroupMembership;
use App\Models\User;
use App\Notifications\EmployeeGroupContactRequestsReminder;
use App\Notifications\EmployeeUnreadChatsReminder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class SendEmployeeEmailNotificationReminders
{
    /**
     * @return array{unread_chat_recipients:int, group_contact_request_recipients:int}
     */
    public function handle(): array
    {
        return [
            'unread_chat_recipients' => $this->sendUnreadChatReminders(),
            'group_contact_request_recipients' => $this->sendGroupContactRequestReminders(),
        ];
    }

    private function sendUnreadChatReminders(): int
    {
        $users = User::query()
            ->with('notificationPreference')
            ->whereHas('notificationPreference', function (Builder $query): void {
                $query
                    ->where('email_notifications_enabled', true)
                    ->where('notify_unread_chat_messages', true);
            })
            ->orderBy('id')
            ->get();

        $sent = 0;

        foreach ($users as $user) {
            $preference = $user->notificationPreference ?? $user->notificationPreferences();
            $threads = $this->dueUnreadThreadsFor($user, $preference);

            if ($threads === []) {
                continue;
            }

            try {
                $user->notify(new EmployeeUnreadChatsReminder(
                    threadCount: count($threads),
                    unreadMessageCount: array_sum(array_column($threads, 'unread_count')),
                ));
            } catch (TransportExceptionInterface $exception) {
                report($exception);
                continue;
            }

            foreach ($threads as $thread) {
                ChatParticipant::query()
                    ->whereKey($thread['participant_id'])
                    ->update([
                        'last_unread_notification_sent_at' => $thread['latest_unread_message_at'],
                    ]);
            }

            $sent++;
        }

        return $sent;
    }

    private function sendGroupContactRequestReminders(): int
    {
        $users = User::query()
            ->with([
                'notificationPreference',
                'groupMemberships.groupRole.permissions',
            ])
            ->whereHas('notificationPreference', function (Builder $query): void {
                $query
                    ->where('email_notifications_enabled', true)
                    ->where('notify_group_contact_requests', true);
            })
            ->orderBy('id')
            ->get();

        $sent = 0;

        foreach ($users as $user) {
            $preference = $user->notificationPreference ?? $user->notificationPreferences();
            $contactRequests = $this->dueGroupContactRequestsFor($user, $preference);

            if ($contactRequests === []) {
                continue;
            }

            try {
                $groupSummaries = collect($contactRequests)
                    ->countBy('group_name')
                    ->map(fn (int $count, string $groupName) => [
                        'group_name' => $groupName,
                        'count' => $count,
                    ])
                    ->values()
                    ->all();

                $user->notify(new EmployeeGroupContactRequestsReminder(
                    requestCount: count($contactRequests),
                    groupSummaries: $groupSummaries,
                ));
            } catch (TransportExceptionInterface $exception) {
                report($exception);
                continue;
            }

            GroupContactRequestNotification::query()->insert(
                array_map(fn (array $request) => [
                    'group_contact_request_id' => $request['request_id'],
                    'user_id' => $user->getKey(),
                    'notified_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ], $contactRequests)
            );

            $sent++;
        }

        return $sent;
    }

    /**
     * @return list<array{
     *     participant_id: int,
     *     unread_count: int,
     *     latest_unread_message_at: Carbon
     * }>
     */
    private function dueUnreadThreadsFor(User $user, EmployeeNotificationPreference $preference): array
    {
        $cutoff = now()->subMinutes($preference->unread_chat_email_delay_minutes);

        $threads = ChatThread::query()
            ->whereHas('participants', function (Builder $query) use ($user): void {
                $query
                    ->where('participant_type', User::class)
                    ->where('participant_id', $user->getKey());
            })
            ->with([
                'participants' => function ($query) use ($user): void {
                    $query
                        ->where('participant_type', User::class)
                        ->where('participant_id', $user->getKey());
                },
            ])
            ->withCount([
                'messages as unread_message_count' => function (Builder $query) use ($user): void {
                    $this->applyUnreadMessagesScope($query, $user);
                },
            ])
            ->withMax([
                'messages as latest_unread_message_at' => function (Builder $query) use ($user): void {
                    $this->applyUnreadMessagesScope($query, $user);
                },
            ], 'created_at')
            ->orderByDesc('last_activity_at')
            ->orderByDesc('latest_message_date')
            ->get();

        return $threads
            ->map(function (ChatThread $thread) use ($cutoff): ?array {
                /** @var ChatParticipant|null $participant */
                $participant = $thread->participants->first();

                if (! $participant || (int) ($thread->unread_message_count ?? 0) <= 0 || ! $thread->latest_unread_message_at) {
                    return null;
                }

                $latestUnreadAt = Carbon::parse((string) $thread->latest_unread_message_at);

                if ($latestUnreadAt->gt($cutoff)) {
                    return null;
                }

                if (
                    $participant->last_unread_notification_sent_at !== null
                    && ! $latestUnreadAt->gt($participant->last_unread_notification_sent_at)
                ) {
                    return null;
                }

                return [
                    'participant_id' => $participant->getKey(),
                    'unread_count' => (int) $thread->unread_message_count,
                    'latest_unread_message_at' => $latestUnreadAt,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    /**
     * @return list<array{
     *     request_id: int,
     *     group_name: string
     * }>
     */
    private function dueGroupContactRequestsFor(User $user, EmployeeNotificationPreference $preference): array
    {
        $eligibleGroupIds = $user->groupMemberships
            ->filter(fn (GroupMembership $membership) => $membership->hasPermission('group.contact_requests.accept'))
            ->pluck('group_id')
            ->unique()
            ->values();

        if ($eligibleGroupIds->isEmpty()) {
            return [];
        }

        $cutoff = now()->subMinutes($preference->group_contact_request_email_delay_minutes);

        return GroupContactRequest::query()
            ->whereIn('group_id', $eligibleGroupIds)
            ->where('status', GroupContactRequestStatus::Open)
            ->where('created_at', '<=', $cutoff)
            ->whereDoesntHave('notifications', function (Builder $query) use ($user): void {
                $query->where('user_id', $user->getKey());
            })
            ->with(['group', 'citizen'])
            ->orderBy('created_at')
            ->get()
            ->map(fn (GroupContactRequest $request) => [
                'request_id' => $request->getKey(),
                'group_name' => $request->group->name,
            ])
            ->values()
            ->all();
    }

    private function applyUnreadMessagesScope(Builder $query, User $user): void
    {
        $query
            ->where(function (Builder $authorQuery) use ($user): void {
                $authorQuery
                    ->where('author_type', '!=', $user::class)
                    ->orWhere('author_id', '!=', $user->getKey());
            })
            ->where(
                'created_at',
                '>',
                function ($subquery) use ($user) {
                    $subquery
                        ->from('chat_participants')
                        ->selectRaw('coalesce(last_read_at, ?)', ['1970-01-01 00:00:00'])
                        ->whereColumn('chat_participants.chat_id', 'chat_messages.chat_id')
                        ->where('participant_type', $user::class)
                        ->where('participant_id', $user->getKey())
                        ->limit(1);
                }
            );
    }
}
