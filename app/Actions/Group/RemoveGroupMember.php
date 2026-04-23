<?php

namespace App\Actions\Group;

use App\Enums\GroupMembershipRole;
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

        if (
            $membership->role === GroupMembershipRole::Manager
            && $this->isLastManager($group, $membership)
        ) {
            throw ValidationException::withMessages([
                'membership' => 'Ogni gruppo deve avere almeno un manager.',
            ]);
        }

        DB::transaction(function () use ($membership): void {
            $membership->permissions()->detach();
            $membership->delete();
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
