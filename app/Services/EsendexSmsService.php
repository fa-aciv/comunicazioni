<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class EsendexSmsService
{
    protected string $apiUrl;
    protected string $userKey;
    protected string $accessToken;
    protected string $sender;

    public function __construct()
    {
        $this->apiUrl = (string) (config('services.esendex.api_url') ?? '');
        $this->userKey = (string) (config('services.esendex.user_key') ?? '');
        $this->accessToken = (string) (config('services.esendex.access_token') ?? '');
        $this->sender = (string) (config('services.esendex.sender') ?? 'ARNASCivico');
    }

    /**
     * Send an SMS (single recipient).
     *
     * @param string $phone E.164 formatted, e.g. +390123456789
     * @param string $message
     * @return array ['ok' => bool, 'status' => int, 'body' => array|string]
     */
    public function sendSms(string $phone, string $message): array
    {
        if (! $this->isConfigured()) {
            Log::warning('Esendex SMS skipped because the service is not configured.', [
                'phone' => $phone,
            ]);

            return [
                'ok' => false,
                'status' => 0,
                'body' => 'Esendex SMS service is not configured.',
            ];
        }

        try {
            $payload = [
                'message_type' => 'L', 
                'message' => $message,
                'recipient' => [$phone],
                'sender' => $this->sender,
                'returnCredits' => true,
            ];

            $response = Http::withHeaders([
                'Content-Type' => 'application/json',
                'user_key' => $this->userKey,
                'Access_token' => $this->accessToken,
            ])->post($this->apiUrl, $payload);

            $body = $response->json() ?? $response->body();

            if ($response->successful()) {
                return ['ok' => true, 'status' => $response->status(), 'body' => $body];
            }

            Log::warning('Esendex SMS failed', ['status' => $response->status(), 'body' => $body, 'phone' => $phone]);
            return ['ok' => false, 'status' => $response->status(), 'body' => $body];
        } catch (Throwable $e) {
            Log::error('Esendex SMS exception', ['message' => $e->getMessage(), 'phone' => $phone]);
            return ['ok' => false, 'status' => 0, 'body' => $e->getMessage()];
        }
    }

    private function isConfigured(): bool
    {
        return filled($this->apiUrl)
            && filled($this->userKey)
            && filled($this->accessToken);
    }
}
