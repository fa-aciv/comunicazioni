<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        Fortify::ignoreRoutes();
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('employee-login', function (Request $request) {
            return Limit::perMinute(5)->by(
                mb_strtolower((string) $request->input('username')).'|'.$request->ip()
            );
        });

        RateLimiter::for('citizen-link', fn (Request $request) => [
            Limit::perMinute(3)->by(mb_strtolower((string) $request->input('email')).'|'.$request->ip()),
        ]);

        RateLimiter::for('citizen-verify', fn (Request $request) => [
            Limit::perMinute(5)->by($request->session()->get('citizen_auth.challenge_id', 'guest').'|'.$request->ip()),
        ]);

        RateLimiter::for('citizen-registration-verify', fn (Request $request) => [
            Limit::perMinute(5)->by($request->session()->get('citizen_registration.invitation_id', 'guest').'|'.$request->ip()),
        ]);
    }
}
