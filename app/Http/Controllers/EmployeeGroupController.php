<?php

namespace App\Http\Controllers;

use App\Actions\Group\CreateGroup;
use App\Models\Group;
use App\Models\GroupMembership;
use App\Models\GroupPermission;
use App\Models\GroupRole;
use App\Models\User;
use App\Services\EmployeeAuthorizationService;
use App\Services\GroupPermissionService;
use App\Services\GroupRoleService;
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
    ): Response {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $employeeAuthorization->syncCatalog();
        $permissions->syncCatalog();

        $canCreateGroups = $employee->can('groups.create');
        $canAssignGroupManagers = $employee->can('groups.managers.assign');
        $canManageGroupRoles = $employee->can('groups.roles.manage');
        $canOpenAdminPanel = $canCreateGroups || $canAssignGroupManagers || $canManageGroupRoles;
        $canOpenManagerPanel = $canAssignGroupManagers
            || $employee->groupMemberships()
                ->whereHas('groupRole.permissions', fn ($query) => $query->whereIn('key', $this->groupManagementPermissionKeys()))
                ->exists();

        $groupsQuery = Group::query()
            ->with([
                'memberships' => fn ($query) => $query
                    ->where('user_id', $employee->getKey())
                    ->with('groupRole.permissions'),
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

        return Inertia::render('employee/groups/index', [
            'status' => $request->session()->get('status'),
            'groups' => $groups->map(function (Group $group) {
                /** @var GroupMembership|null $membership */
                $membership = $group->memberships->first();
                $role = $membership?->groupRole;

                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'description' => $group->description,
                    'isActive' => $group->is_active,
                    'membershipCount' => $group->memberships_count,
                    'openContactRequestCount' => $group->open_contact_requests_count,
                    'currentRoleName' => $role?->name,
                    'currentRoleDescription' => $role?->description,
                    'currentPermissionNames' => $role?->permissions->pluck('name')->values()->all() ?? [],
                ];
            })->values(),
            'requestsInboxUrl' => route('employee.group-contact-requests.index'),
            'canOpenAdminPanel' => $canOpenAdminPanel,
            'adminPanelUrl' => $canOpenAdminPanel ? route('employee.groups.admin') : null,
            'canOpenManagerPanel' => $canOpenManagerPanel,
            'managerPanelUrl' => $canOpenManagerPanel ? route('employee.groups.manage') : null,
        ]);
    }

    public function admin(
        Request $request,
        GroupPermissionService $permissions,
        GroupRoleService $roles,
        EmployeeAuthorizationService $employeeAuthorization
    ): Response {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $employeeAuthorization->syncCatalog();
        $permissions->syncCatalog();

        $canCreateGroups = $employee->can('groups.create');
        $canAssignGroupManagers = $employee->can('groups.managers.assign');
        $canManageGroupRoles = $employee->can('groups.roles.manage');
        $canOpenManagerPanel = $canAssignGroupManagers
            || $employee->groupMemberships()
                ->whereHas('groupRole.permissions', fn ($query) => $query->whereIn('key', $this->groupManagementPermissionKeys()))
                ->exists();

        abort_unless($canCreateGroups || $canAssignGroupManagers || $canManageGroupRoles, 403);

        $groups = Group::query()
            ->withCount([
                'memberships',
                'contactRequests as open_contact_requests_count' => fn ($query) => $query->where('status', 'open'),
            ])
            ->orderBy('name')
            ->get();

        $availableManagers = ($canCreateGroups || $canAssignGroupManagers)
            ? User::query()
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'department_name'])
            : collect();

        $permissionCatalog = $canManageGroupRoles ? $permissions->catalog() : collect();
        $roleCatalog = $canManageGroupRoles ? $roles->catalog() : collect();

        return Inertia::render('employee/groups/admin', [
            'status' => $request->session()->get('status'),
            'groups' => $groups->map(fn (Group $group) => [
                'id' => $group->id,
                'name' => $group->name,
                'description' => $group->description,
                'isActive' => $group->is_active,
                'membershipCount' => $group->memberships_count,
                'openContactRequestCount' => $group->open_contact_requests_count,
                'chatMessageRetentionDays' => $group->chat_message_retention_days,
                'chatInactiveThreadRetentionDays' => $group->chat_inactive_thread_retention_days,
                'retentionUpdateUrl' => route('employee.groups.retention.update', $group),
            ])->values(),
            'canCreateGroups' => $canCreateGroups,
            'canManageGroupRoles' => $canManageGroupRoles,
            'availableManagers' => $availableManagers->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'departmentName' => $user->department_name,
            ])->values(),
            'storeUrl' => route('employee.groups.store'),
            'permissionCatalog' => $permissionCatalog->map(fn (GroupPermission $permission) => [
                'key' => $permission->key,
                'name' => $permission->name,
                'description' => $permission->description,
            ])->values(),
            'groupRoles' => $roleCatalog->map(fn (GroupRole $role) => [
                ...$this->mapRole($role, $permissions),
                'memberCount' => (int) ($role->memberships_count ?? 0),
                'updateUrl' => route('employee.group-roles.update', $role),
                'destroyUrl' => route('employee.group-roles.destroy', $role),
            ])->values(),
            'groupRoleStoreUrl' => route('employee.group-roles.store'),
            'groupsOverviewUrl' => route('employee.groups.index'),
            'canOpenManagerPanel' => $canOpenManagerPanel,
            'managerPanelUrl' => $canOpenManagerPanel ? route('employee.groups.manage') : null,
        ]);
    }

    public function manage(
        Request $request,
        GroupPermissionService $permissions,
        GroupRoleService $roles,
        EmployeeAuthorizationService $employeeAuthorization
    ): Response {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $employeeAuthorization->syncCatalog();
        $permissions->syncCatalog();

        $canAssignGroupManagers = $employee->can('groups.managers.assign');
        $canOpenAdminPanel = $employee->can('groups.create')
            || $canAssignGroupManagers
            || $employee->can('groups.roles.manage');

        $groupsQuery = Group::query()
            ->with([
                'memberships' => fn ($query) => $query
                    ->where('user_id', $employee->getKey())
                    ->with('groupRole.permissions'),
            ])
            ->withCount([
                'memberships',
                'contactRequests as open_contact_requests_count' => fn ($query) => $query->where('status', 'open'),
            ]);

        if (! $canAssignGroupManagers) {
            $groupsQuery->whereHas('memberships', fn ($query) => $query
                ->where('user_id', $employee->getKey())
                ->whereHas('groupRole.permissions', fn ($permissionQuery) => $permissionQuery->whereIn('key', $this->groupManagementPermissionKeys()))
            );
        }

        $groups = $groupsQuery
            ->orderBy('name')
            ->get();

        abort_unless($canAssignGroupManagers || $groups->isNotEmpty(), 403);

        $currentMemberships = $groups->mapWithKeys(
            fn (Group $group) => [$group->getKey() => $group->memberships->first()]
        );

        $groups = Group::query()
            ->whereKey($groups->modelKeys())
            ->with([
                'memberships.user',
                'memberships.groupRole.permissions',
            ])
            ->withCount([
                'memberships',
                'contactRequests as open_contact_requests_count' => fn ($query) => $query->where('status', 'open'),
            ])
            ->orderBy('name')
            ->get();

        $availableRoles = $roles->catalog();

        return Inertia::render('employee/groups/manage', [
            'status' => $request->session()->get('status'),
            'currentEmployeeId' => $employee->getKey(),
            'availableRoles' => $availableRoles->map(fn (GroupRole $role) => $this->mapRole($role, $permissions))->values(),
            'groups' => $groups->map(function (Group $group) use ($permissions, $currentMemberships, $canAssignGroupManagers) {
                /** @var GroupMembership|null $currentMembership */
                $currentMembership = $currentMemberships->get($group->getKey());
                $role = $currentMembership?->groupRole;

                $availableEmployees = User::query()
                    ->whereDoesntHave('groupMemberships', fn ($query) => $query->where('group_id', $group->getKey()))
                    ->orderBy('name')
                    ->get(['id', 'name', 'email', 'employee_id', 'department_name']);

                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'description' => $group->description,
                    'isActive' => $group->is_active,
                    'membershipCount' => $group->memberships_count,
                    'openContactRequestCount' => $group->open_contact_requests_count,
                    'currentRoleName' => $role?->name,
                    'currentPermissionNames' => $role?->permissions->pluck('name')->values()->all() ?? [],
                    'abilities' => [
                        'canAddMembers' => ($currentMembership?->hasPermission('group.members.add') ?? false) || $canAssignGroupManagers,
                        'canRemoveMembers' => ($currentMembership?->hasPermission('group.members.remove') ?? false) || $canAssignGroupManagers,
                        'canManageMemberRoles' => ($currentMembership?->hasPermission('group.members.permissions.manage') ?? false) || $canAssignGroupManagers,
                        'canAcceptContactRequests' => $currentMembership?->hasPermission('group.contact_requests.accept') ?? false,
                    ],
                    'memberships' => $group->memberships
                        ->sortBy(fn (GroupMembership $membership) => [
                            $membership->groupRole && $permissions->roleIsManager($membership->groupRole) ? 0 : 1,
                            mb_strtolower($membership->groupRole?->name ?? ''),
                            mb_strtolower($membership->user->name),
                        ])
                        ->values()
                        ->map(fn (GroupMembership $membership) => [
                            'id' => $membership->id,
                            'user' => [
                                'id' => $membership->user->id,
                                'name' => $membership->user->name,
                                'email' => $membership->user->email,
                                'employeeId' => $membership->user->employee_id,
                                'departmentName' => $membership->user->department_name,
                            ],
                            'role' => $membership->groupRole ? $this->mapRole($membership->groupRole, $permissions) : null,
                            'updateUrl' => route('employee.groups.memberships.update', [$group, $membership]),
                            'removeUrl' => route('employee.groups.memberships.destroy', [$group, $membership]),
                        ])
                        ->all(),
                    'availableEmployees' => $availableEmployees->map(fn (User $user) => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'employeeId' => $user->employee_id,
                        'departmentName' => $user->department_name,
                    ])->values(),
                    'membershipStoreUrl' => route('employee.groups.memberships.store', $group),
                ];
            })->values(),
            'groupsOverviewUrl' => route('employee.groups.index'),
            'canOpenAdminPanel' => $canOpenAdminPanel,
            'adminPanelUrl' => $canOpenAdminPanel ? route('employee.groups.admin') : null,
        ]);
    }

    public function store(
        Request $request,
        CreateGroup $action,
        EmployeeAuthorizationService $employeeAuthorization
    ): RedirectResponse {
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
        GroupRoleService $roles,
        EmployeeAuthorizationService $employeeAuthorization
    ): Response {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $employeeAuthorization->syncCatalog();
        $permissions->syncCatalog();

        $canAssignGroupManagers = $employee->can('groups.managers.assign');
        $currentMembership = $permissions->membershipFor($employee, $group);

        abort_unless(
            ($currentMembership instanceof GroupMembership && $this->membershipCanManageGroup($currentMembership, false))
                || $canAssignGroupManagers,
            403
        );

        $group->load([
            'memberships.user',
            'memberships.groupRole.permissions',
        ])->loadCount([
            'contactRequests as open_contact_requests_count' => fn ($query) => $query->where('status', 'open'),
        ]);

        $availableEmployees = User::query()
            ->whereDoesntHave('groupMemberships', fn ($query) => $query->where('group_id', $group->getKey()))
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'employee_id', 'department_name']);

        $availableRoles = $roles->catalog();

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
                'canManageMemberRoles' => ($currentMembership?->hasPermission('group.members.permissions.manage') ?? false) || $canAssignGroupManagers,
                'canAcceptContactRequests' => $currentMembership?->hasPermission('group.contact_requests.accept') ?? false,
            ],
            'memberships' => $group->memberships
                ->sortBy(fn (GroupMembership $membership) => [
                    $membership->groupRole && $permissions->roleIsManager($membership->groupRole) ? 0 : 1,
                    mb_strtolower($membership->groupRole?->name ?? ''),
                    mb_strtolower($membership->user->name),
                ])
                ->values()
                ->map(fn (GroupMembership $membership) => [
                    'id' => $membership->id,
                    'user' => [
                        'id' => $membership->user->id,
                        'name' => $membership->user->name,
                        'email' => $membership->user->email,
                        'employeeId' => $membership->user->employee_id,
                        'departmentName' => $membership->user->department_name,
                    ],
                    'role' => $membership->groupRole ? $this->mapRole($membership->groupRole, $permissions) : null,
                    'updateUrl' => route('employee.groups.memberships.update', [$group, $membership]),
                    'removeUrl' => route('employee.groups.memberships.destroy', [$group, $membership]),
                ])
                ->all(),
            'availableEmployees' => $availableEmployees->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'employeeId' => $user->employee_id,
                'departmentName' => $user->department_name,
            ])->values(),
            'availableRoles' => $availableRoles->map(fn (GroupRole $role) => $this->mapRole($role, $permissions))->values(),
            'membershipStoreUrl' => route('employee.groups.memberships.store', $group),
            'requestsInboxUrl' => route('employee.group-contact-requests.index'),
            'indexUrl' => route('employee.groups.manage'),
            'groupsOverviewUrl' => route('employee.groups.index'),
        ]);
    }

    public function updateRetention(
        Request $request,
        Group $group,
        GroupPermissionService $permissions,
        EmployeeAuthorizationService $employeeAuthorization
    ): RedirectResponse {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $employeeAuthorization->syncCatalog();
        $permissions->syncCatalog();

        abort_unless(
            $employee->can('groups.create')
                || $employee->can('groups.managers.assign')
                || $employee->can('groups.roles.manage'),
            403
        );

        $validated = $request->validate([
            'chatMessageRetentionDays' => ['required', 'integer', 'min:1', 'max:3650'],
            'chatInactiveThreadRetentionDays' => ['required', 'integer', 'min:1', 'max:3650', 'gte:chatMessageRetentionDays'],
        ], [
            'chatInactiveThreadRetentionDays.gte' => 'La retention delle chat inattive deve essere uguale o superiore a quella dei messaggi.',
        ]);

        $group->forceFill([
            'chat_message_retention_days' => (int) $validated['chatMessageRetentionDays'],
            'chat_inactive_thread_retention_days' => (int) $validated['chatInactiveThreadRetentionDays'],
        ])->save();

        return back()->with('status', 'Impostazioni di retention del gruppo aggiornate correttamente.');
    }

    /**
     * @return array{
     *     id: int,
     *     key: string,
     *     name: string,
     *     description: string|null,
     *     isManager: bool,
     *     permissionKeys: list<string>,
     *     permissionNames: list<string>
     * }
     */
    private function mapRole(GroupRole $role, GroupPermissionService $permissions): array
    {
        return [
            'id' => $role->id,
            'key' => $role->key,
            'name' => $role->name,
            'description' => $role->description,
            'isManager' => $permissions->roleIsManager($role),
            'permissionKeys' => $role->permissions->pluck('key')->values()->all(),
            'permissionNames' => $role->permissions->pluck('name')->values()->all(),
        ];
    }

    /**
     * @return list<string>
     */
    private function groupManagementPermissionKeys(): array
    {
        return [
            'group.members.add',
            'group.members.remove',
            'group.members.permissions.manage',
        ];
    }

    private function membershipCanManageGroup(GroupMembership $membership, bool $canAssignGroupManagers): bool
    {
        if ($canAssignGroupManagers) {
            return true;
        }

        foreach ($this->groupManagementPermissionKeys() as $permissionKey) {
            if ($membership->hasPermission($permissionKey)) {
                return true;
            }
        }

        return false;
    }
}
