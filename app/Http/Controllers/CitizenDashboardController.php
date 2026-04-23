<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\MapsChatThreadData;
use App\Models\Citizen;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CitizenDashboardController extends Controller
{
    use MapsChatThreadData;

    public function __invoke(Request $request): Response
    {
        /** @var Citizen|null $citizen */
        $citizen = Auth::guard('citizen')->user();

        abort_unless($citizen instanceof Citizen, 403);

        $recentChats = $this->actorThreadsQuery($citizen)
            ->with([
                'participants.participant',
                'latestMessage.author',
                'latestMessage.attachments',
            ])
            ->withCount('messages')
            ->orderByDesc('last_activity_at')
            ->orderByDesc('latest_message_date')
            ->orderByDesc('updated_at')
            ->limit(5)
            ->get()
            ->map(fn ($thread) => $this->mapChatSummary($thread))
            ->values();

        $activeGroupCount = Group::query()
            ->where('is_active', true)
            ->count();

        $openContactRequestCount = $citizen->groupContactRequests()
            ->where('status', 'open')
            ->count();

        return Inertia::render('citizen/dashboard', [
            'status' => $request->session()->get('status'),
            'citizen' => [
                'name' => $citizen->name,
                'email' => $citizen->email,
                'phoneNumber' => $citizen->phone_number,
                'fiscalCode' => $citizen->normalized_fiscal_code,
                'lastLoginAt' => $citizen->last_login_at?->toIso8601String(),
            ],
            'recentChats' => $recentChats,
            'activeGroupCount' => $activeGroupCount,
            'openContactRequestCount' => $openContactRequestCount,
        ]);
    }
}
