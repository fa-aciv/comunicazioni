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
            $table->unsignedInteger('chat_message_retention_days')
                ->default(15)
                ->after('is_active');
            $table->unsignedInteger('chat_inactive_thread_retention_days')
                ->default(60)
                ->after('chat_message_retention_days');
        });

        $settings = DB::table('chat_retention_settings')
            ->select(['message_retention_days', 'inactive_thread_retention_days'])
            ->first();

        if ($settings) {
            DB::table('groups')->update([
                'chat_message_retention_days' => (int) $settings->message_retention_days,
                'chat_inactive_thread_retention_days' => (int) $settings->inactive_thread_retention_days,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('groups', function (Blueprint $table) {
            $table->dropColumn([
                'chat_message_retention_days',
                'chat_inactive_thread_retention_days',
            ]);
        });
    }
};
