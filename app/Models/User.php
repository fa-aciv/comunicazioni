<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

use LdapRecord\Laravel\Auth\LdapAuthenticatable;
use LdapRecord\Laravel\Auth\AuthenticatesWithLdap;

use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable  implements LdapAuthenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable, AuthenticatesWithLdap, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'sAMAccountName',
        'employee_id',
        'fiscalcode',
        'department_id',
        'department_name',
        'email',
        'password',
        'guid',
        'domain',
    ];

    protected string $guard_name = 'employee';

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function createdChats(): MorphMany
    {
        return $this->morphMany(ChatThread::class, 'creator');
    }

    public function chatParticipations(): MorphMany
    {
        return $this->morphMany(ChatParticipant::class, 'participant');
    }

    public function chatMessages(): MorphMany
    {
        return $this->morphMany(ChatMessage::class, 'author');
    }

    public function messageAttachments(): MorphMany
    {
        return $this->morphMany(MessageAttachment::class, 'author');
    }

    public function groupMemberships(): HasMany
    {
        return $this->hasMany(GroupMembership::class);
    }

    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(Group::class, 'group_memberships')
            ->using(GroupMembership::class)
            ->withPivot(['id', 'group_role_id', 'role'])
            ->withTimestamps();
    }

    public function acceptedGroupContactRequests(): HasMany
    {
        return $this->hasMany(GroupContactRequest::class, 'accepted_by_user_id');
    }
}
