<?php

namespace App\Notifications;

use App\Models\CitizenContactChangeRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class SendCitizenContactChangeLink extends Notification
{
    use Queueable;

    public function __construct(
        private readonly CitizenContactChangeRequest $request
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = URL::temporarySignedRoute(
            'citizen.account.change.challenge',
            $this->request->magic_link_expires_at,
            ['changeRequest' => $this->request]
        );

        return (new MailMessage)
            ->subject('Conferma la modifica dei tuoi contatti')
            ->greeting('Conferma modifica account')
            ->line('Hai richiesto una modifica dei tuoi contatti nell\'area cittadini.')
            ->line('Apri il link qui sotto e completa la verifica con il codice OTP ricevuto via SMS prima che le modifiche vengano applicate.')
            ->action('Conferma le modifiche', $url)
            ->line('Se non hai richiesto tu questa modifica, ignora il messaggio.');
    }
}
