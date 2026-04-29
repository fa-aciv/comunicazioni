<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmployeeUnreadChatsReminder extends Notification
{
    use Queueable;

    public function __construct(
        private readonly int $threadCount,
        private readonly int $unreadMessageCount,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $threadLabel = $this->threadCount === 1 ? 'chat' : 'chat';
        $unreadMessageLabel = $this->unreadMessageCount === 1
            ? 'messaggio non letto'
            : 'messaggi non letti';

        $message = (new MailMessage)
            ->subject("Hai {$this->threadCount} {$threadLabel} con {$this->unreadMessageCount} {$unreadMessageLabel}")
            ->greeting("Ciao {$notifiable->name},")
            ->line("Hai {$this->threadCount} {$threadLabel} con {$this->unreadMessageCount} {$unreadMessageLabel} in totale.");

        return $message
            ->action('Apri le chat', route('employee.chats.index'))
            ->line('Puoi modificare queste notifiche dalle impostazioni del tuo account dipendente.');
    }
}
