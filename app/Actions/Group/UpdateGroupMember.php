<?php

namespace App\Actions\Group;

use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\GroupRole;
use App\Models\User;
use App\Services\GroupPermissionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdateGroupMember
{
    public function __construct(
        private readonly GroupPermissionService $permissions
    ) {
    }

    public function handle(
        Group $group,
        User $actor,
        GroupMembership $membership,
        int $groupRoleId
    ): GroupMembership {
        if (
            ! $this->permissions->has($actor, $group, 'group.members.permissions.manage')
            && ! $actor->can('groups.managers.assign')
        ) {
            throw ValidationException::withMessages([
                'group_role_id' => 'Non puoi modificare il ruolo dei membri di questo gruppo.',
            ]);
        }

        if ((int) $membership->group_id !== (int) $group->getKey()) {
            throw ValidationException::withMessages([
                'membership' => 'Il membro selezionato non appartiene a questo gruppo.',
            ]);
        }

        $membership->loadMissing('groupRole.permissions');

        $groupRole = GroupRole::query()
            ->with('permissions')
            ->find($groupRoleId);

        if (! $groupRole) {
            throw ValidationException::withMessages([
                'group_role_id' => 'Il ruolo selezionato non è valido.',
            ]);
        }

        if (
            $membership->groupRole
            && $this->permissions->roleIsManager($membership->groupRole)
            && ! $this->permissions->roleIsManager($groupRole)
            && $this->isLastManager($group, $membership)
        ) {
            throw ValidationException::withMessages([
                'group_role_id' => 'Ogni gruppo deve avere almeno un manager.',
            ]);
        }

        return DB::transaction(function () use ($membership, $groupRole): GroupMembership {
            $membership->forceFill([
                'group_role_id' => $groupRole->getKey(),
                'role' => $groupRole->key,
            ])->save();

            return $membership->fresh(['user', 'groupRole.permissions']);
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
