<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\MapsChatThreadData;
use App\Models\ChatThread;
use App\Models\GroupContactRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeDashboardController extends Controller
{
    use MapsChatThreadData;

    public function __invoke(Request $request): Response
    {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $conversationSearch = trim((string) $request->string('search')->toString());
        $conversationListLimit = $conversationSearch === '' ? 5 : 10;

        $activeChats = $this->withUnreadMessageCount(
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
        $hasMoreConversationResults = $activeChats->count() > $conversationListLimit;
        $activeChats = $activeChats
            ->take($conversationListLimit)
            ->map(fn (ChatThread $thread) => $this->mapChatSummary($thread))
            ->values();

        $openGroupRequestsQuery = GroupContactRequest::query()
            ->where('status', 'open')
            ->whereIn(
                'group_id',
                $employee->groupMemberships()
                    ->whereHas('groupRole.permissions', fn ($query) => $query->where('key', 'group.contact_requests.accept'))
                    ->select('group_id')
            );

        $openGroupRequestCount = (clone $openGroupRequestsQuery)->count();
        $recentGroupContactRequests = $openGroupRequestCount > 0
            ? (clone $openGroupRequestsQuery)
                ->with(['group:id,name', 'citizen:id,name'])
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn (GroupContactRequest $contactRequest) => [
                    'id' => $contactRequest->id,
                    'groupName' => $contactRequest->group->name,
                    'citizenName' => $contactRequest->citizen->name,
                    'subject' => $contactRequest->subject,
                    'messagePreview' => str($contactRequest->message)->squish()->limit(140)->toString(),
                    'createdAt' => optional($contactRequest->created_at)->toIso8601String(),
                ])
                ->values()
            : collect();

        return Inertia::render('employee/dashboard', [
            'status' => $request->session()->get('status'),
            'conversationSearch' => $conversationSearch,
            'hasMoreConversationResults' => $hasMoreConversationResults,
            'activeChats' => $activeChats,
            'openGroupRequestCount' => $openGroupRequestCount,
            'recentGroupContactRequests' => $recentGroupContactRequests,
        ]);
    }
}
