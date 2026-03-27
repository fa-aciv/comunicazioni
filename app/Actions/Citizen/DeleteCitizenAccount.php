<?php

namespace App\Actions\Citizen;

use App\Models\ChatThread;
use App\Models\Citizen;
use Illuminate\Support\Facades\DB;

class DeleteCitizenAccount
{
    public function handle(Citizen $citizen): void
    {
        DB::transaction(function () use ($citizen): void {
            $threadIds = ChatThread::query()
                ->whereHas('participants', function ($query) use ($citizen): void {
                    $query
                        ->where('participant_type', Citizen::class)
                        ->where('participant_id', $citizen->getKey());
                })
                ->orWhere(function ($query) use ($citizen): void {
                    $query
                        ->where('creator_type', Citizen::class)
                        ->where('creator_id', $citizen->getKey());
                })
                ->pluck('id');

            if ($threadIds->isNotEmpty()) {
                ChatThread::query()
                    ->whereIn('id', $threadIds)
                    ->delete();
            }

            $citizen->delete();
        });
    }
}
