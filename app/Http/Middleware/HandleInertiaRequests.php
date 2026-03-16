<?php

namespace App\Http\Middleware;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');
        $employee = Auth::guard('employee')->user();
        $citizen = Auth::guard('citizen')->user();
        $activeGuard = $this->resolveActiveGuard($request, $employee, $citizen);
        $user = match ($activeGuard) {
            'employee' => $employee,
            'citizen' => $citizen,
            default => $employee ?? $citizen,
        };

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $user,
                'activeGuard' => $activeGuard,
                'guards' => [
                    'citizen' => (bool) $citizen,
                    'employee' => (bool) $employee,
                ],
                'homeUrl' => $activeGuard ? route($activeGuard.'.dashboard') : null,
                'logoutUrl' => $activeGuard ? route($activeGuard.'.logout') : null,
                'portalLabel' => match ($activeGuard) {
                    'employee' => 'Area Dipendenti',
                    'citizen' => 'Area Cittadini',
                    default => null,
                },
            ],
            'sidebarOpen' => !$request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }

    private function resolveActiveGuard(
        Request $request,
        ?Authenticatable $employee,
        ?Authenticatable $citizen
    ): ?string {
        $routeName = $request->route()?->getName();

        if (is_string($routeName)) {
            if (str_starts_with($routeName, 'employee.')) {
                return 'employee';
            }

            if (str_starts_with($routeName, 'citizen.')) {
                return 'citizen';
            }
        }

        if ($request->attributes->get('auth_guard')) {
            return $request->attributes->get('auth_guard');
        }

        if ($employee) {
            return 'employee';
        }

        if ($citizen) {
            return 'citizen';
        }

        return null;
    }
}
