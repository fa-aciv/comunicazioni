<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('chat_id')->constrained('chat_threads')->cascadeOnDelete();

            // Polymorphic author (User or Citizen)
            $table->morphs('author');

            $table->text('content');

            $table->timestamps();

            // helpful for ordering and lookups
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
    }
};