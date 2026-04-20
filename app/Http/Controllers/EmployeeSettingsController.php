<?php

namespace App\Http\Controllers;

use App\Models\ChatRetentionSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeSettingsController extends Controller
{
    public function index(Request $request): Response
    {
        $settings = ChatRetentionSetting::current();

        return Inertia::render('employee/settings/index', [
            'status' => $request->session()->get('status'),
            'settings' => [
                'messageRetentionDays' => $settings->message_retention_days,
                'inactiveThreadRetentionDays' => $settings->inactive_thread_retention_days,
                'lastCleanupAt' => $settings->last_cleanup_at?->toIso8601String(),
            ],
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
