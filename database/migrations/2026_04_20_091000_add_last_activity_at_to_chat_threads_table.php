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
            $table->timestamp('last_activity_at')->nullable()->after('latest_message_date')->index();
        });

        DB::table('chat_threads')->update([
            'last_activity_at' => DB::raw('COALESCE(latest_message_date, updated_at, created_at)'),
        ]);
    }

    public function down(): void
    {
        Schema::table('chat_threads', function (Blueprint $table) {
            $table->dropColumn('last_activity_at');
        });
    }
};
