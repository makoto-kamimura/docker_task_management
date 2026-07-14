<?php

namespace App\Services\Push;

use App\Models\DeviceToken;
use App\Models\PushNotification;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FcmSender implements PushNotificationSenderInterface
{
    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';
    private const SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

    public function send(DeviceToken $deviceToken, PushNotification $notification): bool
    {
        $projectId = config('push.fcm.project_id');
        $credentialsPath = config('push.fcm.credentials_path');

        if (! $projectId || ! $credentialsPath || ! is_readable($credentialsPath)) {
            Log::info('FCM is not configured; skipping push send.', ['device_token_id' => $deviceToken->id]);

            return false;
        }

        $accessToken = $this->fetchAccessToken($credentialsPath);

        if ($accessToken === null) {
            return false;
        }

        $task = $notification->task;

        $response = Http::withToken($accessToken)
            ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", [
                'message' => [
                    'token' => $deviceToken->token,
                    'notification' => [
                        'title' => '🧭 今日の一歩',
                        'body' => $task ? "{$task->title} を始めませんか？" : '今日の一歩を確認しましょう',
                    ],
                ],
            ]);

        return $response->successful();
    }

    private function fetchAccessToken(string $credentialsPath): ?string
    {
        $credentials = json_decode(file_get_contents($credentialsPath), true);

        if (! is_array($credentials) || ! isset($credentials['private_key'], $credentials['client_email'])) {
            Log::warning('FCM credentials file is invalid.');

            return null;
        }

        $now = time();
        $assertion = JWT::encode([
            'iss' => $credentials['client_email'],
            'scope' => self::SCOPE,
            'aud' => self::TOKEN_URL,
            'iat' => $now,
            'exp' => $now + 3600,
        ], $credentials['private_key'], 'RS256');

        $response = Http::asForm()->post(self::TOKEN_URL, [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $assertion,
        ]);

        if (! $response->successful()) {
            Log::warning('Failed to fetch FCM access token.', ['status' => $response->status()]);

            return null;
        }

        return $response->json('access_token');
    }
}
