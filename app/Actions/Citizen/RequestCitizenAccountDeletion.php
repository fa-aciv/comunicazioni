<?php

namespace App\Actions\Citizen;

use App\Exceptions\NotificationDeliveryException;
use App\Models\Citizen;
use App\Models\CitizenAccountDeletionRequest;
use App\Notifications\SendCitizenAccountDeletionLink;
use App\Services\NotificationDeliveryService;

class RequestCitizenAccountDeletion
{
    public function __construct(
        private readonly NotificationDeliveryService $notifications
    ) {
    }

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

        try {
            $this->notifications->send(
                $request,
                new SendCitizenAccountDeletionLink($request),
                'Non è stato possibile inviare l\'email di conferma. Riprova tra qualche minuto.'
            );
        } catch (NotificationDeliveryException $exception) {
            $request->delete();

            throw $exception;
        }

        return $request;
    }
}
