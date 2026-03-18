<?php

namespace Database\Factories;

use App\Models\ChatThread;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ChatThread>
 */
class ChatThreadFactory extends Factory
{
    protected $model = ChatThread::class;

    public function definition(): array
    {
        return [
            'creator_id' => fake()->numberBetween(1, 1000),
            'creator_type' => \App\Models\User::class,
            'title' => fake()->sentence(3),
            'latest_message_date' => fake()->optional()->dateTimeBetween('-1 week'),
        ];
    }
}
