<?php

namespace App\Actions\Chat;

use App\Models\ChatThread;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class DeleteChatThread
{
    public function __construct(
        private readonly DeleteChatRecords $deleteChatRecords,
    ) {
    }

    public function handle(int|string $chatId, Model $actor): ChatThread
    {
        $chat = ChatThread::query()->findOrFail($chatId);

        $isParticipant = $chat->participants()
            ->where('participant_type', $actor::class)
            ->where('participant_id', $actor->getKey())
            ->exists();

        if (! $isParticipant) {
            throw ValidationException::withMessages([
                'chat' => 'Non sei un partecipante di questa chat.',
            ]);
        }

        $this->deleteChatRecords->deleteThread($chat);

        return $chat;
    }
}
