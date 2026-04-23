<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class GroupPermission extends Model
{
    protected $fillable = [
        'key',
        'name',
        'description',
    ];

    public function memberships(): BelongsToMany
    {
        return $this->belongsToMany(
            GroupMembership::class,
            'group_membership_permissions',
            'group_permission_id',
            'group_membership_id',
            'id',
            'id'
        )
            ->withTimestamps();
    }
}
