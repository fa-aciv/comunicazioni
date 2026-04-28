<?php

namespace Database\Factories;

use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\GroupRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GroupMembership>
 */
class GroupMembershipFactory extends Factory
{
    protected $model = GroupMembership::class;

    public function definition(): array
    {
        $role = GroupRole::query()->where('key', 'user')->first();

        if (! $role) {
            $role = GroupRole::factory()->create();
        }

        return [
            'group_id' => Group::factory(),
            'user_id' => User::factory(),
            'group_role_id' => $role->getKey(),
            'role' => $role->key,
        ];
    }
}
