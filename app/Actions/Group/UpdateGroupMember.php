<?php

namespace App\Actions\Group;

use App\Enums\GroupMembershipRole;
use App\Models\Group;
use App\Models\GroupMembership;
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

    /**
     * @param  list<string>  $permissionKeys
     */
    public function handle(
        Group $group,
        User $actor,
        GroupMembership $membership,
        string $role,
        array $permissionKeys
    ): GroupMembership {
        if (
            ! $this->permissions->has($actor, $group, 'group.members.permissions.manage')
            && ! $actor->can('groups.managers.assign')
        ) {
            throw ValidationException::withMessages([
                'permissions' => 'Non puoi modificare ruolo e permessi dei membri di questo gruppo.',
            ]);
        }

        if ((int) $membership->group_id !== (int) $group->getKey()) {
            throw ValidationException::withMessages([
                'membership' => 'Il membro selezionato non appartiene a questo gruppo.',
            ]);
        }

        $roleEnum = GroupMembershipRole::tryFrom($role);

        if (! $roleEnum) {
            throw ValidationException::withMessages([
                'role' => 'Il ruolo selezionato non è valido.',
            ]);
        }

        if (
            $membership->role === GroupMembershipRole::Manager
            && $roleEnum !== GroupMembershipRole::Manager
            && $this->isLastManager($group, $membership)
        ) {
            throw ValidationException::withMessages([
                'role' => 'Ogni gruppo deve avere almeno un manager.',
            ]);
        }

        return DB::transaction(function () use ($membership, $roleEnum, $permissionKeys): GroupMembership {
            $membership->forceFill([
                'role' => $roleEnum,
            ])->save();

            $this->permissions->syncMembershipPermissions($membership, $permissionKeys);

            return $membership->fresh(['user', 'permissions']);
        });
    }

    private function isLastManager(Group $group, GroupMembership $membership): bool
    {
        return GroupMembership::query()
            ->where('group_id', $group->getKey())
            ->where('role', GroupMembershipRole::Manager->value)
            ->whereKeyNot($membership->getKey())
            ->doesntExist();
    }
}
