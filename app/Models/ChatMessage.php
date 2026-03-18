<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatMessage extends Model
{
    protected $fillable = [
        'chat_id',
        'author_id',
        'author_type',
        'content',
    ];

    public function chat(): BelongsTo
    {
        return $this->belongsTo(ChatThread::class, 'chat_id');
    }

    // Author (User or Citizen)
    public function author(): MorphTo
    {
        return $this->morphTo();
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(MessageAttachment::class, 'message_id');
    }
}