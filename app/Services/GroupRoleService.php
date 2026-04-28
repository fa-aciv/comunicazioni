<?php

namespace App\Services;

use App\Models\GroupMembership;
use App\Models\GroupRole;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class GroupRoleService
{
    public function __construct(
        private readonly GroupPermissionService $permissions
    ) {
    }

    /**
     * @return Collection<int, GroupRole>
     */
    public function catalog(): Collection
    {
        return GroupRole::query()
            ->with('permissions')
            ->withCount('memberships')
            ->orderByRaw("case when `key` = 'manager' then 0 when `key` = 'user' then 1 else 2 end")
            ->orderBy('name')
            ->get();
    }

    /**
     * @param  list<string>  $permissionKeys
     */
    public function create(string $name, ?string $description, array $permissionKeys): GroupRole
    {
        $name = trim($name);

        return DB::transaction(function () use ($name, $description, $permissionKeys): GroupRole {
            $role = GroupRole::query()->create([
                'key' => $this->uniqueKeyForName($name),
                'name' => $name,
                'description' => filled($description) ? trim((string) $description) : null,
            ]);

            $this->permissions->syncRolePermissions($role, $permissionKeys);

            return $role->fresh(['permissions']);
        });
    }

    /**
     * @param  list<string>  $permissionKeys
     */
    public function update(GroupRole $role, string $name, ?string $description, array $permissionKeys): GroupRole
    {
        $name = trim($name);
        $willBeManager = $this->permissions->permissionKeysGrantManagerAccess($permissionKeys);

        $this->ensureManagerCoverageAfterMutation($role, $willBeManager);

        return DB::transaction(function () use ($role, $name, $description, $permissionKeys): GroupRole {
            $role->forceFill([
                'key' => $this->uniqueKeyForName($name, $role),
                'name' => $name,
                'description' => filled($description) ? trim((string) $description) : null,
            ])->save();

            $this->permissions->syncRolePermissions($role, $permissionKeys);

            return $role->fresh(['permissions']);
        });
    }

    public function delete(GroupRole $role): void
    {
        if ($role->memberships()->exists()) {
            throw ValidationException::withMessages([
                'role' => 'Non puoi eliminare un ruolo ancora assegnato a membri di gruppo.',
            ]);
        }

        $this->ensureManagerCoverageAfterMutation($role, false);

        $role->delete();
    }

    private function ensureManagerCoverageAfterMutation(GroupRole $role, bool $willBeManager): void
    {
        $isCurrentlyManager = $this->permissions->roleIsManager($role);

        if (! $isCurrentlyManager || $willBeManager) {
            return;
        }

        $otherRoles = GroupRole::query()
            ->whereKeyNot($role->getKey())
            ->with('permissions')
            ->get();

        if ($otherRoles->doesntContain(fn (GroupRole $otherRole) => $this->permissions->roleIsManager($otherRole))) {
            throw ValidationException::withMessages([
                'permission_keys' => 'Deve esistere almeno un ruolo manager configurato.',
            ]);
        }

        $groupIds = $role->memberships()
            ->pluck('group_id')
            ->unique()
            ->values();

        if ($groupIds->isEmpty()) {
            return;
        }

        $membershipsByGroup = GroupMembership::query()
            ->whereIn('group_id', $groupIds)
            ->with('groupRole.permissions')
            ->get()
            ->groupBy('group_id');

        $blockingGroups = $membershipsByGroup
            ->filter(function (Collection $memberships) use ($role): bool {
                return $memberships->doesntContain(function (GroupMembership $membership) use ($role): bool {
                    return (int) $membership->group_role_id !== (int) $role->getKey()
                        && $membership->groupRole
                        && $this->permissions->roleIsManager($membership->groupRole);
                });
            })
            ->keys()
            ->all();

        if ($blockingGroups !== []) {
            throw ValidationException::withMessages([
                'permission_keys' => 'Almeno un gruppo perderebbe il suo ultimo manager con questa modifica.',
            ]);
        }
    }

    private function uniqueKeyForName(string $name, ?GroupRole $ignore = null): string
    {
        $baseKey = Str::slug($name);
        $baseKey = $baseKey !== '' ? $baseKey : 'role';
        $candidate = $baseKey;
        $suffix = 2;

        while (
            GroupRole::query()
                ->when($ignore, fn ($query) => $query->whereKeyNot($ignore->getKey()))
                ->where('key', $candidate)
                ->exists()
        ) {
            $candidate = $baseKey.'-'.$suffix;
            $suffix++;
        }

        return $candidate;
    }
}
