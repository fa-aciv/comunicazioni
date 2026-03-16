<?php

namespace Database\Factories;

use App\Models\Citizen;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Citizen>
 */
class CitizenFactory extends Factory
{
    protected $model = Citizen::class;

    public function definition(): array
    {
        return [
            'uuid' => (string) Str::uuid(),
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'phone_number' => '+393331112233',
            'fiscal_code' => strtoupper(fake()->bothify('??????##?##?###?')),
            'last_login_at' => null,
            'remember_token' => Str::random(10),
        ];
    }
}
