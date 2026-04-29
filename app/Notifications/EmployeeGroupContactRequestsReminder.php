<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmployeeGroupContactRequestsReminder extends Notification
{
    use Queueable;

    public function __construct(
        private readonly int $requestCount,
        private readonly array $groupSummaries,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $requestLabel = $this->requestCount === 1
            ? 'richiesta di contatto'
            : 'richieste di contatto';

        $message = (new MailMessage)
            ->subject("Hai {$this->requestCount} {$requestLabel} indirizzate ai tuoi gruppi")
            ->greeting("Ciao {$notifiable->name},")
            ->line("Hai {$this->requestCount} {$requestLabel} indirizzate ai tuoi gruppi:");

        foreach ($this->groupSummaries as $groupSummary) {
            $countLabel = $groupSummary['count'] === 1
                ? 'richiesta di contatto'
                : 'richieste di contatto';

            $message->line("• {$groupSummary['count']} {$countLabel} per {$groupSummary['group_name']}");
        }

        return $message
            ->action('Apri le richieste', route('employee.group-contact-requests.index'))
            ->line('Puoi modificare queste notifiche dalle impostazioni del tuo account dipendente.');
    }
}
