<?php

namespace Database\Seeders;

use App\Models\User;
use App\Services\EmployeeAuthorizationService;
use App\Services\GroupPermissionService;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        app(EmployeeAuthorizationService::class)->syncCatalog();
        app(GroupPermissionService::class)->syncCatalog();

        // User::factory(10)->create();

        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => 'password',
                'email_verified_at' => now(),
            ]
        );

        $user->assignRole('admin');
    }
}
