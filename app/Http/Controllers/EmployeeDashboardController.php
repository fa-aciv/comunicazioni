<?php

namespace App\Http\Controllers;

use App\Models\ChatThread;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $employee */
        $employee = Auth::guard('employee')->user();

        $threads = ChatThread::query()
            ->whereHas('participants', function ($query) use ($employee): void {
                $query
                    ->where('participant_type', User::class)
                    ->where('participant_id', $employee->getKey());
            })
            ->with([
                'participants.participant',
                'messages' => fn ($query) => $query
                    ->with(['author', 'attachments'])
                    ->orderBy('created_at'),
            ])
            ->orderByDesc('latest_message_date')
            ->orderByDesc('updated_at')
            ->get();

        $employees = User::query()
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'department_name']);

        return Inertia::render('employee/dashboard', [
            'status' => $request->session()->get('status'),
            'selectedChatId' => $request->integer('chat') ?: null,
            'employees' => $employees->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'department_name' => $user->department_name,
            ])->values(),
            'chats' => $threads->map(function (ChatThread $thread) {
                $participants = $thread->participants;

                $citizenParticipant = $participants->first(fn ($participant) => $participant->participant instanceof \App\Models\Citizen);
                $employeeParticipants = $participants
                    ->filter(fn ($participant) => $participant->participant instanceof User)
                    ->values();

                return [
                    'id' => $thread->id,
                    'title' => $thread->title,
                    'latest_message_date' => optional($thread->latest_message_date)?->toIso8601String(),
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
                        'created_at' => optional($message->created_at)?->toIso8601String(),
                        'author' => [
                            'type' => class_basename($message->author_type),
                            'name' => $message->author?->name,
                            'email' => $message->author?->email,
                        ],
                        'attachments' => $message->attachments->map(fn ($attachment) => [
                            'id' => $attachment->id,
                            'file_name' => $attachment->file_name,
                            'download_url' => route('employee.attachments.show', $attachment),
                        ])->values(),
                    ])->values(),
                ];
            })->values(),
        ]);
    }
}
