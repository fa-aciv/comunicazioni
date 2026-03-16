<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class SetAuthGuard
{
    public function handle(Request $request, Closure $next, ?string $guard = null): Response
    {
        if ($guard) {
            Auth::shouldUse($guard);
            $request->attributes->set('auth_guard', $guard);
        }

        return $next($request);
    }
}
