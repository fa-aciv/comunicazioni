<?php

namespace App\Actions\Citizen;

use App\Models\Citizen;
use App\Models\CitizenContactChangeRequest;
use App\Notifications\SendCitizenContactChangeLink;

class RequestCitizenContactChange
{
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

        $request->notify(new SendCitizenContactChangeLink($request));

        return $request;
    }
}
