<?php

namespace App\Actions\Chat;

use App\Models\ChatMessage;
use App\Models\ChatThread;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\ValidationException;

class DeleteChatMessage
{
    public function __construct(
        private readonly DeleteChatRecords $deleteChatRecords,
    ) {
    }

    public function handle(int|string $chatId, int|string $messageId, Model $actor): ChatMessage
    {
        $chat = ChatThread::query()->findOrFail($chatId);
        $message = $chat->messages()->findOrFail($messageId);

        $isParticipant = $chat->participants()
            ->where('participant_type', $actor::class)
            ->where('participant_id', $actor->getKey())
            ->exists();

        $isMessageOwner =
            $message->author_type === $actor::class &&
            $message->author_id === $actor->getKey();

        if (! $isParticipant) {
            throw ValidationException::withMessages([
                'chat' => 'Non sei un partecipante di questa chat.',
            ]);
        }

        if (! $isMessageOwner) {
            throw ValidationException::withMessages([
                'chat' => 'Non sei il proprietario di questo messaggio.',
            ]);
        }

        $this->deleteChatRecords->deleteMessage($message);

        return $message;
    }
}
