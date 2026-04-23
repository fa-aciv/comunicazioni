<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('group_membership_permissions')) {
            Schema::create('group_membership_permissions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('group_membership_id')->constrained()->cascadeOnDelete();
                $table->foreignId('group_permission_id')->constrained()->cascadeOnDelete();
                $table->timestamps();
            });
        }

        if (! $this->hasIndex('group_membership_permissions', 'grp_mem_perm_unique')) {
            Schema::table('group_membership_permissions', function (Blueprint $table) {
                $table->unique(['group_membership_id', 'group_permission_id'], 'grp_mem_perm_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('group_membership_permissions');
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        return match (Schema::getConnection()->getDriverName()) {
            'mysql' => DB::table('information_schema.statistics')
                ->where('table_schema', DB::getDatabaseName())
                ->where('table_name', $table)
                ->where('index_name', $indexName)
                ->exists(),
            'sqlite' => collect(DB::select("PRAGMA index_list('{$table}')"))
                ->contains(fn (object $index) => $index->name === $indexName),
            default => false,
        };
    }
};
