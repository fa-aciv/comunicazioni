<?php

namespace App\Actions\Citizen;

use App\Models\Citizen;
use App\Models\CitizenAccountDeletionRequest;
use App\Notifications\SendCitizenAccountDeletionLink;

class RequestCitizenAccountDeletion
{
    public function handle(Citizen $citizen): CitizenAccountDeletionRequest
    {
        CitizenAccountDeletionRequest::query()
            ->where('citizen_id', $citizen->id)
            ->whereNull('completed_at')
            ->where('magic_link_expires_at', '>', now())
            ->update([
                'magic_link_expires_at' => now()->subSecond(),
            ]);

        $request = CitizenAccountDeletionRequest::query()->create([
            'citizen_id' => $citizen->id,
            'verification_email' => $citizen->email,
            'verification_phone_number' => $citizen->phone_number,
            'magic_link_expires_at' => now()->addMinutes(config('auth.citizen.magic_link_expire')),
        ]);

        $request->notify(new SendCitizenAccountDeletionLink($request));

        return $request;
    }
}
