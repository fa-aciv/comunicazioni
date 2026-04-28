<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->foreignId('default_group_role_id')
                ->nullable()
                ->after('is_active')
                ->constrained('group_roles')
                ->nullOnDelete();
        });

        $defaultRoleId = $this->resolveDefaultRoleId();

        if ($defaultRoleId !== null) {
            DB::table('groups')
                ->whereNull('default_group_role_id')
                ->update([
                    'default_group_role_id' => $defaultRoleId,
                    'updated_at' => now(),
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->dropConstrainedForeignId('default_group_role_id');
        });
    }

    private function resolveDefaultRoleId(): ?int
    {
        $userRoleId = DB::table('group_roles')
            ->where('key', 'user')
            ->value('id');

        if (is_numeric($userRoleId)) {
            return (int) $userRoleId;
        }

        $managerPermissionKeys = collect(config('groups.manager_permission_keys', []))
            ->filter(fn (mixed $key) => is_string($key) && $key !== '')
            ->values();

        $roles = DB::table('group_roles')
            ->select('group_roles.id')
            ->leftJoin('group_role_permissions', 'group_role_permissions.group_role_id', '=', 'group_roles.id')
            ->leftJoin('group_permissions', 'group_permissions.id', '=', 'group_role_permissions.group_permission_id')
            ->groupBy('group_roles.id')
            ->orderBy('group_roles.name')
            ->get()
            ->map(function (object $role) use ($managerPermissionKeys): ?int {
                if ($managerPermissionKeys->isEmpty()) {
                    return (int) $role->id;
                }

                $permissionKeys = DB::table('group_role_permissions')
                    ->join('group_permissions', 'group_permissions.id', '=', 'group_role_permissions.group_permission_id')
                    ->where('group_role_permissions.group_role_id', $role->id)
                    ->pluck('group_permissions.key');

                return $managerPermissionKeys->every(
                    fn (string $permissionKey) => $permissionKeys->contains($permissionKey)
                ) ? null : (int) $role->id;
            })
            ->filter()
            ->values();

        return $roles->first();
    }
};
