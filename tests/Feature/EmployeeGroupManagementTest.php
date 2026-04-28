<?php

use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\GroupRole;
use App\Models\User;
use App\Services\EmployeeAuthorizationService;
use App\Services\GroupRoleService;
use Inertia\Testing\AssertableInertia as Assert;

function assignGroupMembership(Group $group, User $user, string $roleKey): GroupMembership
{
    $role = GroupRole::query()
        ->where('key', $roleKey)
        ->firstOrFail();

    return GroupMembership::query()
        ->create([
            'group_id' => $group->getKey(),
            'user_id' => $user->getKey(),
            'group_role_id' => $role->getKey(),
            'role' => $role->key,
        ])
        ->fresh('groupRole.permissions');
}

function makeGroupAdmin(User $user): User
{
    app(EmployeeAuthorizationService::class)->syncCatalog();
    $user->assignRole('admin');

    return $user->refresh();
}

test('group managers can add employees using the group default role', function () {
    $group = Group::factory()->create();
    $manager = User::factory()->withoutTwoFactor()->create();
    $employee = User::factory()->withoutTwoFactor()->create();
    $defaultRole = app(GroupRoleService::class)->create(
        'Operatore sportello',
        'Ruolo standard per i nuovi membri del gruppo.',
        ['group.contact_requests.accept']
    );

    $group->forceFill([
        'default_group_role_id' => $defaultRole->getKey(),
    ])->save();

    assignGroupMembership($group, $manager, 'manager');

    $this->from(route('employee.groups.manage'))
        ->actingAs($manager, 'employee')
        ->post(route('employee.groups.memberships.store', $group), [
            'user_id' => $employee->getKey(),
        ])
        ->assertRedirect(route('employee.groups.manage'))
        ->assertSessionHas('status', 'Membro aggiunto correttamente al gruppo.');

    $membership = GroupMembership::query()
        ->where('group_id', $group->getKey())
        ->where('user_id', $employee->getKey())
        ->with('groupRole.permissions')
        ->first();

    expect($membership)->not->toBeNull()
        ->and($membership?->groupRole?->key)->toBe($defaultRole->key)
        ->and($membership?->groupRole?->name)->toBe('Operatore sportello');
});

test('group users cannot add employees to a group', function () {
    $group = Group::factory()->create();
    $groupUser = User::factory()->withoutTwoFactor()->create();
    $employee = User::factory()->withoutTwoFactor()->create();

    assignGroupMembership($group, $groupUser, 'user');

    $this->from(route('employee.groups.manage'))
        ->actingAs($groupUser, 'employee')
        ->post(route('employee.groups.memberships.store', $group), [
            'user_id' => $employee->getKey(),
        ])
        ->assertRedirect(route('employee.groups.manage'))
        ->assertSessionHasErrors(['user_id']);

    expect(
        GroupMembership::query()
            ->where('group_id', $group->getKey())
            ->where('user_id', $employee->getKey())
            ->exists()
    )->toBeFalse();
});

test('group managers cannot change assigned roles', function () {
    $group = Group::factory()->create();
    $manager = User::factory()->withoutTwoFactor()->create();
    $employee = User::factory()->withoutTwoFactor()->create();
    $customRole = app(GroupRoleService::class)->create(
        'Operatore avanzato',
        'Può accettare richieste e rimuovere membri.',
        [
            'group.contact_requests.accept',
            'group.members.remove',
        ]
    );

    assignGroupMembership($group, $manager, 'manager');
    $membership = assignGroupMembership($group, $employee, 'user');

    $this->from(route('employee.groups.manage'))
        ->actingAs($manager, 'employee')
        ->patch(route('employee.groups.memberships.update', [$group, $membership]), [
            'group_role_id' => $customRole->getKey(),
        ])
        ->assertRedirect(route('employee.groups.manage'))
        ->assertSessionHasErrors(['group_role_id']);

    $membership->refresh()->load('groupRole.permissions');

    expect($membership->groupRole?->key)->toBe('user');
});

test('admins can change a member role from the admin groups panel', function () {
    $group = Group::factory()->create();
    $admin = makeGroupAdmin(User::factory()->withoutTwoFactor()->create());
    $employee = User::factory()->withoutTwoFactor()->create();
    $customRole = app(GroupRoleService::class)->create(
        'Operatore avanzato',
        'Può accettare richieste e rimuovere membri.',
        [
            'group.contact_requests.accept',
            'group.members.remove',
        ]
    );

    $membership = assignGroupMembership($group, $employee, 'user');
    $detailUrl = route('employee.groups.admin.show', $group);

    $this->from($detailUrl)
        ->actingAs($admin, 'employee')
        ->patch(route('employee.groups.memberships.update', [$group, $membership]), [
            'group_role_id' => $customRole->getKey(),
        ])
        ->assertRedirect($detailUrl)
        ->assertSessionHas('status', 'Membro aggiornato correttamente.');

    $membership->refresh()->load('groupRole.permissions');

    expect($membership->groupRole?->name)->toBe('Operatore avanzato')
        ->and($membership->groupRole?->permissions->pluck('key')->sort()->values()->all())
        ->toBe([
            'group.contact_requests.accept',
            'group.members.remove',
        ]);
});

test('the last group manager cannot be demoted or removed', function () {
    $group = Group::factory()->create();
    $admin = makeGroupAdmin(User::factory()->withoutTwoFactor()->create());
    $manager = User::factory()->withoutTwoFactor()->create();
    $userRole = GroupRole::query()->where('key', 'user')->firstOrFail();

    $membership = assignGroupMembership($group, $manager, 'manager');
    $detailUrl = route('employee.groups.admin.show', $group);

    $this->from($detailUrl)
        ->actingAs($admin, 'employee')
        ->patch(route('employee.groups.memberships.update', [$group, $membership]), [
            'group_role_id' => $userRole->getKey(),
        ])
        ->assertRedirect($detailUrl)
        ->assertSessionHasErrors(['group_role_id']);

    $this->from(route('employee.groups.manage'))
        ->actingAs($manager, 'employee')
        ->delete(route('employee.groups.memberships.destroy', [$group, $membership]))
        ->assertRedirect(route('employee.groups.manage'))
        ->assertSessionHasErrors(['membership']);

    $membership->refresh();

    expect($membership->role)->toBe('manager')
        ->and($membership->groupRole?->key)->toBe('manager');
});

test('manager panel includes inline membership management data and hides role editing', function () {
    $group = Group::factory()->create([
        'name' => 'Protocollo',
    ]);
    $manager = User::factory()->withoutTwoFactor()->create();
    $member = User::factory()->withoutTwoFactor()->create();
    $unassignedEmployee = User::factory()->withoutTwoFactor()->create();

    assignGroupMembership($group, $manager, 'manager');
    assignGroupMembership($group, $member, 'user');

    $this->actingAs($manager, 'employee')
        ->get(route('employee.groups.manage'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employee/groups/manage')
            ->has('availableRoles')
            ->has('groups', 1, fn (Assert $groupPage) => $groupPage
                ->where('name', 'Protocollo')
                ->where('abilities.canAddMembers', true)
                ->where('abilities.canRemoveMembers', true)
                ->where('abilities.canManageMemberRoles', false)
                ->where('defaultRole.key', 'user')
                ->has('memberships', 2)
                ->has('availableEmployees', 1)
                ->where('availableEmployees.0.id', $unassignedEmployee->getKey())
                ->where('membershipStoreUrl', route('employee.groups.memberships.store', $group))
                ->etc()
            )
        );
});
