<?php

namespace App\Actions\Group;

use App\Enums\GroupContactRequestStatus;
use App\Models\ChatMessage;
use App\Models\ChatParticipant;
use App\Models\ChatThread;
use App\Models\GroupContactRequest;
use App\Models\User;
use App\Services\GroupPermissionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AcceptGroupContactRequest
{
    public function __construct(
        private readonly GroupPermissionService $permissions
    ) {
    }

    public function handle(GroupContactRequest $request, User $actor, string $title): ChatThread
    {
        $request->loadMissing(['group', 'citizen']);
        $title = trim($title);

        if (! $this->permissions->has($actor, $request->group, 'group.contact_requests.accept')) {
            throw ValidationException::withMessages([
                'request' => 'Non puoi accettare richieste di contatto per questo gruppo.',
            ]);
        }

        if ($title === '') {
            throw ValidationException::withMessages([
                'title' => 'Inserisci un titolo per la chat.',
            ]);
        }

        return DB::transaction(function () use ($request, $actor, $title): ChatThread {
            /** @var GroupContactRequest $lockedRequest */
            $lockedRequest = GroupContactRequest::query()
                ->whereKey($request->getKey())
                ->lockForUpdate()
                ->with(['group', 'citizen'])
                ->firstOrFail();

            if ($lockedRequest->status !== GroupContactRequestStatus::Open) {
                throw ValidationException::withMessages([
                    'request' => 'Questa richiesta è già stata gestita.',
                ]);
            }

            $thread = ChatThread::query()->create([
                'creator_id' => $actor->getKey(),
                'creator_type' => $actor::class,
                'title' => $title,
                'group_id' => $lockedRequest->group?->getKey(),
                'latest_message_date' => null,
                'last_activity_at' => now(),
            ]);

            ChatParticipant::query()->create([
                'chat_id' => $thread->getKey(),
                'participant_id' => $lockedRequest->citizen->getKey(),
                'participant_type' => $lockedRequest->citizen::class,
                'last_read_at' => now(),
            ]);

            ChatParticipant::query()->create([
                'chat_id' => $thread->getKey(),
                'participant_id' => $actor->getKey(),
                'participant_type' => $actor::class,
                'last_read_at' => now(),
            ]);

            $messageContent = $this->initialMessageContent($lockedRequest);

            if ($messageContent !== '') {
                $message = ChatMessage::query()->create([
                    'chat_id' => $thread->getKey(),
                    'author_id' => $lockedRequest->citizen->getKey(),
                    'author_type' => $lockedRequest->citizen::class,
                    'content' => $messageContent,
                ]);

                $thread->forceFill([
                    'latest_message_date' => $message->created_at,
                    'last_activity_at' => $message->created_at,
                ])->save();
            }

            $lockedRequest->forceFill([
                'status' => GroupContactRequestStatus::Accepted,
                'accepted_by_user_id' => $actor->getKey(),
                'accepted_at' => now(),
                'chat_thread_id' => $thread->getKey(),
            ])->save();

            return $thread;
        });
    }

    private function initialMessageContent(GroupContactRequest $request): string
    {
        $subject = trim((string) ($request->subject ?? ''));
        $message = trim((string) $request->message);

        if ($subject === '') {
            return $message;
        }

        return "Oggetto: {$subject}\n\n{$message}";
    }
}
