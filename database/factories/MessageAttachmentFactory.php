<?php

namespace Database\Factories;

use App\Models\MessageAttachment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MessageAttachment>
 */
class MessageAttachmentFactory extends Factory
{
    protected $model = MessageAttachment::class;

    public function definition(): array
    {
        return [
            'message_id' => fake()->numberBetween(1, 1000),
            'chat_id' => fake()->numberBetween(1, 1000),
            'author_id' => fake()->numberBetween(1, 1000),
            'author_type' => \App\Models\User::class,
            'file_path' => 'chat-attachments/'.fake()->uuid().'.pdf',
            'file_name' => fake()->word().'.pdf',
        ];
    }
}
