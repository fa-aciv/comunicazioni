<?php

namespace App\Http\Controllers;

use App\Models\ChatThread;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $employee */
        $employee = Auth::guard('employee')->user();

        $activeChatsCount = ChatThread::query()
            ->whereHas('participants', function ($query) use ($employee): void {
                $query
                    ->where('participant_type', User::class)
                    ->where('participant_id', $employee->getKey());
            })
            ->count();

        return Inertia::render('employee/dashboard', [
            'status' => $request->session()->get('status'),
            'activeChatsCount' => $activeChatsCount,
        ]);
    }
}
