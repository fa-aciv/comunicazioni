<?php

namespace App\Http\Controllers\Concerns;

use App\Models\ChatThread;
use App\Models\Citizen;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

trait MapsChatThreadData
{
    protected function actorThreadsQuery(Model $actor): Builder
    {
        return ChatThread::query()
            ->whereHas('participants', function ($query) use ($actor): void {
                $query
                    ->where('participant_type', $actor::class)
                    ->where('participant_id', $actor->getKey());
            });
    }

    protected function applyThreadSearch(Builder $query, string $search): Builder
    {
        $search = trim($search);

        if ($search === '') {
            return $query;
        }

        $likeSearch = '%'.$search.'%';
        $upperLikeSearch = '%'.strtoupper($search).'%';

        return $query->where(function (Builder $searchQuery) use ($likeSearch, $upperLikeSearch): void {
            $searchQuery
                ->where('title', 'like', $likeSearch)
                ->orWhereHas('latestMessage', function (Builder $messageQuery) use ($likeSearch): void {
                    $messageQuery->where('content', 'like', $likeSearch);
                })
                ->orWhereHas('participants', function (Builder $participantQuery) use ($likeSearch, $upperLikeSearch): void {
                    $participantQuery
                        ->whereHasMorph(
                            'participant',
                            [Citizen::class],
                            function (Builder $citizenQuery) use ($likeSearch, $upperLikeSearch): void {
                                $citizenQuery->where(function (Builder $query) use ($likeSearch, $upperLikeSearch): void {
                                    $query
                                        ->where('name', 'like', $likeSearch)
                                        ->orWhere('email', 'like', $likeSearch)
                                        ->orWhere('phone_number', 'like', $likeSearch)
                                        ->orWhere('fiscal_code', 'like', $upperLikeSearch);
                                });
                            }
                        )
                        ->orWhereHasMorph(
                            'participant',
                            [User::class],
                            function (Builder $employeeQuery) use ($likeSearch): void {
                                $employeeQuery->where(function (Builder $query) use ($likeSearch): void {
                                    $query
                                        ->where('name', 'like', $likeSearch)
                                        ->orWhere('email', 'like', $likeSearch)
                                        ->orWhere('department_name', 'like', $likeSearch);
                                });
                            }
                        );
                });
        });
    }

    protected function withUnreadMessageCount(Builder $query, Model $actor): Builder
    {
        return $query->withCount([
            'messages as unread_message_count' => function (Builder $messageQuery) use ($actor): void {
                $messageQuery
                    ->where(function (Builder $authorQuery) use ($actor): void {
                        $authorQuery
                            ->where('author_type', '!=', $actor::class)
                            ->orWhere('author_id', '!=', $actor->getKey());
                    })
                    ->where(
                        'created_at',
                        '>',
                        function ($subquery) use ($actor) {
                            $subquery
                                ->from('chat_participants')
                                ->selectRaw('coalesce(last_read_at, ?)', ['1970-01-01 00:00:00'])
                                ->whereColumn('chat_participants.chat_id', 'chat_messages.chat_id')
                                ->where('participant_type', $actor::class)
                                ->where('participant_id', $actor->getKey())
                                ->limit(1);
                        }
                    );
            },
        ]);
    }

    protected function markThreadAsRead(ChatThread $thread, Model $actor): void
    {
        $thread->participants()
            ->where('participant_type', $actor::class)
            ->where('participant_id', $actor->getKey())
            ->update([
                'last_read_at' => $thread->latest_message_date ?? now(),
                'last_unread_notification_sent_at' => null,
            ]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function mapChatSummary(ChatThread $thread): array
    {
        $participants = $thread->participants;
        $citizenParticipant = $participants->first(
            fn ($participant) => $participant->participant instanceof Citizen
        );
        $latestMessage = $thread->latestMessage;
        $latestContent = trim((string) ($latestMessage?->content ?? ''));

        if ($latestContent !== '') {
            $latestPreview = Str::limit($latestContent, 80);
        } elseif (($latestMessage?->attachments?->count() ?? 0) > 0) {
            $latestPreview = 'Allegato condiviso';
        } else {
            $latestPreview = 'Nessun messaggio ancora presente';
        }

        return [
            'id' => $thread->id,
            'title' => $thread->title ?: 'Chat senza titolo',
            'latest_message_date' => optional($thread->latest_message_date)->toIso8601String(),
            'last_activity_at' => optional($thread->last_activity_at)->toIso8601String(),
            'message_count' => $thread->messages_count,
            'unread_message_count' => $thread->unread_message_count ?? 0,
            'latest_message_preview' => $latestPreview,
            'latest_message_author' => $latestMessage ? [
                'id' => $latestMessage->author?->getKey(),
                'type' => class_basename($latestMessage->author_type),
                'name' => $latestMessage->author?->name,
            ] : null,
            'citizen' => $citizenParticipant?->participant ? [
                'id' => $citizenParticipant->participant->id,
                'name' => $citizenParticipant->participant->name,
                'email' => $citizenParticipant->participant->email,
                'phone_number' => $citizenParticipant->participant->phone_number,
                'fiscal_code' => $citizenParticipant->participant->fiscal_code,
            ] : null,
            'employee_count' => $participants
                ->filter(fn ($participant) => $participant->participant instanceof User)
                ->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function mapSelectedChat(ChatThread $thread, string $attachmentRoutePrefix): array
    {
        $participants = $thread->participants;
        $citizenParticipant = $participants->first(
            fn ($participant) => $participant->participant instanceof Citizen
        );
        $employeeParticipants = $participants
            ->filter(fn ($participant) => $participant->participant instanceof User)
            ->values();

        return [
            'id' => $thread->id,
            'title' => $thread->title ?: 'Chat senza titolo',
            'latest_message_date' => optional($thread->latest_message_date)->toIso8601String(),
            'last_activity_at' => optional($thread->last_activity_at)->toIso8601String(),
            'citizen' => $citizenParticipant?->participant ? [
                'id' => $citizenParticipant->participant->id,
                'name' => $citizenParticipant->participant->name,
                'email' => $citizenParticipant->participant->email,
                'phone_number' => $citizenParticipant->participant->phone_number,
                'fiscal_code' => $citizenParticipant->participant->fiscal_code,
            ] : null,
            'employees' => $employeeParticipants->map(fn ($participant) => [
                'id' => $participant->participant->id,
                'name' => $participant->participant->name,
                'email' => $participant->participant->email,
                'department_name' => $participant->participant->department_name,
            ])->values(),
            'messages' => $thread->messages->map(fn ($message) => [
                'id' => $message->id,
                'content' => $message->content,
                'created_at' => optional($message->created_at)->toIso8601String(),
                'author' => [
                    'id' => $message->author?->getKey(),
                    'type' => class_basename($message->author_type),
                    'name' => $message->author?->name,
                    'email' => $message->author?->email,
                ],
                'attachments' => $message->attachments
                    ->map(fn (MessageAttachment $attachment) => $this->mapAttachment($attachment, $attachmentRoutePrefix))
                    ->values(),
            ])->values(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function mapAttachment(MessageAttachment $attachment, string $attachmentRoutePrefix): array
    {
        $disk = config('filesystems.default', 'local');
        $mimeType = Storage::disk($disk)->mimeType($attachment->file_path) ?: '';
        $kind = match (true) {
            $mimeType === 'application/pdf' => 'pdf',
            str_starts_with($mimeType, 'image/') => 'image',
            default => 'file',
        };

        return [
            'id' => $attachment->id,
            'file_name' => $attachment->file_name,
            'kind' => $kind,
            'preview_url' => route($attachmentRoutePrefix.'.attachments.show', $attachment),
            'download_url' => route($attachmentRoutePrefix.'.attachments.download', $attachment),
        ];
    }
}
