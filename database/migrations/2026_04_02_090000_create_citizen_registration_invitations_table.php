<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('citizen_registration_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('citizen_id')->nullable()->constrained()->nullOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('email');
            $table->string('phone_number');
            $table->string('fiscal_code', 16);
            $table->string('otp_code_hash')->nullable();
            $table->timestamp('magic_link_expires_at');
            $table->timestamp('magic_link_opened_at')->nullable();
            $table->timestamp('otp_sent_at')->nullable();
            $table->timestamp('otp_expires_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('last_ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['email', 'completed_at']);
            $table->index(['fiscal_code', 'completed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('citizen_registration_invitations');
    }
};
