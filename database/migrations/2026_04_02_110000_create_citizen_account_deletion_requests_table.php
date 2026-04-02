<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('citizen_account_deletion_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('citizen_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('verification_email');
            $table->string('verification_phone_number');
            $table->string('otp_code_hash')->nullable();
            $table->timestamp('magic_link_expires_at');
            $table->timestamp('magic_link_opened_at')->nullable();
            $table->timestamp('otp_sent_at')->nullable();
            $table->timestamp('otp_expires_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('last_ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['citizen_id', 'completed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('citizen_account_deletion_requests');
    }
};
