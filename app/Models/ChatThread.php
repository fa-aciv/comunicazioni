<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ChatThread extends Model
{
    use HasFactory;

    protected $fillable = [
        'creator_id',
        'creator_type',
        'title',
        'group_id',
        'latest_message_date',
        'last_activity_at',
    ];

    protected $casts = [
        'latest_message_date' => 'datetime',
        'last_activity_at' => 'datetime',
    ];

    // Creator (User or Citizen)
    public function creator(): MorphTo
    {
        return $this->morphTo();
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    // Participants
    public function participants(): HasMany
    {
        return $this->hasMany(ChatParticipant::class, 'chat_id');
    }

    // Messages
    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'chat_id');
    }

    public function latestMessage(): HasOne
    {
        return $this->hasOne(ChatMessage::class, 'chat_id')->latestOfMany('created_at');
    }

    public function groupContactRequest(): HasOne
    {
        return $this->hasOne(GroupContactRequest::class, 'chat_thread_id');
    }
}
