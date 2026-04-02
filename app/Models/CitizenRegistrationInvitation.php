<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;

class CitizenRegistrationInvitation extends Model
{
    use HasFactory, Notifiable;

    protected static function booted(): void
    {
        static::creating(function (self $invitation): void {
            $invitation->uuid ??= (string) Str::uuid();
        });
    }

    protected $fillable = [
        'citizen_id',
        'uuid',
        'name',
        'email',
        'phone_number',
        'fiscal_code',
        'otp_code_hash',
        'magic_link_expires_at',
        'magic_link_opened_at',
        'otp_sent_at',
        'otp_expires_at',
        'accepted_at',
        'completed_at',
        'last_ip_address',
    ];

    protected function casts(): array
    {
        return [
            'magic_link_expires_at' => 'datetime',
            'magic_link_opened_at' => 'datetime',
            'otp_sent_at' => 'datetime',
            'otp_expires_at' => 'datetime',
            'accepted_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function citizen()
    {
        return $this->belongsTo(Citizen::class);
    }

    public function isOpen(): bool
    {
        return $this->magic_link_opened_at !== null && $this->completed_at === null;
    }

    public function isExpired(): bool
    {
        return $this->magic_link_expires_at === null || $this->magic_link_expires_at->isPast();
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

    public function routeNotificationForMail(): string
    {
        return $this->email;
    }
}
