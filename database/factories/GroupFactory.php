<?php

namespace Database\Factories;

use App\Models\Group;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Group>
 */
class GroupFactory extends Factory
{
    protected $model = Group::class;

    public function definition(): array
    {
        return [
            'name' => fake()->unique()->company().' Team',
            'description' => fake()->sentence(),
            'is_active' => true,
            'chat_message_retention_days' => 15,
            'chat_inactive_thread_retention_days' => 60,
        ];
    }
}
