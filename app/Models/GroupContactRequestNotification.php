<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GroupContactRequestNotification extends Model
{
    protected $fillable = [
        'group_contact_request_id',
        'user_id',
        'notified_at',
    ];

    protected function casts(): array
    {
        return [
            'notified_at' => 'datetime',
        ];
    }

    public function contactRequest(): BelongsTo
    {
        return $this->belongsTo(GroupContactRequest::class, 'group_contact_request_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
