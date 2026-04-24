<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_participants', function (Blueprint $table) {
            $table->timestamp('last_read_at')->nullable()->after('participant_type');
        });

        DB::table('chat_participants')->update([
            'last_read_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::table('chat_participants', function (Blueprint $table) {
            $table->dropColumn('last_read_at');
        });
    }
};
