<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_threads', function (Blueprint $table) {
            $table->foreignId('group_id')
                ->nullable()
                ->after('title')
                ->constrained()
                ->nullOnDelete();
        });

        DB::table('group_contact_requests')
            ->whereNotNull('chat_thread_id')
            ->orderBy('id')
            ->chunkById(100, function ($requests): void {
                foreach ($requests as $request) {
                    DB::table('chat_threads')
                        ->where('id', $request->chat_thread_id)
                        ->whereNull('group_id')
                        ->update([
                            'group_id' => $request->group_id,
                        ]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('chat_threads', function (Blueprint $table) {
            $table->dropConstrainedForeignId('group_id');
        });
    }
};
