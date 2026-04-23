<?php

namespace App\Actions\Group;

use App\Enums\GroupMembershipRole;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\User;
use App\Services\GroupPermissionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AddGroupMember
{
    public function __construct(
        private readonly GroupPermissionService $permissions
    ) {
    }

    /**
     * @param  list<string>|null  $permissionKeys
     */
    public function handle(
        Group $group,
        User $actor,
        int $userId,
        string $role,
        ?array $permissionKeys = null
    ): GroupMembership {
        if (
            ! $this->permissions->has($actor, $group, 'group.members.add')
            && ! $actor->can('groups.managers.assign')
        ) {
            throw ValidationException::withMessages([
                'user_id' => 'Non puoi aggiungere membri a questo gruppo.',
            ]);
        }

        $member = User::query()->find($userId);

        if (! $member) {
            throw ValidationException::withMessages([
                'user_id' => 'Il dipendente selezionato non esiste.',
            ]);
        }

        $roleEnum = GroupMembershipRole::tryFrom($role);

        if (! $roleEnum) {
            throw ValidationException::withMessages([
                'role' => 'Il ruolo selezionato non è valido.',
            ]);
        }

        $alreadyMember = GroupMembership::query()
            ->where('group_id', $group->getKey())
            ->where('user_id', $member->getKey())
            ->exists();

        if ($alreadyMember) {
            throw ValidationException::withMessages([
                'user_id' => 'Il dipendente selezionato fa già parte del gruppo.',
            ]);
        }

        return DB::transaction(function () use ($group, $member, $roleEnum, $permissionKeys): GroupMembership {
            $membership = GroupMembership::query()->create([
                'group_id' => $group->getKey(),
                'user_id' => $member->getKey(),
                'role' => $roleEnum,
            ]);

            if ($permissionKeys === null || $permissionKeys === []) {
                $this->permissions->applyRoleDefaults($membership);
            } else {
                $this->permissions->syncMembershipPermissions($membership, $permissionKeys);
            }

            return $membership->fresh(['user', 'permissions']);
        });
    }
}
