<?php

namespace Database\Factories;

use App\Models\GroupRole;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<GroupRole>
 */
class GroupRoleFactory extends Factory
{
    protected $model = GroupRole::class;

    public function definition(): array
    {
        $name = fake()->unique()->jobTitle();

        return [
            'key' => Str::slug($name).'-'.fake()->unique()->numberBetween(100, 999),
            'name' => $name,
            'description' => fake()->sentence(),
        ];
    }
}
