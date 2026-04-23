<?php

use App\Models\Group;
use App\Models\User;
use App\Services\EmployeeAuthorizationService;

function makeEmployeeAdmin(User $user): User
{
    app(EmployeeAuthorizationService::class)->syncCatalog();
    $user->assignRole('admin');

    return $user->refresh();
}

test('admins can create groups and assign initial managers', function () {
    $admin = makeEmployeeAdmin(User::factory()->withoutTwoFactor()->create());
    $firstManager = User::factory()->withoutTwoFactor()->create();
    $secondManager = User::factory()->withoutTwoFactor()->create();

    $this->actingAs($admin, 'employee')
        ->post(route('employee.groups.store'), [
            'name' => 'Ufficio Relazioni',
            'description' => 'Gestione richieste e smistamento iniziale.',
            'manager_ids' => [$firstManager->getKey(), $secondManager->getKey()],
        ])
        ->assertRedirect(route('employee.groups.index'))
        ->assertSessionHas('status', 'Gruppo creato correttamente e manager assegnati.');

    $group = Group::query()->where('name', 'Ufficio Relazioni')->first();

    expect($group)->not->toBeNull()
        ->and($group?->description)->toBe('Gestione richieste e smistamento iniziale.');

    $memberships = $group?->memberships()->with('permissions')->get();

    expect($memberships?->count())->toBe(2)
        ->and($memberships?->every(fn ($membership) => $membership->role->value === 'manager'))->toBeTrue()
        ->and($memberships?->flatMap(fn ($membership) => $membership->permissions->pluck('key'))->unique()->values()->all())
        ->toBe([
            'group.members.add',
            'group.members.remove',
            'group.members.permissions.manage',
        ]);
});

test('non admin employees cannot create groups', function () {
    $employee = User::factory()->withoutTwoFactor()->create();
    $manager = User::factory()->withoutTwoFactor()->create();

    $this->actingAs($employee, 'employee')
        ->post(route('employee.groups.store'), [
            'name' => 'Gruppo non autorizzato',
            'manager_ids' => [$manager->getKey()],
        ])
        ->assertSessionHasErrors(['name']);

    expect(Group::query()->where('name', 'Gruppo non autorizzato')->exists())->toBeFalse();
});

test('admins can open group pages even when they are not members', function () {
    $admin = makeEmployeeAdmin(User::factory()->withoutTwoFactor()->create());
    $group = Group::factory()->create();

    $this->actingAs($admin, 'employee')
        ->get(route('employee.groups.show', $group))
        ->assertOk();
});
