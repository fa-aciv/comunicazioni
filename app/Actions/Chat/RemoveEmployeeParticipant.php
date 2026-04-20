<?php

namespace App\Actions\Chat;

use App\Models\ChatThread;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RemoveEmployeeParticipant
{
    public function handle(int|string $chatId, User $actor, int $participantId): ChatThread
    {
        $chat = ChatThread::query()->findOrFail($chatId);

        $actorIsParticipant = $chat->participants()
            ->where('participant_type', $actor::class)
            ->where('participant_id', $actor->getKey())
            ->exists();

        if (! $actorIsParticipant) {
            throw ValidationException::withMessages([
                'employee_id' => 'Non puoi modificare i partecipanti di questa chat.',
            ]);
        }

        if ((int) $actor->getKey() === $participantId) {
            throw ValidationException::withMessages([
                'employee_id' => 'Non puoi rimuovere te stesso dalla chat.',
            ]);
        }

        $participant = User::query()->find($participantId);

        if (! $participant) {
            throw ValidationException::withMessages([
                'employee_id' => 'Il dipendente selezionato non esiste.',
            ]);
        }

        $chatParticipant = $chat->participants()
            ->where('participant_type', User::class)
            ->where('participant_id', $participant->getKey())
            ->first();

        if (! $chatParticipant) {
            throw ValidationException::withMessages([
                'employee_id' => 'Il dipendente selezionato non partecipa a questa chat.',
            ]);
        }

        DB::transaction(function () use ($chatParticipant, $chat): void {
            $chatParticipant->delete();

            $chat->forceFill([
                'last_activity_at' => now(),
            ])->save();
        });

        return $chat->fresh('participants.participant');
    }
}
