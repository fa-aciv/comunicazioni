<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatParticipant extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'chat_id',
        'participant_id',
        'participant_type',
    ];

    public function chat(): BelongsTo
    {
        return $this->belongsTo(ChatThread::class, 'chat_id');
    }

    // Participant (User or Citizen)
    public function participant(): MorphTo
    {
        return $this->morphTo();
    }
}