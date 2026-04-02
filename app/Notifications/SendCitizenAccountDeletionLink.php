<?php

namespace App\Notifications;

use App\Models\CitizenAccountDeletionRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class SendCitizenAccountDeletionLink extends Notification
{
    use Queueable;

    public function __construct(
        private readonly CitizenAccountDeletionRequest $request
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = URL::temporarySignedRoute(
            'citizen.account.deletion.challenge',
            $this->request->magic_link_expires_at,
            ['deletionRequest' => $this->request]
        );

        return (new MailMessage)
            ->subject('Conferma l’eliminazione del tuo account')
            ->greeting('Conferma eliminazione account')
            ->line('Hai richiesto l’eliminazione del tuo account cittadino.')
            ->line('Apri il link qui sotto e completa la verifica con il codice OTP ricevuto via SMS per confermare definitivamente l’operazione.')
            ->action('Conferma eliminazione account', $url)
            ->line('Se non hai richiesto tu questa operazione, ignora il messaggio.');
    }
}
