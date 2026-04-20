<?php

namespace App\Actions\Chat;

use App\Models\ChatMessage;
use App\Models\ChatThread;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DeleteChatRecords
{
    public function deleteMessage(ChatMessage $message, bool $touchThreadActivity = true): void
    {
        DB::transaction(function () use ($message, $touchThreadActivity): void {
            /** @var ChatMessage $message */
            $message = ChatMessage::query()
                ->with(['attachments', 'chat'])
                ->findOrFail($message->getKey());

            $chat = $message->chat;

            foreach ($message->attachments as $attachment) {
                Storage::disk(config('filesystems.default', 'local'))->delete($attachment->file_path);
            }

            $wasLatestMessage = $chat?->latest_message_date !== null
                && $message->created_at !== null
                && $chat->latest_message_date->equalTo($message->created_at);

            $message->delete();

            if (! $chat) {
                return;
            }

            $updates = [];

            if ($wasLatestMessage) {
                $updates['latest_message_date'] = $chat->messages()
                    ->latest('created_at')
                    ->value('created_at');
            }

            if ($touchThreadActivity) {
                $updates['last_activity_at'] = now();
            }

            if ($updates === []) {
                return;
            }

            $chat->forceFill($updates)->save();
        });
    }

    public function deleteThread(ChatThread $chat): void
    {
        DB::transaction(function () use ($chat): void {
            /** @var ChatThread $chat */
            $chat = ChatThread::query()
                ->with('messages.attachments')
                ->findOrFail($chat->getKey());

            foreach ($chat->messages as $message) {
                foreach ($message->attachments as $attachment) {
                    Storage::disk(config('filesystems.default', 'local'))->delete($attachment->file_path);
                }
            }

            $chat->delete();
        });
    }
}
