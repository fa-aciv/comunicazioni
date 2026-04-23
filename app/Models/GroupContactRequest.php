<?php

namespace App\Models;

use App\Enums\GroupContactRequestStatus;
use Database\Factories\GroupContactRequestFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GroupContactRequest extends Model
{
    /** @use HasFactory<GroupContactRequestFactory> */
    use HasFactory;

    protected $fillable = [
        'group_id',
        'citizen_id',
        'subject',
        'message',
        'status',
        'accepted_by_user_id',
        'accepted_at',
        'chat_thread_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => GroupContactRequestStatus::class,
            'accepted_at' => 'datetime',
        ];
    }

    protected static function newFactory(): GroupContactRequestFactory
    {
        return GroupContactRequestFactory::new();
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function citizen(): BelongsTo
    {
        return $this->belongsTo(Citizen::class);
    }

    public function acceptedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'accepted_by_user_id');
    }

    public function chatThread(): BelongsTo
    {
        return $this->belongsTo(ChatThread::class, 'chat_thread_id');
    }
}
