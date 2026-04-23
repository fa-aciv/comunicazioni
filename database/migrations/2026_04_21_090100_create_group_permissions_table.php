<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('group_permissions', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        $definitions = collect(config('groups.permissions', []))
            ->map(fn (array $definition) => [
                'key' => $definition['key'],
                'name' => $definition['name'],
                'description' => $definition['description'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ])
            ->all();

        if ($definitions !== []) {
            DB::table('group_permissions')->insert($definitions);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('group_permissions');
    }
};
