<?php

namespace App\Http\Controllers;

use App\Actions\Group\AcceptGroupContactRequest;
use App\Models\GroupContactRequest;
use App\Models\User;
use App\Services\GroupPermissionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeGroupContactRequestController extends Controller
{
    public function index(Request $request, GroupPermissionService $permissions): Response
    {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $permissions->syncCatalog();

        $accessibleGroupIds = $employee->groupMemberships()
            ->whereHas('permissions', fn ($query) => $query->where('key', 'group.contact_requests.accept'))
            ->pluck('group_id');

        $contactRequests = GroupContactRequest::query()
            ->whereIn('group_id', $accessibleGroupIds)
            ->where('status', 'open')
            ->with(['group', 'citizen'])
            ->latest()
            ->get();

        return Inertia::render('employee/group-contact-requests/index', [
            'status' => $request->session()->get('status'),
            'contactRequests' => $contactRequests->map(fn (GroupContactRequest $contactRequest) => [
                'id' => $contactRequest->id,
                'groupName' => $contactRequest->group->name,
                'subject' => $contactRequest->subject,
                'message' => $contactRequest->message,
                'suggestedTitle' => $this->suggestChatTitle($contactRequest),
                'createdAt' => optional($contactRequest->created_at)->toIso8601String(),
                'citizen' => [
                    'name' => $contactRequest->citizen->name,
                    'email' => $contactRequest->citizen->email,
                    'phoneNumber' => $contactRequest->citizen->phone_number,
                    'fiscalCode' => $contactRequest->citizen->normalized_fiscal_code,
                ],
                'acceptUrl' => route('employee.group-contact-requests.accept', $contactRequest),
            ])->values(),
            'groupsUrl' => route('employee.groups.index'),
        ]);
    }

    public function accept(
        Request $request,
        GroupContactRequest $contactRequest,
        AcceptGroupContactRequest $action
    ): RedirectResponse {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
        ], [
            'title.required' => 'Inserisci un titolo per la chat prima di accettare la richiesta.',
        ]);

        $thread = $action->handle($contactRequest, $employee, $validated['title']);

        return redirect()
            ->route('employee.chats.index', ['chat' => $thread->getKey()])
            ->with('status', 'Richiesta accettata. È stata aperta una nuova chat con il cittadino.');
    }

    private function suggestChatTitle(GroupContactRequest $contactRequest): string
    {
        $subject = trim((string) $contactRequest->subject);
        $source = $subject !== '' ? $subject : trim((string) $contactRequest->message);
        $source = preg_replace('/\s+/', ' ', $source) ?? '';
        $source = trim($source, " \t\n\r\0\x0B.,;:-");

        if ($source === '') {
            $source = 'Richiesta di contatto';
        }

        return str($source)->limit(80, '')->trim()->toString();
    }
}
