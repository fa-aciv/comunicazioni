<?php

namespace App\Actions\Group;

use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\GroupRole;
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

    public function handle(
        Group $group,
        User $actor,
        int $userId,
        int $groupRoleId
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

        $groupRole = GroupRole::query()
            ->with('permissions')
            ->find($groupRoleId);

        if (! $groupRole) {
            throw ValidationException::withMessages([
                'group_role_id' => 'Il ruolo selezionato non è valido.',
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

        return DB::transaction(function () use ($group, $member, $groupRole): GroupMembership {
            return GroupMembership::query()
                ->create([
                    'group_id' => $group->getKey(),
                    'user_id' => $member->getKey(),
                    'group_role_id' => $groupRole->getKey(),
                    'role' => $groupRole->key,
                ])
                ->fresh(['user', 'groupRole.permissions']);
        });
    }
}
