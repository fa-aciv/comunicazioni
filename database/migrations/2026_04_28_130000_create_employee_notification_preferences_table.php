<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->boolean('email_notifications_enabled')->default(false);
            $table->boolean('notify_unread_chat_messages')->default(false);
            $table->unsignedInteger('unread_chat_email_delay_minutes')->default(30);
            $table->boolean('notify_group_contact_requests')->default(false);
            $table->unsignedInteger('group_contact_request_email_delay_minutes')->default(30);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_notification_preferences');
    }
};
