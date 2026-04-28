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
        ?int $groupRoleId = null
    ): GroupMembership {
        $canAddMembers = $this->permissions->has($actor, $group, 'group.members.add')
            || $actor->can('groups.managers.assign');

        if (! $canAddMembers) {
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

        $group->loadMissing('defaultRole.permissions');

        $groupRole = $groupRoleId !== null
            ? GroupRole::query()->with('permissions')->find($groupRoleId)
            : ($group->defaultRole ?? $this->permissions->defaultMemberRole());

        if (! $groupRole) {
            throw ValidationException::withMessages([
                'group_role_id' => 'Il ruolo selezionato non è valido o non esiste un ruolo predefinito configurato per il gruppo.',
            ]);
        }

        if ($groupRoleId !== null) {
            $canAssignExplicitRole = $actor->can('groups.roles.manage') || $actor->can('groups.managers.assign');

            if (! $canAssignExplicitRole) {
                throw ValidationException::withMessages([
                    'group_role_id' => 'Non puoi scegliere manualmente il ruolo dei nuovi membri di questo gruppo.',
                ]);
            }
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
