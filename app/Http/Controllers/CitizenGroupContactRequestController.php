<?php

namespace App\Http\Controllers;

use App\Actions\Group\CreateGroupContactRequest;
use App\Enums\GroupContactRequestStatus;
use App\Models\Citizen;
use App\Models\Group;
use App\Models\GroupContactRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class CitizenGroupContactRequestController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var Citizen|null $citizen */
        $citizen = Auth::guard('citizen')->user();

        abort_unless($citizen instanceof Citizen, 403);

        $contactRequests = GroupContactRequest::query()
            ->where('citizen_id', $citizen->getKey())
            ->where('status', GroupContactRequestStatus::Open)
            ->with(['group'])
            ->latest()
            ->get();

        return Inertia::render('citizen/contact-requests/index', [
            'status' => $request->session()->get('status'),
            'contactRequests' => $contactRequests->map(fn (GroupContactRequest $contactRequest) => [
                'id' => $contactRequest->id,
                'groupName' => $contactRequest->group->name,
                'subject' => $contactRequest->subject,
                'message' => $contactRequest->message,
                'status' => $contactRequest->status->value,
                'statusLabel' => $contactRequest->status->label(),
                'createdAt' => optional($contactRequest->created_at)->toIso8601String(),
            ])->values(),
        ]);
    }

    public function store(
        Request $request,
        CreateGroupContactRequest $action
    ): RedirectResponse {
        /** @var Citizen|null $citizen */
        $citizen = Auth::guard('citizen')->user();

        abort_unless($citizen instanceof Citizen, 403);

        $validated = $request->validate([
            'group_id' => ['required', 'integer'],
            'subject' => ['nullable', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $group = Group::query()
            ->where('is_active', true)
            ->findOrFail((int) $validated['group_id']);

        $action->handle($citizen, $group, $validated);

        return redirect()
            ->route('citizen.contact-requests.index')
            ->with('status', 'Richiesta di contatto inviata correttamente.');
    }
}
