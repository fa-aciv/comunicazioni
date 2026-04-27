<?php

namespace App\Models;

use Database\Factories\GroupFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Group extends Model
{
    /** @use HasFactory<GroupFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'is_active',
        'chat_message_retention_days',
        'chat_inactive_thread_retention_days',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'bool',
            'chat_message_retention_days' => 'integer',
            'chat_inactive_thread_retention_days' => 'integer',
        ];
    }

    protected static function newFactory(): GroupFactory
    {
        return GroupFactory::new();
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(GroupMembership::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'group_memberships')
            ->using(GroupMembership::class)
            ->withPivot(['id', 'role'])
            ->withTimestamps();
    }

    public function contactRequests(): HasMany
    {
        return $this->hasMany(GroupContactRequest::class);
    }

    public function chatThreads(): HasMany
    {
        return $this->hasMany(ChatThread::class);
    }
}
