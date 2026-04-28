<?php

namespace App\Http\Controllers;

use App\Models\GroupRole;
use App\Models\User;
use App\Services\EmployeeAuthorizationService;
use App\Services\GroupPermissionService;
use App\Services\GroupRoleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class EmployeeGroupRoleController extends Controller
{
    public function store(
        Request $request,
        GroupRoleService $roles,
        GroupPermissionService $permissions,
        EmployeeAuthorizationService $employeeAuthorization
    ): RedirectResponse {
        $this->authorizedEmployee($employeeAuthorization);

        $permissions->syncCatalog();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:group_roles,name'],
            'description' => ['nullable', 'string', 'max:5000'],
            'permission_keys' => ['required', 'array', 'min:1'],
            'permission_keys.*' => ['string'],
        ]);

        $roles->create(
            $validated['name'],
            $validated['description'] ?? null,
            $validated['permission_keys']
        );

        return back()->with('status', 'Ruolo creato correttamente.');
    }

    public function update(
        Request $request,
        GroupRole $groupRole,
        GroupRoleService $roles,
        GroupPermissionService $permissions,
        EmployeeAuthorizationService $employeeAuthorization
    ): RedirectResponse {
        $this->authorizedEmployee($employeeAuthorization);

        $permissions->syncCatalog();

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('group_roles', 'name')->ignore($groupRole->getKey()),
            ],
            'description' => ['nullable', 'string', 'max:5000'],
            'permission_keys' => ['required', 'array', 'min:1'],
            'permission_keys.*' => ['string'],
        ]);

        $roles->update(
            $groupRole,
            $validated['name'],
            $validated['description'] ?? null,
            $validated['permission_keys']
        );

        return back()->with('status', 'Ruolo aggiornato correttamente.');
    }

    public function destroy(
        GroupRole $groupRole,
        GroupRoleService $roles,
        EmployeeAuthorizationService $employeeAuthorization
    ): RedirectResponse {
        $this->authorizedEmployee($employeeAuthorization);

        $roles->delete($groupRole);

        return back()->with('status', 'Ruolo eliminato correttamente.');
    }

    private function authorizedEmployee(EmployeeAuthorizationService $employeeAuthorization): User
    {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $employeeAuthorization->syncCatalog();

        abort_unless($employee->can('groups.roles.manage'), 403);

        return $employee;
    }
}
