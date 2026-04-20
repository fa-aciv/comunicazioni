<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_retention_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('message_retention_days')->default(15);
            $table->unsignedInteger('inactive_thread_retention_days')->default(60);
            $table->timestamp('last_cleanup_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_retention_settings');
    }
};
