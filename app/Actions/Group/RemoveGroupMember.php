<?php

namespace App\Actions\Group;

use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\User;
use App\Services\GroupPermissionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RemoveGroupMember
{
    public function __construct(
        private readonly GroupPermissionService $permissions
    ) {
    }

    public function handle(Group $group, User $actor, GroupMembership $membership): void
    {
        if (
            ! $this->permissions->has($actor, $group, 'group.members.remove')
            && ! $actor->can('groups.managers.assign')
        ) {
            throw ValidationException::withMessages([
                'membership' => 'Non puoi rimuovere membri da questo gruppo.',
            ]);
        }

        if ((int) $membership->group_id !== (int) $group->getKey()) {
            throw ValidationException::withMessages([
                'membership' => 'Il membro selezionato non appartiene a questo gruppo.',
            ]);
        }

        $membership->loadMissing('groupRole.permissions');

        if (
            $membership->groupRole
            && $this->permissions->roleIsManager($membership->groupRole)
            && $this->isLastManager($group, $membership)
        ) {
            throw ValidationException::withMessages([
                'membership' => 'Ogni gruppo deve avere almeno un manager.',
            ]);
        }

        DB::transaction(function () use ($membership): void {
            $membership->delete();
        });
    }

    private function isLastManager(Group $group, GroupMembership $membership): bool
    {
        $otherMemberships = GroupMembership::query()
            ->where('group_id', $group->getKey())
            ->whereKeyNot($membership->getKey())
            ->with('groupRole.permissions')
            ->get();

        return $otherMemberships->doesntContain(
            fn (GroupMembership $otherMembership) => $otherMembership->groupRole
                && $this->permissions->roleIsManager($otherMembership->groupRole)
        );
    }
}
