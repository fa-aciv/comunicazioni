<?php

namespace App\Models;

use Database\Factories\GroupRoleFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GroupRole extends Model
{
    /** @use HasFactory<GroupRoleFactory> */
    use HasFactory;

    protected $fillable = [
        'key',
        'name',
        'description',
    ];

    protected static function newFactory(): GroupRoleFactory
    {
        return GroupRoleFactory::new();
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(
            GroupPermission::class,
            'group_role_permissions',
            'group_role_id',
            'group_permission_id'
        )->withTimestamps();
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(GroupMembership::class);
    }

    public function groupsUsingAsDefault(): HasMany
    {
        return $this->hasMany(Group::class, 'default_group_role_id');
    }

    public function hasPermission(string $permissionKey): bool
    {
        return $this->permissions->contains(
            fn (GroupPermission $permission) => $permission->key === $permissionKey
        );
    }
}
