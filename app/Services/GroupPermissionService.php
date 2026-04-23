<?php

namespace App\Services;

use App\Enums\GroupMembershipRole;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\GroupPermission;
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
    public function defaultPermissionKeysForRole(GroupMembershipRole $role): array
    {
        return array_values(config('groups.role_defaults.'.$role->value, []));
    }

    public function membershipFor(User $user, Group $group): ?GroupMembership
    {
        return GroupMembership::query()
            ->where('group_id', $group->getKey())
            ->where('user_id', $user->getKey())
            ->with('permissions')
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
    public function syncMembershipPermissions(GroupMembership $membership, array $permissionKeys): void
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
                'permissions' => 'Permessi non validi: '.implode(', ', $invalidKeys),
            ]);
        }

        $membership->permissions()->sync($permissions->pluck('id')->all());
        $membership->load('permissions');
    }

    public function applyRoleDefaults(GroupMembership $membership): void
    {
        $role = $membership->role instanceof GroupMembershipRole
            ? $membership->role
            : GroupMembershipRole::from((string) $membership->role);

        $this->syncMembershipPermissions(
            $membership,
            $this->defaultPermissionKeysForRole($role)
        );
    }
}
