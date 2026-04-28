<?php

namespace App\Http\Controllers;

use App\Models\ChatRetentionSetting;
use App\Models\User;
use App\Services\EmployeeAuthorizationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeSettingsController extends Controller
{
    public function index(
        Request $request,
        EmployeeAuthorizationService $employeeAuthorization
    ): Response
    {
        /** @var User|null $employee */
        $employee = Auth::guard('employee')->user();

        abort_unless($employee instanceof User, 403);

        $employeeAuthorization->syncCatalog();

        $settings = ChatRetentionSetting::current();
        $groupCount = $employee->groupMemberships()->count();
        $canOpenAdminGroupPanel = $employee->can('groups.create')
            || $employee->can('groups.managers.assign')
            || $employee->can('groups.roles.manage');
        $canOpenManagerGroupPanel = $employee->can('groups.managers.assign')
            || $employee->groupMemberships()
                ->whereHas('groupRole.permissions', fn ($query) => $query->whereIn('key', [
                    'group.members.add',
                    'group.members.remove',
                ]))
                ->exists();

        return Inertia::render('employee/settings/index', [
            'status' => $request->session()->get('status'),
            'settings' => [
                'messageRetentionDays' => $settings->message_retention_days,
                'inactiveThreadRetentionDays' => $settings->inactive_thread_retention_days,
                'lastCleanupAt' => $settings->last_cleanup_at?->toIso8601String(),
            ],
            'groupCount' => $groupCount,
            'groupsOverviewUrl' => route('employee.groups.index'),
            'canOpenAdminGroupPanel' => $canOpenAdminGroupPanel,
            'adminGroupPanelUrl' => $canOpenAdminGroupPanel ? route('employee.groups.admin') : null,
            'canOpenManagerGroupPanel' => $canOpenManagerGroupPanel,
            'managerGroupPanelUrl' => $canOpenManagerGroupPanel ? route('employee.groups.manage') : null,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'messageRetentionDays' => ['required', 'integer', 'min:1', 'max:3650'],
            'inactiveThreadRetentionDays' => ['required', 'integer', 'min:1', 'max:3650', 'gte:messageRetentionDays'],
        ], [
            'inactiveThreadRetentionDays.gte' => 'La retention delle chat inattive deve essere uguale o superiore a quella dei messaggi.',
        ]);

        $settings = ChatRetentionSetting::current();

        $settings->forceFill([
            'message_retention_days' => (int) $validated['messageRetentionDays'],
            'inactive_thread_retention_days' => (int) $validated['inactiveThreadRetentionDays'],
        ])->save();

        return back()->with('status', 'Impostazioni di retention aggiornate correttamente.');
    }
}
