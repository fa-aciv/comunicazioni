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
        $this->apiUrl = config('services.esendex.api_url', env('VODAFONE_API_URL'));
        $this->userKey = config('services.esendex.user_key', env('VODAFONE_USER_KEY'));
        $this->accessToken = config('services.esendex.access_token', env('VODAFONE_ACCESS_TOKEN'));
        $this->sender = config('services.esendex.sender', env('VODAFONE_SENDER', 'ARNASCivico'));
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
}
