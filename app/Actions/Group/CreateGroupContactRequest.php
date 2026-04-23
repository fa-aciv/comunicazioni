<?php

namespace App\Actions\Group;

use App\Enums\GroupContactRequestStatus;
use App\Models\Citizen;
use App\Models\Group;
use App\Models\GroupContactRequest;

class CreateGroupContactRequest
{
    public function handle(Citizen $citizen, Group $group, array $data): GroupContactRequest
    {
        return GroupContactRequest::query()->create([
            'group_id' => $group->getKey(),
            'citizen_id' => $citizen->getKey(),
            'subject' => filled($data['subject'] ?? null)
                ? trim((string) $data['subject'])
                : null,
            'message' => trim((string) $data['message']),
            'status' => GroupContactRequestStatus::Open,
        ]);
    }
}
