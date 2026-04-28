<?php

namespace App\Models;

use Database\Factories\GroupMembershipFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class GroupMembership extends Pivot
{
    /** @use HasFactory<GroupMembershipFactory> */
    use HasFactory;

    protected $table = 'group_memberships';

    public $incrementing = true;

    protected $fillable = [
        'group_id',
        'user_id',
        'group_role_id',
        'role',
    ];

    protected static function newFactory(): GroupMembershipFactory
    {
        return GroupMembershipFactory::new();
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function groupRole(): BelongsTo
    {
        return $this->belongsTo(GroupRole::class);
    }

    public function hasPermission(string $permissionKey): bool
    {
        return $this->relationLoaded('groupRole')
            ? ($this->groupRole?->hasPermission($permissionKey) ?? false)
            : ($this->groupRole()->with('permissions')->first()?->hasPermission($permissionKey) ?? false);
    }
}
