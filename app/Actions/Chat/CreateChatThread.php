<?php

namespace App\Actions\Chat;

use App\Models\ChatThread;
use App\Models\Citizen;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreateChatThread
{
    public function handle(User $employee, array $validated): ChatThread
    {
        $citizen = $this->resolveCitizen($validated);

        if (! $citizen) {
            throw ValidationException::withMessages([
                'citizen_identifier' => 'Nessun cittadino corrisponde ai dati inseriti.',
            ]);
        }

        $employeeIds = collect($validated['employee_ids'] ?? [])
            ->map(fn (mixed $id) => (int) $id)
            ->filter()
            ->prepend((int) $employee->getKey())
            ->unique()
            ->values();

        $employees = User::query()
            ->whereIn('id', $employeeIds)
            ->get(['id']);

        if ($employees->count() !== $employeeIds->count()) {
            throw ValidationException::withMessages([
                'employee_ids' => 'Uno o più partecipanti dipendenti non esistono.',
            ]);
        }

        return DB::transaction(function () use ($employee, $citizen, $employees, $validated) {
            $thread = ChatThread::query()->create([
                'creator_id' => $employee->getKey(),
                'creator_type' => $employee::class,
                'title' => trim((string) ($validated['title'] ?? '')) ?: 'Chat con '.$citizen->name,
                'latest_message_date' => null,
                'last_activity_at' => now(),
            ]);

            $thread->participants()->create([
                'participant_id' => $citizen->getKey(),
                'participant_type' => $citizen::class,
                'last_read_at' => now(),
            ]);

            $employees->each(function (User $participant) use ($thread): void {
                $thread->participants()->create([
                    'participant_id' => $participant->getKey(),
                    'participant_type' => $participant::class,
                    'last_read_at' => now(),
                ]);
            });

            return $thread->load('participants');
        });
    }

    private function resolveCitizen(array $validated): ?Citizen
    {
        $query = Citizen::query();
        $conditions = new Collection();

        if (filled($validated['citizen_identifier'] ?? null)) {
            $identifier = trim((string) $validated['citizen_identifier']);

            $conditions->push(fn ($q) => $q->orWhere('email', mb_strtolower($identifier)));
            $conditions->push(fn ($q) => $q->orWhere('fiscal_code', strtoupper($identifier)));
            $conditions->push(fn ($q) => $q->orWhere('phone_number', $this->normalizePhone($identifier)));
        }

        if (filled($validated['citizen_email'] ?? null)) {
            $email = mb_strtolower(trim((string) $validated['citizen_email']));
            $conditions->push(fn ($q) => $q->orWhere('email', $email));
        }

        if (filled($validated['citizen_fiscal_code'] ?? null)) {
            $fiscalCode = strtoupper(trim((string) $validated['citizen_fiscal_code']));
            $conditions->push(fn ($q) => $q->orWhere('fiscal_code', $fiscalCode));
        }

        if (filled($validated['citizen_phone_number'] ?? null)) {
            $phoneNumber = $this->normalizePhone((string) $validated['citizen_phone_number']);
            $conditions->push(fn ($q) => $q->orWhere('phone_number', $phoneNumber));
        }

        if ($conditions->isEmpty()) {
            return null;
        }

        return $query
            ->where(function ($builder) use ($conditions): void {
                $conditions->each(fn ($condition) => $condition($builder));
            })
            ->first();
    }

    private function normalizePhone(string $value): string
    {
        $value = preg_replace('/[^\d+]/', '', trim($value)) ?? '';

        return str_starts_with($value, '+') ? $value : ltrim($value, '+');
    }
}
