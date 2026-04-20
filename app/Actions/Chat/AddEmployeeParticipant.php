<?php

namespace App\Actions\Chat;

use App\Models\ChatParticipant;
use App\Models\ChatThread;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AddEmployeeParticipant
{
    public function handle(int|string $chatId, User $actor, int $participantId): ChatThread
    {
        $chat = ChatThread::query()->findOrFail($chatId);

        $actorIsParticipant = $chat->participants()
            ->where('participant_type', $actor::class)
            ->where('participant_id', $actor->getKey())
            ->exists();

        if (!$actorIsParticipant) {
            throw ValidationException::withMessages([
                'employee_id' => 'Non puoi modificare i partecipanti di questa chat.',
            ]);
        }

        $participant = User::query()->find($participantId);

        if (! $participant) {
            throw ValidationException::withMessages([
                'employee_id' => 'Il dipendente selezionato non esiste.',
            ]);
        }

        $alreadyParticipant = $chat->participants()
            ->where('participant_type', User::class)
            ->where('participant_id', $participant->getKey())
            ->exists();

        if ($alreadyParticipant) {
            throw ValidationException::withMessages([
                'employee_id' => 'Il dipendente è già partecipante alla chat.',
            ]);
        }

        DB::transaction(function () use ($chat, $participant): void {
            $chat->participants()->create([
                'participant_id' => $participant->getKey(),
                'participant_type' => User::class,
            ]);

            $chat->forceFill([
                'last_activity_at' => now(),
            ])->save();
        });

        return $chat->fresh('participants.participant');
    }
}
