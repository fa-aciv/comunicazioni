<?php

namespace Database\Factories;

use App\Models\ChatMessage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ChatMessage>
 */
class ChatMessageFactory extends Factory
{
    protected $model = ChatMessage::class;

    public function definition(): array
    {
        return [
            'chat_id' => fake()->numberBetween(1, 1000),
            'author_id' => fake()->numberBetween(1, 1000),
            'author_type' => \App\Models\User::class,
            'content' => fake()->paragraph(),
        ];
    }
}
