<?php

use App\Enums\GroupContactRequestStatus;
use App\Enums\GroupMembershipRole;
use App\Models\ChatMessage;
use App\Models\ChatParticipant;
use App\Models\ChatThread;
use App\Models\Citizen;
use App\Models\Group;
use App\Models\GroupContactRequest;
use App\Models\GroupMembership;
use App\Models\User;
use App\Services\GroupPermissionService;
use Inertia\Testing\AssertableInertia as Assert;

function assignRequestGroupMembership(Group $group, User $user, GroupMembershipRole $role, ?array $permissions = null): GroupMembership
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

test('citizens can create a contact request for an active group', function () {
    $citizen = Citizen::factory()->create();
    $group = Group::factory()->create([
        'is_active' => true,
    ]);

    $this->actingAs($citizen, 'citizen')
        ->post(route('citizen.contact-requests.store'), [
            'group_id' => $group->getKey(),
            'subject' => 'Supporto documenti',
            'message' => 'Ho bisogno di assistenza per caricare un allegato.',
        ])
        ->assertRedirect(route('citizen.contact-requests.index'))
        ->assertSessionHas('status', 'Richiesta di contatto inviata correttamente.');

    $request = GroupContactRequest::query()->first();

    expect($request)->not->toBeNull()
        ->and($request?->group_id)->toBe($group->getKey())
        ->and($request?->citizen_id)->toBe($citizen->getKey())
        ->and($request?->status)->toBe(GroupContactRequestStatus::Open);
});

test('citizens only see pending contact requests in the request list', function () {
    $citizen = Citizen::factory()->create();
    $group = Group::factory()->create();

    $openRequest = GroupContactRequest::factory()->create([
        'citizen_id' => $citizen->getKey(),
        'group_id' => $group->getKey(),
        'status' => GroupContactRequestStatus::Open,
    ]);

    GroupContactRequest::factory()->create([
        'citizen_id' => $citizen->getKey(),
        'group_id' => $group->getKey(),
        'status' => GroupContactRequestStatus::Accepted,
    ]);

    $this->actingAs($citizen, 'citizen')
        ->get(route('citizen.contact-requests.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('citizen/contact-requests/index')
            ->has('contactRequests', 1)
            ->where('contactRequests.0.id', $openRequest->getKey())
            ->where('contactRequests.0.status', GroupContactRequestStatus::Open->value)
        );
});

test('group users can accept contact requests and a chat is created for the citizen', function () {
    $citizen = Citizen::factory()->create([
        'name' => 'Mario Rossi',
    ]);
    $employee = User::factory()->withoutTwoFactor()->create([
        'name' => 'Operatore Gruppo',
    ]);
    $group = Group::factory()->create([
        'name' => 'Ufficio Relazioni',
    ]);

    assignRequestGroupMembership($group, $employee, GroupMembershipRole::User);

    $contactRequest = GroupContactRequest::factory()->create([
        'group_id' => $group->getKey(),
        'citizen_id' => $citizen->getKey(),
        'subject' => 'Documento mancante',
        'message' => 'Vorrei sapere come inviare il documento corretto.',
        'status' => GroupContactRequestStatus::Open,
    ]);

    $this->actingAs($employee, 'employee')
        ->post(route('employee.group-contact-requests.accept', $contactRequest), [
            'title' => 'Documento mancante da Mario Rossi',
        ])
        ->assertRedirect();

    $contactRequest->refresh();

    expect($contactRequest->status)->toBe(GroupContactRequestStatus::Accepted)
        ->and($contactRequest->accepted_by_user_id)->toBe($employee->getKey())
        ->and($contactRequest->accepted_at)->not->toBeNull()
        ->and($contactRequest->chat_thread_id)->not->toBeNull();

    $thread = ChatThread::query()->find($contactRequest->chat_thread_id);

    expect($thread)->not->toBeNull()
        ->and($thread?->creator_id)->toBe($employee->getKey())
        ->and($thread?->creator_type)->toBe(User::class)
        ->and($thread?->title)->toBe('Documento mancante da Mario Rossi');

    expect(
        ChatParticipant::query()
            ->where('chat_id', $thread?->getKey())
            ->count()
    )->toBe(2);

    $message = ChatMessage::query()
        ->where('chat_id', $thread?->getKey())
        ->first();

    expect($message)->not->toBeNull()
        ->and($message?->author_id)->toBe($citizen->getKey())
        ->and($message?->author_type)->toBe(Citizen::class)
        ->and($message?->content)->toContain('Oggetto: Documento mancante')
        ->and($message?->content)->toContain('Vorrei sapere come inviare il documento corretto.');

    $this->actingAs($citizen, 'citizen')
        ->get(route('citizen.chats.index', ['chat' => $thread?->getKey()]))
        ->assertOk();
});

test('a contact request cannot be accepted twice', function () {
    $citizen = Citizen::factory()->create();
    $firstEmployee = User::factory()->withoutTwoFactor()->create();
    $secondEmployee = User::factory()->withoutTwoFactor()->create();
    $group = Group::factory()->create();

    assignRequestGroupMembership($group, $firstEmployee, GroupMembershipRole::User);
    assignRequestGroupMembership($group, $secondEmployee, GroupMembershipRole::User);

    $contactRequest = GroupContactRequest::factory()->create([
        'group_id' => $group->getKey(),
        'citizen_id' => $citizen->getKey(),
        'status' => GroupContactRequestStatus::Open,
    ]);

    $this->actingAs($firstEmployee, 'employee')
        ->post(route('employee.group-contact-requests.accept', $contactRequest), [
            'title' => 'Prima presa in carico',
        ])
        ->assertRedirect();

    $this->from(route('employee.group-contact-requests.index'))
        ->actingAs($secondEmployee, 'employee')
        ->post(route('employee.group-contact-requests.accept', $contactRequest), [
            'title' => 'Seconda presa in carico',
        ])
        ->assertRedirect(route('employee.group-contact-requests.index'))
        ->assertSessionHasErrors(['request']);

    $contactRequest->refresh();

    expect($contactRequest->accepted_by_user_id)->toBe($firstEmployee->getKey())
        ->and(ChatThread::query()->count())->toBe(1);
});

test('accepting a contact request requires a chat title', function () {
    $citizen = Citizen::factory()->create();
    $employee = User::factory()->withoutTwoFactor()->create();
    $group = Group::factory()->create();

    assignRequestGroupMembership($group, $employee, GroupMembershipRole::User);

    $contactRequest = GroupContactRequest::factory()->create([
        'group_id' => $group->getKey(),
        'citizen_id' => $citizen->getKey(),
        'status' => GroupContactRequestStatus::Open,
    ]);

    $this->from(route('employee.group-contact-requests.index'))
        ->actingAs($employee, 'employee')
        ->post(route('employee.group-contact-requests.accept', $contactRequest), [
            'title' => '',
        ])
        ->assertRedirect(route('employee.group-contact-requests.index'))
        ->assertSessionHasErrors(['title']);

    expect($contactRequest->fresh()->status)->toBe(GroupContactRequestStatus::Open)
        ->and(ChatThread::query()->count())->toBe(0);
});
