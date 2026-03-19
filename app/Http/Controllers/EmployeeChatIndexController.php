<?php

namespace App\Http\Controllers;

use App\Models\ChatThread;
use App\Models\Citizen;
use App\Models\MessageAttachment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeChatIndexController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $threads = $this->employeeThreadsQuery($employee)
            ->with([
                'participants.participant',
                'latestMessage.author',
                'latestMessage.attachments',
            ])
            ->withCount('messages')
            ->orderByDesc('latest_message_date')
            ->orderByDesc('updated_at')
            ->get();

        $requestedChatId = $request->integer('chat') ?: null;
        $selectedChatId = $requestedChatId ?: $threads->first()?->getKey();
        $selectedChat = null;

        if ($selectedChatId !== null) {
            $selectedChat = $this->employeeThreadsQuery($employee)
                ->with([
                    'participants.participant',
                    'messages' => fn ($query) => $query
                        ->with(['author', 'attachments'])
                        ->orderBy('created_at'),
                ])
                ->find($selectedChatId);

            abort_if($requestedChatId !== null && $selectedChat === null, 404);
        }

        $employees = User::query()
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'department_name']);

        return Inertia::render('employee/chats/index', [
            'status' => $request->session()->get('status'),
            'currentEmployeeId' => $employee->id,
            'pollIntervalSeconds' => 10,
            'selectedChatId' => $selectedChat?->getKey(),
            'employees' => $employees->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'department_name' => $user->department_name,
            ])->values(),
            'chatSummaries' => $threads->map(fn (ChatThread $thread) => $this->mapChatSummary($thread))->values(),
            'selectedChat' => $selectedChat ? $this->mapSelectedChat($selectedChat) : null,
        ]);
    }

    private function employeeThreadsQuery(User $employee): Builder
    {
        return ChatThread::query()
            ->whereHas('participants', function ($query) use ($employee): void {
                $query
                    ->where('participant_type', User::class)
                    ->where('participant_id', $employee->getKey());
            });
    }

    /**
     * @return array<string, mixed>
     */
    private function mapChatSummary(ChatThread $thread): array
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
            'message_count' => $thread->messages_count,
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
    private function mapSelectedChat(ChatThread $thread): array
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
                    ->map(fn (MessageAttachment $attachment) => $this->mapAttachment($attachment))
                    ->values(),
            ])->values(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapAttachment(MessageAttachment $attachment): array
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
            'preview_url' => route('employee.attachments.show', $attachment),
            'download_url' => route('employee.attachments.download', $attachment),
        ];
    }
}
