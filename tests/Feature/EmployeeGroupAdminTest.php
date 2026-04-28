<?php

use App\Models\Group;
use App\Models\GroupRole;
use App\Models\User;
use App\Services\EmployeeAuthorizationService;
use Inertia\Testing\AssertableInertia as Assert;

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

    $memberships = $group?->memberships()->with('groupRole.permissions')->get();

    expect($memberships?->count())->toBe(2)
        ->and($memberships?->every(fn ($membership) => $membership->groupRole?->key === 'manager'))->toBeTrue()
        ->and($memberships?->flatMap(fn ($membership) => $membership->groupRole?->permissions->pluck('key') ?? collect())->unique()->values()->all())
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

test('admins can manage group roles through the groups ui', function () {
    $admin = makeEmployeeAdmin(User::factory()->withoutTwoFactor()->create());

    $this->actingAs($admin, 'employee')
        ->get(route('employee.groups.admin'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employee/groups/admin')
            ->has('permissionCatalog')
            ->has('groupRoles')
        );
});

test('admins can create, update and delete unassigned group roles', function () {
    $admin = makeEmployeeAdmin(User::factory()->withoutTwoFactor()->create());

    $this->actingAs($admin, 'employee')
        ->post(route('employee.group-roles.store'), [
            'name' => 'Operatore sportello',
            'description' => 'Gestisce le richieste in ingresso.',
            'permission_keys' => ['group.contact_requests.accept'],
        ])
        ->assertRedirect()
        ->assertSessionHas('status', 'Ruolo creato correttamente.');

    $role = GroupRole::query()->where('name', 'Operatore sportello')->first();

    expect($role)->not->toBeNull()
        ->and($role?->permissions()->pluck('key')->all())->toBe(['group.contact_requests.accept']);

    $this->actingAs($admin, 'employee')
        ->patch(route('employee.group-roles.update', $role), [
            'name' => 'Operatore senior',
            'description' => 'Gestisce richieste e membri.',
            'permission_keys' => [
                'group.contact_requests.accept',
                'group.members.remove',
            ],
        ])
        ->assertRedirect()
        ->assertSessionHas('status', 'Ruolo aggiornato correttamente.');

    $role?->refresh()->load('permissions');

    expect($role?->name)->toBe('Operatore senior')
        ->and($role?->permissions->pluck('key')->sort()->values()->all())->toBe([
            'group.contact_requests.accept',
            'group.members.remove',
        ]);

    $this->actingAs($admin, 'employee')
        ->delete(route('employee.group-roles.destroy', $role))
        ->assertRedirect()
        ->assertSessionHas('status', 'Ruolo eliminato correttamente.');

    expect(GroupRole::query()->whereKey($role?->getKey())->exists())->toBeFalse();
});

test('non admin employees cannot manage group roles', function () {
    $employee = User::factory()->withoutTwoFactor()->create();

    $this->actingAs($employee, 'employee')
        ->post(route('employee.group-roles.store'), [
            'name' => 'Ruolo non autorizzato',
            'permission_keys' => ['group.contact_requests.accept'],
        ])
        ->assertForbidden();
});
