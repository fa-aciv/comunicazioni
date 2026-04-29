<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('group_contact_request_notifications')) {
            Schema::create('group_contact_request_notifications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('group_contact_request_id');
                $table->foreignId('user_id');
                $table->timestamp('notified_at');
                $table->timestamps();
            });
        }

        Schema::table('group_contact_request_notifications', function (Blueprint $table) {
            if (! Schema::hasIndex('group_contact_request_notifications', 'gcr_notifications_req_user_unq', 'unique')) {
                $table->unique(
                    ['group_contact_request_id', 'user_id'],
                    'gcr_notifications_req_user_unq'
                );
            }

            if (! $this->hasForeignKey('group_contact_request_notifications', 'gcr_notif_req_fk')) {
                $table->foreign('group_contact_request_id', 'gcr_notif_req_fk')
                    ->references('id')
                    ->on('group_contact_requests')
                    ->cascadeOnDelete();
            }

            if (! $this->hasForeignKey('group_contact_request_notifications', 'gcr_notif_user_fk')) {
                $table->foreign('user_id', 'gcr_notif_user_fk')
                    ->references('id')
                    ->on('users')
                    ->cascadeOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('group_contact_request_notifications');
    }

    private function hasForeignKey(string $table, string $name): bool
    {
        return collect(Schema::getForeignKeys($table))
            ->contains(fn (array $foreignKey) => ($foreignKey['name'] ?? null) === $name);
    }
};
