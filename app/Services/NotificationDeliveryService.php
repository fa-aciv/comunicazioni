<?php

namespace App\Services;

use App\Exceptions\NotificationDeliveryException;
use Illuminate\Notifications\Notification;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class NotificationDeliveryService
{
    public function send(object $notifiable, Notification $notification, string $userMessage): void
    {
        try {
            $notifiable->notify($notification);
        } catch (TransportExceptionInterface $exception) {
            report($exception);

            throw new NotificationDeliveryException($userMessage, previous: $exception);
        }
    }
}
