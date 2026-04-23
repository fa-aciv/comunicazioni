<?php

namespace App\Models;

use App\Enums\GroupMembershipRole;
use Database\Factories\GroupMembershipFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
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
        'role',
    ];

    protected function casts(): array
    {
        return [
            'role' => GroupMembershipRole::class,
        ];
    }

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

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(
            GroupPermission::class,
            'group_membership_permissions',
            'group_membership_id',
            'group_permission_id',
            'id',
            'id'
        )
            ->withTimestamps();
    }

    public function hasPermission(string $permissionKey): bool
    {
        return $this->permissions->contains(
            fn (GroupPermission $permission) => $permission->key === $permissionKey
        );
    }
}
