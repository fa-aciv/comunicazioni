<?php

namespace Database\Factories;

use App\Enums\GroupContactRequestStatus;
use App\Models\Citizen;
use App\Models\Group;
use App\Models\GroupContactRequest;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GroupContactRequest>
 */
class GroupContactRequestFactory extends Factory
{
    protected $model = GroupContactRequest::class;

    public function definition(): array
    {
        return [
            'group_id' => Group::factory(),
            'citizen_id' => Citizen::factory(),
            'subject' => fake()->sentence(4),
            'message' => fake()->paragraph(),
            'status' => GroupContactRequestStatus::Open,
            'accepted_by_user_id' => null,
            'accepted_at' => null,
            'chat_thread_id' => null,
        ];
    }
}
