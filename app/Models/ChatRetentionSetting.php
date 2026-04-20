<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatRetentionSetting extends Model
{
    protected $fillable = [
        'id',
        'message_retention_days',
        'inactive_thread_retention_days',
        'last_cleanup_at',
    ];

    protected $casts = [
        'last_cleanup_at' => 'datetime',
    ];

    public static function current(): self
    {
        return static::query()->firstOrCreate(
            ['id' => 1],
            [
                'message_retention_days' => 15,
                'inactive_thread_retention_days' => 60,
            ],
        );
    }
}
