<?php

namespace App\Actions\Citizen;

use App\Exceptions\NotificationDeliveryException;
use App\Models\Citizen;
use App\Models\CitizenContactChangeRequest;
use App\Notifications\SendCitizenContactChangeLink;
use App\Services\NotificationDeliveryService;

class RequestCitizenContactChange
{
    public function __construct(
        private readonly NotificationDeliveryService $notifications
    ) {
    }

    public function handle(Citizen $citizen, array $data): CitizenContactChangeRequest
    {
        CitizenContactChangeRequest::query()
            ->where('citizen_id', $citizen->id)
            ->whereNull('completed_at')
            ->where('magic_link_expires_at', '>', now())
            ->update([
                'magic_link_expires_at' => now()->subSecond(),
            ]);

        $newEmail = mb_strtolower(trim($data['email']));
        $newPhoneNumber = $data['phoneNumber'];

        $request = CitizenContactChangeRequest::query()->create([
            'citizen_id' => $citizen->id,
            'new_email' => $newEmail,
            'new_phone_number' => $newPhoneNumber,
            'verification_email' => $newEmail !== $citizen->email ? $newEmail : $citizen->email,
            'verification_phone_number' => $newPhoneNumber !== $citizen->phone_number ? $newPhoneNumber : $citizen->phone_number,
            'magic_link_expires_at' => now()->addMinutes(config('auth.citizen.magic_link_expire')),
        ]);

        try {
            $this->notifications->send(
                $request,
                new SendCitizenContactChangeLink($request),
                'Non è stato possibile inviare l\'email di conferma. Riprova tra qualche minuto.'
            );
        } catch (NotificationDeliveryException $exception) {
            $request->delete();

            throw $exception;
        }

        return $request;
    }
}
