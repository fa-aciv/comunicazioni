<?php

namespace App\Services\Sms;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class EsendexSmsSender
{
    public function send(string $phoneNumber, string $message): void
    {
        $username = (string) config('services.esendex.username');
        $password = (string) config('services.esendex.password');
        $accountReference = (string) config('services.esendex.account_reference');
        $baseUrl = rtrim((string) config('services.esendex.base_url'), '/');

        if ($username === '' || $password === '' || $accountReference === '') {
            throw new RuntimeException('Esendex credentials are not configured.');
        }

        Http::acceptJson()
            ->asJson()
            ->withBasicAuth($username, $password)
            ->post($baseUrl.'/messagedispatcher', [
                'accountreference' => $accountReference,
                'messages' => [[
                    'to' => $phoneNumber,
                    'body' => $message,
                ]],
            ])
            ->throw();
    }

    public function sendCitizenOtp(string $phoneNumber, string $otp): void
    {
        $message = str_replace(
            [':app', ':otp'],
            [config('app.name'), $otp],
            (string) config('services.esendex.otp_template')
        );

        $this->send($phoneNumber, $message);
    }
}
