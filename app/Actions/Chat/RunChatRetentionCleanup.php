<?php

namespace App\Actions\Chat;

use App\Models\ChatMessage;
use App\Models\ChatRetentionSetting;
use App\Models\ChatThread;

class RunChatRetentionCleanup
{
    public function __construct(
        private readonly DeleteChatRecords $deleteChatRecords,
    ) {
    }

    /**
     * @return array{deleted_threads:int, deleted_messages:int}
     */
    public function handle(ChatRetentionSetting $settings, bool $dryRun = false): array
    {
        $inactiveThreadCutoff = now()->subDays($settings->inactive_thread_retention_days);
        $messageCutoff = now()->subDays($settings->message_retention_days);

        $deletedThreads = 0;
        $deletedMessages = 0;

        ChatThread::query()
            ->whereNull('group_id')
            ->whereDoesntHave('groupContactRequest.group')
            ->where('last_activity_at', '<', $inactiveThreadCutoff)
            ->orderBy('id')
            ->chunkById(100, function ($threads) use (&$deletedThreads, $dryRun): void {
                foreach ($threads as $thread) {
                    $deletedThreads++;

                    if ($dryRun) {
                        continue;
                    }

                    $this->deleteChatRecords->deleteThread($thread);
                }
            });

        ChatThread::query()
            ->with(['group', 'groupContactRequest.group'])
            ->where(function ($query): void {
                $query
                    ->whereHas('group')
                    ->orWhereHas('groupContactRequest.group');
            })
            ->orderBy('id')
            ->chunkById(100, function ($threads) use (&$deletedThreads, $dryRun, $settings): void {
                foreach ($threads as $thread) {
                    $retentionDays = $thread->group?->chat_inactive_thread_retention_days
                        ?? $thread->groupContactRequest?->group?->chat_inactive_thread_retention_days
                        ?? $settings->inactive_thread_retention_days;
                    $cutoff = now()->subDays($retentionDays);

                    if (! $thread->last_activity_at?->lt($cutoff)) {
                        continue;
                    }

                    $deletedThreads++;

                    if ($dryRun) {
                        continue;
                    }

                    $this->deleteChatRecords->deleteThread($thread);
                }
            });

        ChatMessage::query()
            ->whereHas('chat', fn ($query) => $query
                ->whereNull('group_id')
                ->whereDoesntHave('groupContactRequest.group'))
            ->where('created_at', '<', $messageCutoff)
            ->orderBy('id')
            ->chunkById(100, function ($messages) use (&$deletedMessages, $dryRun): void {
                foreach ($messages as $message) {
                    $deletedMessages++;

                    if ($dryRun) {
                        continue;
                    }

                    $this->deleteChatRecords->deleteMessage($message, touchThreadActivity: false);
                }
            });

        ChatMessage::query()
            ->with(['chat.group', 'chat.groupContactRequest.group'])
            ->where(function ($query): void {
                $query
                    ->whereHas('chat.group')
                    ->orWhereHas('chat.groupContactRequest.group');
            })
            ->orderBy('id')
            ->chunkById(100, function ($messages) use (&$deletedMessages, $dryRun, $settings): void {
                foreach ($messages as $message) {
                    $retentionDays = $message->chat?->group?->chat_message_retention_days
                        ?? $message->chat?->groupContactRequest?->group?->chat_message_retention_days
                        ?? $settings->message_retention_days;
                    $cutoff = now()->subDays($retentionDays);

                    if (! $message->created_at?->lt($cutoff)) {
                        continue;
                    }

                    $deletedMessages++;

                    if ($dryRun) {
                        continue;
                    }

                    $this->deleteChatRecords->deleteMessage($message, touchThreadActivity: false);
                }
            });

        if (! $dryRun) {
            $settings->forceFill([
                'last_cleanup_at' => now(),
            ])->save();
        }

        return [
            'deleted_threads' => $deletedThreads,
            'deleted_messages' => $deletedMessages,
        ];
    }
}
