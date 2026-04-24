<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_participants', function (Blueprint $table) {
            $table->id();

            $table->foreignId('chat_id')->constrained('chat_threads')->cascadeOnDelete();

            // Polymorphic participant (User or Citizen)
            $table->morphs('participant');

            // optional: role, joined_at, etc. (not required)
            // $table->string('role')->nullable();
            //$table->timestamp('joined_at')->nullable();

            // keep timestamps off by default in the model; if you want created_at set $table->timestamps();
            // no timestamps by default to match the model in the previous message
            $table->unique(['chat_id', 'participant_id', 'participant_type'], 'chat_participant_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chat_participants');
    }
};
