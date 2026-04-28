<?php

namespace App\Http\Controllers;

use App\Actions\Group\AddGroupMember;
use App\Actions\Group\RemoveGroupMember;
use App\Actions\Group\UpdateGroupMember;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class EmployeeGroupMembershipController extends Controller
{
    public function store(Request $request, Group $group, AddGroupMember $action): RedirectResponse
    {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $validated = $request->validate([
            'user_id' => ['required', 'integer'],
            'group_role_id' => ['nullable', 'integer'],
        ]);

        $action->handle(
            $group,
            $employee,
            (int) $validated['user_id'],
            isset($validated['group_role_id']) ? (int) $validated['group_role_id'] : null
        );

        return back()->with('status', 'Membro aggiunto correttamente al gruppo.');
    }

    public function update(
        Request $request,
        Group $group,
        GroupMembership $membership,
        UpdateGroupMember $action
    ): RedirectResponse {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $validated = $request->validate([
            'group_role_id' => ['required', 'integer'],
        ]);

        $action->handle(
            $group,
            $employee,
            $membership,
            (int) $validated['group_role_id']
        );

        return back()->with('status', 'Membro aggiornato correttamente.');
    }

    public function destroy(
        Request $request,
        Group $group,
        GroupMembership $membership,
        RemoveGroupMember $action
    ): RedirectResponse {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $action->handle($group, $employee, $membership);

        return back()->with('status', 'Membro rimosso correttamente dal gruppo.');
    }
}
