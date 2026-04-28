<?php

namespace App\Services;

use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\GroupPermission;
use App\Models\GroupRole;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class GroupPermissionService
{
    public function syncCatalog(): void
    {
        $now = now();

        GroupPermission::query()->upsert(
            collect(config('groups.permissions', []))
                ->map(fn (array $definition) => [
                    'key' => $definition['key'],
                    'name' => $definition['name'],
                    'description' => $definition['description'] ?? null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])
                ->all(),
            ['key'],
            ['name', 'description', 'updated_at']
        );
    }

    /**
     * @return Collection<int, GroupPermission>
     */
    public function catalog(): Collection
    {
        $this->syncCatalog();

        return GroupPermission::query()
            ->orderBy('name')
            ->get();
    }

    /**
     * @return list<string>
     */
    public function managerPermissionKeys(): array
    {
        return collect(config('groups.manager_permission_keys', []))
            ->filter(fn (mixed $key) => is_string($key) && $key !== '')
            ->unique()
            ->values()
            ->all();
    }

    public function roleIsManager(GroupRole $role): bool
    {
        $permissionKeys = $role->relationLoaded('permissions')
            ? $role->permissions->pluck('key')->all()
            : $role->permissions()->pluck('key')->all();

        return $this->permissionKeysGrantManagerAccess($permissionKeys);
    }

    /**
     * @param  list<string>  $permissionKeys
     */
    public function permissionKeysGrantManagerAccess(array $permissionKeys): bool
    {
        $granted = collect($permissionKeys)->values();

        return collect($this->managerPermissionKeys())
            ->every(fn (string $permissionKey) => $granted->contains($permissionKey));
    }

    public function defaultManagerRole(): ?GroupRole
    {
        $roles = GroupRole::query()
            ->with('permissions')
            ->orderByRaw("case when `key` = 'manager' then 0 else 1 end")
            ->orderBy('name')
            ->get();

        return $roles->first(fn (GroupRole $role) => $this->roleIsManager($role));
    }

    public function membershipFor(User $user, Group $group): ?GroupMembership
    {
        return GroupMembership::query()
            ->where('group_id', $group->getKey())
            ->where('user_id', $user->getKey())
            ->with('groupRole.permissions')
            ->first();
    }

    public function has(User $user, Group $group, string $permissionKey): bool
    {
        $membership = $this->membershipFor($user, $group);

        if (! $membership) {
            return false;
        }

        return $membership->hasPermission($permissionKey);
    }

    /**
     * @param  list<string>  $permissionKeys
     */
    public function syncRolePermissions(GroupRole $role, array $permissionKeys): void
    {
        $this->syncCatalog();

        $requestedKeys = collect($permissionKeys)
            ->filter(fn (mixed $key) => is_string($key) && $key !== '')
            ->unique()
            ->values();

        $permissions = GroupPermission::query()
            ->whereIn('key', $requestedKeys)
            ->get();

        if ($permissions->count() !== $requestedKeys->count()) {
            $knownKeys = $permissions->pluck('key');
            $invalidKeys = $requestedKeys->diff($knownKeys)->values()->all();

            throw ValidationException::withMessages([
                'permission_keys' => 'Permessi non validi: '.implode(', ', $invalidKeys),
            ]);
        }

        $role->permissions()->sync($permissions->pluck('id')->all());
        $role->load('permissions');
    }
}
