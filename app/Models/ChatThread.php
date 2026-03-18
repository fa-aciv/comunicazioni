<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatThread extends Model
{
    use HasFactory;

    protected $fillable = [
        'creator_id',
        'creator_type',
        'title',
        'latest_message_date',
    ];

    protected $casts = [
        'latest_message_date' => 'datetime',
    ];

    // Creator (User or Citizen)
    public function creator(): MorphTo
    {
        return $this->morphTo();
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
}
