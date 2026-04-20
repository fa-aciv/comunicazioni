<?php

namespace App\Actions\Chat;

use App\Models\ChatThread;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class DeleteChatThread
{
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

        DB::transaction(function () use ($chat) {
            foreach ($chat->messages as $message) {
                foreach ($message->attachments as $attachment) {
                    Storage::disk(config('filesystems.default', 'local'))->delete($attachment->file_path);
                    $attachment->delete();
                }

                $message->delete();
            }

            $chat->delete();
        });

        return $chat;
    }
}
