<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Citizen;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

trait ResolvesGuardActor
{
    protected function resolveGuardActor(Request $request): Model
    {
        $preferredGuard = $request->attributes->get('auth_guard');

        if (is_string($preferredGuard)) {
            $preferredActor = Auth::guard($preferredGuard)->user();

            if ($preferredActor instanceof Model) {
                return $preferredActor;
            }
        }

        $defaultActor = Auth::user();

        if ($defaultActor instanceof Model) {
            return $defaultActor;
        }

        $employee = Auth::guard('employee')->user();

        if ($employee instanceof User) {
            return $employee;
        }

        $citizen = Auth::guard('citizen')->user();

        if ($citizen instanceof Citizen) {
            return $citizen;
        }

        abort(403);
    }
}
