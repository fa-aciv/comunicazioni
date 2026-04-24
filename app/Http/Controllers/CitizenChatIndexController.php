<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\MapsChatThreadData;
use App\Models\Citizen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CitizenChatIndexController extends Controller
{
    use MapsChatThreadData;

    public function __invoke(Request $request): Response
    {
        /** @var Citizen|null $citizen */
        $citizen = Auth::guard('citizen')->user();

        abort_unless($citizen instanceof Citizen, 403);

        $conversationSearch = trim((string) $request->string('search')->toString());
        $conversationListLimit = 100;

        $threads = $this->withUnreadMessageCount(
            $this->applyThreadSearch($this->actorThreadsQuery($citizen), $conversationSearch),
            $citizen
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
            $selectedChat = $this->actorThreadsQuery($citizen)
                ->with([
                    'participants.participant',
                    'messages' => fn ($query) => $query
                        ->with(['author', 'attachments'])
                        ->orderBy('created_at'),
                ])
                ->find($selectedChatId);

            abort_if($requestedChatId !== null && $selectedChat === null, 404);

            if ($selectedChat !== null) {
                $this->markThreadAsRead($selectedChat, $citizen);

                $listedThread = $threads->firstWhere('id', $selectedChat->getKey());

                if ($listedThread !== null) {
                    $listedThread->setAttribute('unread_message_count', 0);
                }
            }
        }

        return Inertia::render('citizen/chats/index', [
            'status' => $request->session()->get('status'),
            'currentCitizenId' => $citizen->id,
            'pollIntervalSeconds' => 10,
            'selectedChatId' => $selectedChat?->getKey(),
            'conversationSearch' => $conversationSearch,
            'conversationListLimit' => $conversationListLimit,
            'hasMoreConversations' => $hasMoreConversations,
            'chatSummaries' => $threads
                ->map(fn ($thread) => $this->mapChatSummary($thread))
                ->values(),
            'selectedChat' => $selectedChat
                ? $this->mapSelectedChat($selectedChat, 'citizen')
                : null,
        ]);
    }
}
