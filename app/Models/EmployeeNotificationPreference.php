<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeNotificationPreference extends Model
{
    public const DEFAULTS = [
        'email_notifications_enabled' => false,
        'notify_unread_chat_messages' => false,
        'unread_chat_email_delay_minutes' => 30,
        'notify_group_contact_requests' => false,
        'group_contact_request_email_delay_minutes' => 30,
    ];

    protected $fillable = [
        'user_id',
        'email_notifications_enabled',
        'notify_unread_chat_messages',
        'unread_chat_email_delay_minutes',
        'notify_group_contact_requests',
        'group_contact_request_email_delay_minutes',
    ];

    protected function casts(): array
    {
        return [
            'email_notifications_enabled' => 'boolean',
            'notify_unread_chat_messages' => 'boolean',
            'unread_chat_email_delay_minutes' => 'integer',
            'notify_group_contact_requests' => 'boolean',
            'group_contact_request_email_delay_minutes' => 'integer',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function defaults(): array
    {
        return self::DEFAULTS;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
