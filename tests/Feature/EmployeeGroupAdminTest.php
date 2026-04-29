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
        ->assertRedirect(route('employee.groups.admin'))
        ->assertSessionHas('status', 'Gruppo creato correttamente e manager assegnati.');

    $group = Group::query()->where('name', 'Ufficio Relazioni')->with('defaultRole')->first();

    expect($group)->not->toBeNull()
        ->and($group?->description)->toBe('Gestione richieste e smistamento iniziale.');

    $memberships = $group?->memberships()->with('groupRole.permissions')->get();

    expect($memberships?->count())->toBe(2)
        ->and($memberships?->every(fn ($membership) => $membership->groupRole?->key === 'manager'))->toBeTrue()
        ->and($memberships?->flatMap(fn ($membership) => $membership->groupRole?->permissions->pluck('key') ?? collect())->unique()->values()->all())
        ->toBe([
            'group.members.add',
            'group.members.remove',
        ])
        ->and($group?->defaultRole?->key)->toBe('user');
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
    $group = Group::factory()->create([
        'name' => 'Protocollo',
    ]);

    $this->actingAs($admin, 'employee')
        ->get(route('employee.groups.admin'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employee/groups/admin')
            ->has('permissionCatalog')
            ->has('groupRoles')
            ->has('availableRoles')
            ->where('managerSearchUrl', route('employee.groups.admin.manager-options'))
            ->has('groups', 1, fn (Assert $groupPage) => $groupPage
                ->where('name', 'Protocollo')
                ->where('detailUrl', route('employee.groups.admin.show', $group))
                ->etc()
            )
        );
});

test('admins can search available employees when selecting initial group managers', function () {
    $admin = makeEmployeeAdmin(User::factory()->withoutTwoFactor()->create());
    $matchingEmployee = User::factory()->withoutTwoFactor()->create([
        'name' => 'Mario Rossi',
        'email' => 'mario.rossi@example.com',
        'employee_id' => 'EMP-001',
        'department_name' => 'Protocollo',
    ]);
    User::factory()->withoutTwoFactor()->create([
        'name' => 'Giulia Bianchi',
        'email' => 'giulia@example.com',
        'employee_id' => 'EMP-002',
        'department_name' => 'Anagrafe',
    ]);

    $this->actingAs($admin, 'employee')
        ->getJson(route('employee.groups.admin.manager-options', ['query' => 'mario']))
        ->assertOk()
        ->assertJson([
            'employees' => [[
                'id' => $matchingEmployee->getKey(),
                'name' => 'Mario Rossi',
                'email' => 'mario.rossi@example.com',
                'employeeId' => 'EMP-001',
                'departmentName' => 'Protocollo',
            ]],
        ]);
});

test('admins can open the detail administration page for a group', function () {
    $admin = makeEmployeeAdmin(User::factory()->withoutTwoFactor()->create());
    $group = Group::factory()->create([
        'name' => 'Sportello edilizia',
    ]);

    $this->actingAs($admin, 'employee')
        ->get(route('employee.groups.admin.show', $group))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employee/groups/admin-show')
            ->where('group.name', 'Sportello edilizia')
            ->where('adminIndexUrl', route('employee.groups.admin'))
            ->has('memberships')
            ->where('availableEmployeeCount', 1)
            ->where('employeeSearchUrl', route('employee.groups.memberships.options', $group))
            ->has('availableRoles')
        );
});

test('admins can search available employees from the group administration detail page', function () {
    $admin = makeEmployeeAdmin(User::factory()->withoutTwoFactor()->create());
    $group = Group::factory()->create();
    $availableEmployee = User::factory()->withoutTwoFactor()->create([
        'name' => 'Lucia Verdi',
        'email' => 'lucia.verdi@example.com',
        'employee_id' => 'EMP-101',
        'department_name' => 'Edilizia privata',
    ]);
    $alreadyAssignedEmployee = User::factory()->withoutTwoFactor()->create([
        'name' => 'Marco Neri',
        'email' => 'marco.neri@example.com',
    ]);

    $group->memberships()->create([
        'user_id' => $alreadyAssignedEmployee->getKey(),
        'group_role_id' => GroupRole::query()->where('key', 'user')->firstOrFail()->getKey(),
        'role' => 'user',
    ]);

    $this->actingAs($admin, 'employee')
        ->getJson(route('employee.groups.memberships.options', ['group' => $group, 'query' => 'lucia']))
        ->assertOk()
        ->assertJsonFragment([
            'id' => $availableEmployee->getKey(),
            'name' => 'Lucia Verdi',
            'email' => 'lucia.verdi@example.com',
            'employeeId' => 'EMP-101',
            'departmentName' => 'Edilizia privata',
        ])
        ->assertJsonMissing([
            'name' => 'Marco Neri',
        ]);
});

test('admins can manage members and configure the default role from the admin groups panel', function () {
    $admin = makeEmployeeAdmin(User::factory()->withoutTwoFactor()->create());
    $group = Group::factory()->create();
    $employee = User::factory()->withoutTwoFactor()->create();
    $customRole = app(\App\Services\GroupRoleService::class)->create(
        'Operatore protocollo',
        'Ruolo standard per il gruppo.',
        ['group.contact_requests.accept']
    );

    $detailUrl = route('employee.groups.admin.show', $group);

    $this->from($detailUrl)
        ->actingAs($admin, 'employee')
        ->patch(route('employee.groups.retention.update', $group), [
            'chatMessageRetentionDays' => 15,
            'chatInactiveThreadRetentionDays' => 60,
            'defaultGroupRoleId' => $customRole->getKey(),
        ])
        ->assertRedirect($detailUrl)
        ->assertSessionHas('status', 'Impostazioni del gruppo aggiornate correttamente.');

    $group->refresh();

    expect($group->defaultRole?->key)->toBe($customRole->key);

    $this->from($detailUrl)
        ->actingAs($admin, 'employee')
        ->post(route('employee.groups.memberships.store', $group), [
            'user_id' => $employee->getKey(),
            'group_role_id' => $customRole->getKey(),
        ])
        ->assertRedirect($detailUrl)
        ->assertSessionHas('status', 'Membro aggiunto correttamente al gruppo.');

    $membership = $group->memberships()->with('groupRole')->where('user_id', $employee->getKey())->first();

    expect($membership)->not->toBeNull()
        ->and($membership?->groupRole?->key)->toBe($customRole->key);
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
