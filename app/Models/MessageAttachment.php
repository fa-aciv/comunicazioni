<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class MessageAttachment extends Model
{
    protected $fillable = [
        'message_id',
        'chat_id',
        'author_id',
        'author_type',
        'file_path',
        'file_name',
    ];

    public function message(): BelongsTo
    {
        return $this->belongsTo(ChatMessage::class, 'message_id');
    }

    public function chat(): BelongsTo
    {
        return $this->belongsTo(ChatThread::class, 'chat_id');
    }

    public function author(): MorphTo
    {
        return $this->morphTo();
    }
}