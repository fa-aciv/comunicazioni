<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('citizens', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone_number');
            $table->string('fiscal_code', 16)->unique();
            $table->timestamp('last_login_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('citizen_login_challenges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('citizen_id')->constrained()->cascadeOnDelete();
            $table->uuid('uuid')->unique();
            $table->string('otp_code_hash')->nullable();
            $table->timestamp('magic_link_expires_at');
            $table->timestamp('magic_link_opened_at')->nullable();
            $table->timestamp('otp_sent_at')->nullable();
            $table->timestamp('otp_expires_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('last_ip_address', 45)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('citizen_login_challenges');
        Schema::dropIfExists('citizens');
    }
};
