<?php

namespace App\Models;

use Database\Factories\CitizenFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class Citizen extends Authenticatable
{
    /** @use HasFactory<CitizenFactory> */
    use HasFactory, Notifiable;

    protected $fillable = [
        'uuid',
        'name',
        'email',
        'phone_number',
        'fiscal_code',
        'last_login_at',
    ];

    protected string $guard_name = 'citizen';

    protected static function booted(): void
    {
        static::creating(function (self $citizen): void {
            $citizen->uuid ??= (string) Str::uuid();
        });
    }

    protected $hidden = [
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'last_login_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function newFactory(): CitizenFactory
    {
        return CitizenFactory::new();
    }

    public function getMaskedPhoneNumberAttribute(): string
    {
        $digits = preg_replace('/\D+/', '', $this->phone_number ?? '');

        if (strlen($digits) < 4) {
            return $this->phone_number ?? '';
        }

        return str_repeat('*', max(strlen($digits) - 4, 0)).substr($digits, -4);
    }

    public function getNormalizedFiscalCodeAttribute(): string
    {
        return strtoupper((string) $this->fiscal_code);
    }
}
