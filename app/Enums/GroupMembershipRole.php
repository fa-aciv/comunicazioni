<?php

namespace App\Enums;

enum GroupMembershipRole: string
{
    case Manager = 'manager';
    case User = 'user';

    public function label(): string
    {
        return match ($this) {
            self::Manager => 'Manager',
            self::User => 'User',
        };
    }
}
