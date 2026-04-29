<?php

use App\Enums\GroupContactRequestStatus;
use App\Models\Citizen;
use App\Models\Group;
use App\Models\GroupContactRequest;
use App\Models\GroupMembership;
use App\Models\GroupRole;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function assignDashboardGroupMembership(Group $group, User $user, string $roleKey): GroupMembership
{
    $role = GroupRole::query()
        ->where('key', $roleKey)
        ->firstOrFail();

    return GroupMembership::query()->create([
        'group_id' => $group->getKey(),
        'user_id' => $user->getKey(),
        'group_role_id' => $role->getKey(),
        'role' => $role->key,
    ]);
}

test('employee dashboard shows the 5 most recent accessible open contact requests', function () {
    $employee = User::factory()->withoutTwoFactor()->create();
    $accessibleGroup = Group::factory()->create([
        'name' => 'Protocollo',
    ]);
    $inaccessibleGroup = Group::factory()->create([
        'name' => 'Tributi',
    ]);

    assignDashboardGroupMembership($accessibleGroup, $employee, 'user');

    $recentAccessibleRequests = collect(range(0, 5))->map(function (int $offset) use ($accessibleGroup) {
        $citizen = Citizen::factory()->create([
            'name' => "Cittadino {$offset}",
        ]);

        return GroupContactRequest::factory()->create([
            'group_id' => $accessibleGroup->getKey(),
            'citizen_id' => $citizen->getKey(),
            'subject' => "Richiesta {$offset}",
            'message' => "Messaggio richiesta {$offset}",
            'status' => GroupContactRequestStatus::Open,
            'created_at' => now()->subMinutes($offset),
            'updated_at' => now()->subMinutes($offset),
        ]);
    });

    GroupContactRequest::factory()->create([
        'group_id' => $accessibleGroup->getKey(),
        'citizen_id' => Citizen::factory()->create()->getKey(),
        'subject' => 'Richiesta già accettata',
        'message' => 'Questa richiesta non deve comparire.',
        'status' => GroupContactRequestStatus::Accepted,
        'created_at' => now()->addMinute(),
        'updated_at' => now()->addMinute(),
    ]);

    GroupContactRequest::factory()->create([
        'group_id' => $inaccessibleGroup->getKey(),
        'citizen_id' => Citizen::factory()->create()->getKey(),
        'subject' => 'Richiesta altro gruppo',
        'message' => 'Questa richiesta non deve comparire.',
        'status' => GroupContactRequestStatus::Open,
        'created_at' => now()->addMinutes(2),
        'updated_at' => now()->addMinutes(2),
    ]);

    $this->actingAs($employee, 'employee')
        ->get(route('employee.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('employee/dashboard')
            ->where('openGroupRequestCount', 6)
            ->has('recentGroupContactRequests', 5)
            ->where('recentGroupContactRequests.0.id', $recentAccessibleRequests[0]->getKey())
            ->where('recentGroupContactRequests.0.groupName', 'Protocollo')
            ->where('recentGroupContactRequests.0.citizenName', 'Cittadino 0')
            ->where('recentGroupContactRequests.1.id', $recentAccessibleRequests[1]->getKey())
            ->where('recentGroupContactRequests.2.id', $recentAccessibleRequests[2]->getKey())
            ->where('recentGroupContactRequests.3.id', $recentAccessibleRequests[3]->getKey())
            ->where('recentGroupContactRequests.4.id', $recentAccessibleRequests[4]->getKey())
        );
});
