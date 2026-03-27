<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\MapsChatThreadData;
use App\Models\ChatThread;
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

        $activeChats = $this->actorThreadsQuery($employee)
            ->with([
                'participants.participant',
                'latestMessage.author',
                'latestMessage.attachments',
            ])
            ->withCount('messages')
            ->orderByDesc('latest_message_date')
            ->orderByDesc('updated_at')
            ->limit(5)
            ->get()
            ->map(fn (ChatThread $thread) => $this->mapChatSummary($thread))
            ->values();

        return Inertia::render('employee/dashboard', [
            'status' => $request->session()->get('status'),
            'activeChats' => $activeChats,
        ]);
    }
}
