<?php

use App\Enums\GroupMembershipRole;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\User;
use App\Services\GroupPermissionService;

function assignGroupMembership(Group $group, User $user, GroupMembershipRole $role, ?array $permissions = null): GroupMembership
{
    $membership = GroupMembership::query()->create([
        'group_id' => $group->getKey(),
        'user_id' => $user->getKey(),
        'role' => $role,
    ]);

    $permissionService = app(GroupPermissionService::class);

    if ($permissions === null) {
        $permissionService->applyRoleDefaults($membership);
    } else {
        $permissionService->syncMembershipPermissions($membership, $permissions);
    }

    return $membership->fresh('permissions');
}

test('group managers can add employees with default permissions', function () {
    $group = Group::factory()->create();
    $manager = User::factory()->withoutTwoFactor()->create();
    $employee = User::factory()->withoutTwoFactor()->create();

    assignGroupMembership($group, $manager, GroupMembershipRole::Manager);

    $this->actingAs($manager, 'employee')
        ->post(route('employee.groups.memberships.store', $group), [
            'user_id' => $employee->getKey(),
            'role' => GroupMembershipRole::User->value,
        ])
        ->assertRedirect(route('employee.groups.show', $group))
        ->assertSessionHas('status', 'Membro aggiunto correttamente al gruppo.');

    $membership = GroupMembership::query()
        ->where('group_id', $group->getKey())
        ->where('user_id', $employee->getKey())
        ->with('permissions')
        ->first();

    expect($membership)->not->toBeNull()
        ->and($membership?->role)->toBe(GroupMembershipRole::User)
        ->and($membership?->permissions->pluck('key')->all())->toBe(['group.contact_requests.accept']);
});

test('group users cannot add employees to a group', function () {
    $group = Group::factory()->create();
    $groupUser = User::factory()->withoutTwoFactor()->create();
    $employee = User::factory()->withoutTwoFactor()->create();

    assignGroupMembership($group, $groupUser, GroupMembershipRole::User);

    $this->from(route('employee.groups.show', $group))
        ->actingAs($groupUser, 'employee')
        ->post(route('employee.groups.memberships.store', $group), [
            'user_id' => $employee->getKey(),
            'role' => GroupMembershipRole::User->value,
        ])
        ->assertRedirect(route('employee.groups.show', $group))
        ->assertSessionHasErrors(['user_id']);

    expect(
        GroupMembership::query()
            ->where('group_id', $group->getKey())
            ->where('user_id', $employee->getKey())
            ->exists()
    )->toBeFalse();
});

test('group managers can customize a member permissions', function () {
    $group = Group::factory()->create();
    $manager = User::factory()->withoutTwoFactor()->create();
    $employee = User::factory()->withoutTwoFactor()->create();

    assignGroupMembership($group, $manager, GroupMembershipRole::Manager);
    $membership = assignGroupMembership($group, $employee, GroupMembershipRole::User);

    $this->actingAs($manager, 'employee')
        ->patch(route('employee.groups.memberships.update', [$group, $membership]), [
            'role' => GroupMembershipRole::User->value,
            'permissions' => [
                'group.contact_requests.accept',
                'group.members.remove',
            ],
        ])
        ->assertRedirect(route('employee.groups.show', $group))
        ->assertSessionHas('status', 'Membro aggiornato correttamente.');

    $membership->refresh()->load('permissions');

    expect($membership->permissions->pluck('key')->sort()->values()->all())
        ->toBe([
            'group.contact_requests.accept',
            'group.members.remove',
        ]);
});

test('the last group manager cannot be demoted or removed', function () {
    $group = Group::factory()->create();
    $manager = User::factory()->withoutTwoFactor()->create();

    $membership = assignGroupMembership($group, $manager, GroupMembershipRole::Manager);

    $this->from(route('employee.groups.show', $group))
        ->actingAs($manager, 'employee')
        ->patch(route('employee.groups.memberships.update', [$group, $membership]), [
            'role' => GroupMembershipRole::User->value,
            'permissions' => ['group.contact_requests.accept'],
        ])
        ->assertRedirect(route('employee.groups.show', $group))
        ->assertSessionHasErrors(['role']);

    $this->from(route('employee.groups.show', $group))
        ->actingAs($manager, 'employee')
        ->delete(route('employee.groups.memberships.destroy', [$group, $membership]))
        ->assertRedirect(route('employee.groups.show', $group))
        ->assertSessionHasErrors(['membership']);

    $membership->refresh();

    expect($membership->role)->toBe(GroupMembershipRole::Manager);
});
