<?php

namespace App\Actions\Group;

use App\Enums\GroupMembershipRole;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\User;
use App\Services\GroupPermissionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateGroup
{
    public function __construct(
        private readonly GroupPermissionService $groupPermissions
    ) {
    }

    /**
     * @param  list<int>  $managerIds
     */
    public function handle(User $actor, string $name, ?string $description, array $managerIds): Group
    {
        if (! $actor->can('groups.create')) {
            throw ValidationException::withMessages([
                'name' => 'Non puoi creare nuovi gruppi.',
            ]);
        }

        $managerIds = collect($managerIds)
            ->map(fn (mixed $id) => (int) $id)
            ->filter(fn (int $id) => $id > 0)
            ->unique()
            ->values();

        if ($managerIds->isEmpty()) {
            throw ValidationException::withMessages([
                'manager_ids' => 'Seleziona almeno un manager per il gruppo.',
            ]);
        }

        $managers = User::query()
            ->whereIn('id', $managerIds)
            ->get();

        if ($managers->count() !== $managerIds->count()) {
            throw ValidationException::withMessages([
                'manager_ids' => 'Uno o più manager selezionati non esistono.',
            ]);
        }

        return DB::transaction(function () use ($name, $description, $managers): Group {
            $group = Group::query()->create([
                'name' => trim($name),
                'description' => filled($description) ? trim((string) $description) : null,
                'is_active' => true,
            ]);

            $managers->each(function (User $manager) use ($group): void {
                $membership = GroupMembership::query()->create([
                    'group_id' => $group->getKey(),
                    'user_id' => $manager->getKey(),
                    'role' => GroupMembershipRole::Manager,
                ]);

                $this->groupPermissions->applyRoleDefaults($membership);
            });

            return $group->load(['memberships.user', 'memberships.permissions']);
        });
    }
}
