<?php

namespace App\Services;

use Illuminate\Support\Collection;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class EmployeeAuthorizationService
{
    public function __construct(
        private readonly PermissionRegistrar $permissionRegistrar
    ) {
    }

    public function syncCatalog(): void
    {
        $this->permissionRegistrar->forgetCachedPermissions();

        $permissionKeys = collect(config('employee-authorization.permissions', []))
            ->pluck('key')
            ->filter(fn (mixed $key) => is_string($key) && $key !== '')
            ->values();

        $permissionKeys->each(function (string $permissionKey): void {
            Permission::findOrCreate($permissionKey, 'employee');
        });

        collect(config('employee-authorization.role_defaults', []))
            ->each(function (array $permissions, string $roleName): void {
                $role = Role::findOrCreate($roleName, 'employee');
                $role->syncPermissions($permissions);
            });

        $this->permissionRegistrar->forgetCachedPermissions();
    }

    /**
     * @return Collection<int, array{key: string, name: string, description: string|null}>
     */
    public function permissionDefinitions(): Collection
    {
        return collect(config('employee-authorization.permissions', []))
            ->filter(fn (mixed $definition) => is_array($definition) && isset($definition['key'], $definition['name']))
            ->values();
    }
}
