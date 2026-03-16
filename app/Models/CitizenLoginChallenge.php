<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CitizenLoginChallenge extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (self $challenge): void {
            $challenge->uuid ??= (string) Str::uuid();
        });
    }

    protected $fillable = [
        'citizen_id',
        'uuid',
        'magic_link_expires_at',
        'magic_link_opened_at',
        'otp_code_hash',
        'otp_sent_at',
        'otp_expires_at',
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
}
