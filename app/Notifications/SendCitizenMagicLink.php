<?php

namespace App\Notifications;

use App\Models\CitizenLoginChallenge;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class SendCitizenMagicLink extends Notification
{
    use Queueable;

    public function __construct(
        private readonly CitizenLoginChallenge $challenge
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = URL::temporarySignedRoute(
            'citizen.login.challenge',
            $this->challenge->magic_link_expires_at,
            ['challenge' => $this->challenge]
        );

        return (new MailMessage)
            ->subject('Il tuo link di accesso')
            ->greeting('Accesso area cittadini')
            ->line('Apri il link qui sotto per continuare il login.')
            ->line('Dopo il click dovrai confermare codice fiscale e OTP ricevuto via SMS.')
            ->action('Apri link di accesso', $url)
            ->line('Se non hai richiesto tu l\'accesso, ignora questo messaggio.');
    }
}
