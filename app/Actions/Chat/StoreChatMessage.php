<?php

namespace App\Actions\Chat;

use App\Models\ChatMessage;
use App\Models\ChatThread;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class StoreChatMessage
{
    /**
     * @param  array<int, UploadedFile>  $attachments
     */
    public function handle(int|string $chatId, Model $actor, ?string $content, array $attachments = []): ChatMessage
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

        return DB::transaction(function () use ($chat, $actor, $content, $attachments) {
            $message = $chat->messages()->create([
                'author_id' => $actor->getKey(),
                'author_type' => $actor::class,
                'content' => $content ?? '',
            ]);

            $disk = config('filesystems.default', 'local');

            foreach ($attachments as $attachment) {
                $path = $attachment->store(
                    'attachments/'.$chat->getKey().'/'.$message->getKey(),
                    $disk
                );

                $message->attachments()->create([
                    'chat_id' => $chat->getKey(),
                    'author_id' => $actor->getKey(),
                    'author_type' => $actor::class,
                    'file_path' => $path,
                    'file_name' => $attachment->getClientOriginalName(),
                ]);
            }

            $chat->forceFill([
                'latest_message_date' => $message->created_at,
            ])->save();

            return $message->load('attachments');
        });
    }
}
