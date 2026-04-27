<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\MapsChatThreadData;
use App\Models\ChatThread;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeChatIndexController extends Controller
{
    use MapsChatThreadData;

    public function __invoke(Request $request): Response
    {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $conversationSearch = trim((string) $request->string('search')->toString());
        $conversationListLimit = 100;

        $threads = $this->withUnreadMessageCount(
            $this->applyThreadSearch($this->actorThreadsQuery($employee), $conversationSearch),
            $employee
        )
            ->with([
                'participants.participant',
                'latestMessage.author',
                'latestMessage.attachments',
            ])
            ->withCount('messages')
            ->orderByDesc('last_activity_at')
            ->orderByDesc('latest_message_date')
            ->orderByDesc('updated_at')
            ->limit($conversationListLimit + 1)
            ->get();
        $hasMoreConversations = $threads->count() > $conversationListLimit;
        $threads = $threads->take($conversationListLimit)->values();

        $requestedChatId = $request->integer('chat') ?: null;
        $selectedChatId = $requestedChatId ?: $threads->first()?->getKey();
        $selectedChat = null;

        if ($selectedChatId !== null) {
            $selectedChat = $this->actorThreadsQuery($employee)
                ->with([
                    'participants.participant',
                    'messages' => fn ($query) => $query
                        ->with(['author', 'attachments'])
                        ->orderBy('created_at'),
                ])
                ->find($selectedChatId);

            abort_if($requestedChatId !== null && $selectedChat === null, 404);

            if ($selectedChat !== null) {
                $this->markThreadAsRead($selectedChat, $employee);

                $listedThread = $threads->firstWhere('id', $selectedChat->getKey());

                if ($listedThread !== null) {
                    $listedThread->setAttribute('unread_message_count', 0);
                }
            }
        }

        $totalUnreadMessageCount = (int) $threads->sum(
            fn (ChatThread $thread) => (int) ($thread->unread_message_count ?? 0)
        );

        $employees = User::query()
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'department_name']);

        $availableGroups = $employee->groups()
            ->orderBy('name')
            ->get(['groups.id', 'groups.name']);

        return Inertia::render('employee/chats/index', [
            'status' => $request->session()->get('status'),
            'currentEmployeeId' => $employee->id,
            'pollIntervalSeconds' => 10,
            'selectedChatId' => $selectedChat?->getKey(),
            'conversationSearch' => $conversationSearch,
            'conversationListLimit' => $conversationListLimit,
            'hasMoreConversations' => $hasMoreConversations,
            'totalUnreadMessageCount' => $totalUnreadMessageCount,
            'employees' => $employees->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'department_name' => $user->department_name,
            ])->values(),
            'availableGroups' => $availableGroups->map(fn ($group) => [
                'id' => $group->id,
                'name' => $group->name,
            ])->values(),
            'chatSummaries' => $threads->map(fn (ChatThread $thread) => $this->mapChatSummary($thread))->values(),
            'selectedChat' => $selectedChat ? $this->mapSelectedChat($selectedChat, 'employee') : null,
        ]);
    }
}
