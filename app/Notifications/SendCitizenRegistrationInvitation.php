<?php

namespace App\Notifications;

use App\Models\CitizenRegistrationInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class SendCitizenRegistrationInvitation extends Notification
{
    use Queueable;

    public function __construct(
        private readonly CitizenRegistrationInvitation $invitation
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = URL::temporarySignedRoute(
            'citizen.registration.challenge',
            $this->invitation->magic_link_expires_at,
            ['invitation' => $this->invitation]
        );

        return (new MailMessage)
            ->subject('Conferma la creazione del tuo account')
            ->greeting('Conferma account cittadino')
            ->line('Un operatore ha inserito i tuoi dati per creare il tuo account cittadino.')
            ->line('Apri il link qui sotto, verifica i dati mostrati e completa la conferma con il codice OTP ricevuto via SMS.')
            ->action('Verifica e conferma i dati', $url)
            ->line('Se non riconosci questa richiesta, puoi ignorare il messaggio e contattare la struttura.');
    }
}
