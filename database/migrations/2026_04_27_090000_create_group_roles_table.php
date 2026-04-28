<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_roles', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('group_role_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('group_permission_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['group_role_id', 'group_permission_id'], 'grp_role_perm_unique');
        });

        Schema::table('group_memberships', function (Blueprint $table) {
            $table->foreignId('group_role_id')
                ->nullable()
                ->after('user_id')
                ->constrained('group_roles')
                ->nullOnDelete();
        });

        $this->seedRolesAndMigrateMemberships();
    }

    public function down(): void
    {
        if (Schema::hasColumn('group_memberships', 'group_role_id')) {
            Schema::table('group_memberships', function (Blueprint $table) {
                $table->dropConstrainedForeignId('group_role_id');
            });
        }

        Schema::dropIfExists('group_role_permissions');
        Schema::dropIfExists('group_roles');
    }

    private function seedRolesAndMigrateMemberships(): void
    {
        $now = now();
        $permissionIdsByKey = collect(DB::table('group_permissions')->pluck('id', 'key')->all());

        $roleIdByKey = [];
        $roleKeyById = [];
        $rolePermissionKeysByKey = [];

        collect(config('groups.seed_roles', []))
            ->filter(fn (mixed $role) => is_array($role) && isset($role['key'], $role['name']))
            ->values()
            ->each(function (array $role) use (
                $now,
                $permissionIdsByKey,
                &$roleIdByKey,
                &$roleKeyById,
                &$rolePermissionKeysByKey
            ): void {
                $permissionKeys = collect($role['permission_keys'] ?? [])
                    ->filter(fn (mixed $key) => is_string($key) && $key !== '')
                    ->unique()
                    ->sort()
                    ->values()
                    ->all();

                $roleId = DB::table('group_roles')->insertGetId([
                    'key' => $role['key'],
                    'name' => $role['name'],
                    'description' => $role['description'] ?? null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                $roleIdByKey[$role['key']] = $roleId;
                $roleKeyById[$roleId] = $role['key'];
                $rolePermissionKeysByKey[$role['key']] = $permissionKeys;

                $permissionIds = collect($permissionKeys)
                    ->map(fn (string $key) => $permissionIdsByKey->get($key))
                    ->filter()
                    ->values();

                if ($permissionIds->isNotEmpty()) {
                    DB::table('group_role_permissions')->insert(
                        $permissionIds->map(fn (int $permissionId) => [
                            'group_role_id' => $roleId,
                            'group_permission_id' => $permissionId,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ])->all()
                    );
                }
            });

        $seedRoleIdBySignature = collect($rolePermissionKeysByKey)
            ->mapWithKeys(fn (array $permissionKeys, string $roleKey) => [
                $this->signature($permissionKeys) => $roleIdByKey[$roleKey],
            ])
            ->all();

        $permissionKeysByMembershipId = collect(
            DB::table('group_membership_permissions as pivot')
                ->join('group_permissions as permission', 'permission.id', '=', 'pivot.group_permission_id')
                ->select('pivot.group_membership_id', 'permission.key')
                ->orderBy('pivot.group_membership_id')
                ->orderBy('permission.key')
                ->get()
        )
            ->groupBy('group_membership_id')
            ->map(fn ($rows) => collect($rows)->pluck('key')->unique()->sort()->values()->all());

        $customRoleIdBySignature = [];
        $migrationCounter = 1;

        collect(DB::table('group_memberships')->select('id', 'role')->orderBy('id')->get())
            ->each(function (object $membership) use (
                $now,
                $permissionIdsByKey,
                $permissionKeysByMembershipId,
                $roleIdByKey,
                $rolePermissionKeysByKey,
                $seedRoleIdBySignature,
                &$roleKeyById,
                &$customRoleIdBySignature,
                &$migrationCounter
            ): void {
                $permissionKeys = $permissionKeysByMembershipId->get($membership->id, []);
                $signature = $this->signature($permissionKeys);
                $legacyRoleKey = is_string($membership->role) ? trim($membership->role) : '';

                $roleId = null;

                if (
                    $legacyRoleKey !== ''
                    && isset($roleIdByKey[$legacyRoleKey])
                    && (
                        $permissionKeys === []
                        || $this->signature($rolePermissionKeysByKey[$legacyRoleKey] ?? []) === $signature
                    )
                ) {
                    $roleId = $roleIdByKey[$legacyRoleKey];
                } elseif ($signature !== '' && isset($seedRoleIdBySignature[$signature])) {
                    $roleId = $seedRoleIdBySignature[$signature];
                } elseif ($signature === '' && $legacyRoleKey !== '' && isset($roleIdByKey[$legacyRoleKey])) {
                    $roleId = $roleIdByKey[$legacyRoleKey];
                }

                if ($roleId === null) {
                    if (! isset($customRoleIdBySignature[$signature])) {
                        $roleName = 'Ruolo migrato '.$migrationCounter;
                        $roleKey = 'migrated-'.$migrationCounter;

                        $migrationCounter++;

                        $customRoleIdBySignature[$signature] = DB::table('group_roles')->insertGetId([
                            'key' => $roleKey,
                            'name' => $roleName,
                            'description' => 'Creato automaticamente durante la migrazione dei permessi dei gruppi.',
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]);

                        $roleKeyById[$customRoleIdBySignature[$signature]] = $roleKey;

                        $permissionIds = collect($permissionKeys)
                            ->map(fn (string $key) => $permissionIdsByKey->get($key))
                            ->filter()
                            ->values();

                        if ($permissionIds->isNotEmpty()) {
                            DB::table('group_role_permissions')->insert(
                                $permissionIds->map(fn (int $permissionId) => [
                                    'group_role_id' => $customRoleIdBySignature[$signature],
                                    'group_permission_id' => $permissionId,
                                    'created_at' => $now,
                                    'updated_at' => $now,
                                ])->all()
                            );
                        }
                    }

                    $roleId = $customRoleIdBySignature[$signature];
                }

                DB::table('group_memberships')
                    ->where('id', $membership->id)
                    ->update([
                        'group_role_id' => $roleId,
                        'role' => $roleKeyById[$roleId] ?? $legacyRoleKey ?: 'migrated',
                        'updated_at' => $now,
                    ]);
            });
    }

    /**
     * @param  list<string>  $permissionKeys
     */
    private function signature(array $permissionKeys): string
    {
        return implode('|', collect($permissionKeys)->filter()->sort()->values()->all());
    }
};
