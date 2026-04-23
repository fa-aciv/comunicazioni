<?php

namespace App\Enums;

enum GroupContactRequestStatus: string
{
    case Open = 'open';
    case Accepted = 'accepted';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Open => 'Aperta',
            self::Accepted => 'Accettata',
            self::Cancelled => 'Annullata',
        };
    }
}
