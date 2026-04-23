<?php

namespace App\Http\Controllers;

use App\Actions\Group\CreateGroup;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\GroupPermission;
use App\Models\User;
use App\Services\EmployeeAuthorizationService;
use App\Services\GroupPermissionService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeGroupController extends Controller
{
    public function index(
        Request $request,
        GroupPermissionService $permissions,
        EmployeeAuthorizationService $employeeAuthorization
    ): Response
    {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $employeeAuthorization->syncCatalog();
        $permissions->syncCatalog();
        $canCreateGroups = $employee->can('groups.create');
        $canAssignGroupManagers = $employee->can('groups.managers.assign');

        $groupsQuery = Group::query()
            ->with([
                'memberships' => fn ($query) => $query->where('user_id', $employee->getKey())->with('permissions'),
            ])
            ->withCount([
                'memberships',
                'contactRequests as open_contact_requests_count' => fn ($query) => $query->where('status', 'open'),
            ]);

        if (! $canCreateGroups && ! $canAssignGroupManagers) {
            $groupsQuery->whereHas('memberships', fn ($query) => $query->where('user_id', $employee->getKey()));
        }

        $groups = $groupsQuery
            ->orderBy('name')
            ->get();

        $availableManagers = ($canCreateGroups || $canAssignGroupManagers)
            ? User::query()
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'department_name'])
            : collect();

        return Inertia::render('employee/groups/index', [
            'status' => $request->session()->get('status'),
            'groups' => $groups->map(function (Group $group) use ($canCreateGroups, $canAssignGroupManagers) {
                /** @var GroupMembership|null $membership */
                $membership = $group->memberships->first();

                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'description' => $group->description,
                    'isActive' => $group->is_active,
                    'membershipCount' => $group->memberships_count,
                    'openContactRequestCount' => $group->open_contact_requests_count,
                    'currentRole' => $membership?->role?->value,
                    'currentRoleLabel' => $membership?->role?->label() ?? (($canCreateGroups || $canAssignGroupManagers) ? 'Admin' : null),
                    'currentPermissionKeys' => $membership?->permissions->pluck('key')->values()->all() ?? [],
                    'showUrl' => route('employee.groups.show', $group),
                ];
            })->values(),
            'requestsInboxUrl' => route('employee.group-contact-requests.index'),
            'canCreateGroups' => $canCreateGroups,
            'availableManagers' => $availableManagers->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'departmentName' => $user->department_name,
            ])->values(),
            'storeUrl' => route('employee.groups.store'),
        ]);
    }

    public function store(Request $request, CreateGroup $action, EmployeeAuthorizationService $employeeAuthorization): RedirectResponse
    {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $employeeAuthorization->syncCatalog();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:groups,name'],
            'description' => ['nullable', 'string', 'max:5000'],
            'manager_ids' => ['required', 'array', 'min:1'],
            'manager_ids.*' => ['integer', 'exists:users,id'],
        ]);

        $action->handle(
            $employee,
            $validated['name'],
            $validated['description'] ?? null,
            array_map('intval', $validated['manager_ids'])
        );

        return redirect()
            ->route('employee.groups.index')
            ->with('status', 'Gruppo creato correttamente e manager assegnati.');
    }

    public function show(
        Request $request,
        Group $group,
        GroupPermissionService $permissions,
        EmployeeAuthorizationService $employeeAuthorization
    ): Response
    {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $employeeAuthorization->syncCatalog();
        $permissions->syncCatalog();
        $canAssignGroupManagers = $employee->can('groups.managers.assign');
        $canCreateGroups = $employee->can('groups.create');

        $currentMembership = $permissions->membershipFor($employee, $group);

        abort_unless(
            $currentMembership instanceof GroupMembership || $canCreateGroups || $canAssignGroupManagers,
            403
        );

        $group->load([
            'memberships.user',
            'memberships.permissions',
        ])->loadCount([
            'contactRequests as open_contact_requests_count' => fn ($query) => $query->where('status', 'open'),
        ]);

        $availableEmployees = User::query()
            ->whereDoesntHave('groupMemberships', fn ($query) => $query->where('group_id', $group->getKey()))
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'department_name']);

        $catalog = $permissions->catalog();

        return Inertia::render('employee/groups/show', [
            'status' => $request->session()->get('status'),
            'group' => [
                'id' => $group->id,
                'name' => $group->name,
                'description' => $group->description,
                'isActive' => $group->is_active,
                'openContactRequestCount' => $group->open_contact_requests_count,
            ],
            'currentEmployeeId' => $employee->getKey(),
            'abilities' => [
                'canAddMembers' => ($currentMembership?->hasPermission('group.members.add') ?? false) || $canAssignGroupManagers,
                'canRemoveMembers' => ($currentMembership?->hasPermission('group.members.remove') ?? false) || $canAssignGroupManagers,
                'canManageMemberPermissions' => ($currentMembership?->hasPermission('group.members.permissions.manage') ?? false) || $canAssignGroupManagers,
                'canAcceptContactRequests' => $currentMembership?->hasPermission('group.contact_requests.accept') ?? false,
            ],
            'memberships' => $group->memberships
                ->sortBy(fn (GroupMembership $membership) => [$membership->role->value, $membership->user->name])
                ->values()
                ->map(fn (GroupMembership $membership) => [
                    'id' => $membership->id,
                    'user' => [
                        'id' => $membership->user->id,
                        'name' => $membership->user->name,
                        'email' => $membership->user->email,
                        'departmentName' => $membership->user->department_name,
                    ],
                    'role' => $membership->role->value,
                    'permissionKeys' => $membership->permissions->pluck('key')->values()->all(),
                    'updateUrl' => route('employee.groups.memberships.update', [$group, $membership]),
                    'removeUrl' => route('employee.groups.memberships.destroy', [$group, $membership]),
                ])
                ->all(),
            'availableEmployees' => $availableEmployees->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'departmentName' => $user->department_name,
            ])->values(),
            'permissionCatalog' => $catalog->map(fn (GroupPermission $permission) => [
                'key' => $permission->key,
                'name' => $permission->name,
                'description' => $permission->description,
            ])->values(),
            'roleDefaults' => collect(\App\Enums\GroupMembershipRole::cases())
                ->mapWithKeys(fn (\App\Enums\GroupMembershipRole $role) => [
                    $role->value => $permissions->defaultPermissionKeysForRole($role),
                ]),
            'membershipStoreUrl' => route('employee.groups.memberships.store', $group),
            'requestsInboxUrl' => route('employee.group-contact-requests.index'),
            'indexUrl' => route('employee.groups.index'),
        ]);
    }
}
