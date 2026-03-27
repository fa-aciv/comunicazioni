<?php

namespace App\Actions\Citizen;

use App\Models\Citizen;

class UpdateCitizenAccount
{
    public function handle(Citizen $citizen, array $data): void
    {
        $citizen->update([
            'email' => mb_strtolower(trim($data['email'])),
            'phone_number' => $data['phoneNumber'],
        ]);
    }
}
