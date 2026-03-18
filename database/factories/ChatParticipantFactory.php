<?php

namespace Database\Factories;

use App\Models\ChatParticipant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ChatParticipant>
 */
class ChatParticipantFactory extends Factory
{
    protected $model = ChatParticipant::class;

    public function definition(): array
    {
        return [
            'chat_id' => fake()->numberBetween(1, 1000),
            'participant_id' => fake()->numberBetween(1, 1000),
            'participant_type' => \App\Models\User::class,
        ];
    }
}
