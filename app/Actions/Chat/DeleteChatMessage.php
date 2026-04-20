<?php

namespace App\Actions\Chat;

use App\Models\ChatMessage;
use App\Models\ChatThread;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class DeleteChatMessage
{
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

        return DB::transaction(function () use ($chat, $message) {
            foreach ($message->attachments as $attachment) {
                Storage::disk(config('filesystems.default', 'local'))->delete($attachment->file_path);
                $attachment->delete();
            }

            $message->delete();

            // Aggiorna la data dell'ultimo messaggio solo se il messaggio cancellato era l'ultimo
            if ($chat->latest_message_date === $message->created_at) {
                $latestMessage = $chat->messages()->latest('created_at')->first();
                $chat->forceFill([
                    'latest_message_date' => $latestMessage?->created_at,
                ])->save();
            }

            return $message;
        });
    }
}
