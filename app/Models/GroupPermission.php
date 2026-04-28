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

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(
            GroupRole::class,
            'group_role_permissions',
            'group_permission_id',
            'group_role_id'
        )
            ->withTimestamps();
    }
}
