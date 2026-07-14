<?php

namespace App\Services\Push;

use App\Models\DeviceToken;
use App\Models\PushNotification;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ApnsSender implements PushNotificationSenderInterface
{
    public function send(DeviceToken $deviceToken, PushNotification $notification): bool
    {
        $keyId = config('push.apns.key_id');
        $teamId = config('push.apns.team_id');
        $bundleId = config('push.apns.bundle_id');
        $privateKeyPath = config('push.apns.private_key_path');

        if (! $keyId || ! $teamId || ! $bundleId || ! $privateKeyPath || ! is_readable($privateKeyPath)) {
            Log::info('APNs is not configured; skipping push send.', ['device_token_id' => $deviceToken->id]);

            return false;
        }

        $jwt = $this->buildProviderToken($keyId, $teamId, $privateKeyPath);
        $host = config('push.apns.production')
            ? 'https://api.push.apple.com'
            : 'https://api.sandbox.push.apple.com';

        $task = $notification->task;

        $response = Http::withToken($jwt)
            ->withHeaders([
                'apns-topic' => $bundleId,
                'apns-push-type' => 'alert',
                'apns-priority' => '10',
            ])
            ->post("{$host}/3/device/{$deviceToken->token}", [
                'aps' => [
                    'alert' => [
                        'title' => '🧭 今日の一歩',
                        'body' => $task ? "{$task->title} を始めませんか？" : '今日の一歩を確認しましょう',
                    ],
                    'category' => 'TODAY_COMPASS',
                    'sound' => 'default',
                ],
            ]);

        return $response->successful();
    }

    private function buildProviderToken(string $keyId, string $teamId, string $privateKeyPath): string
    {
        $privateKey = file_get_contents($privateKeyPath);

        return JWT::encode([
            'iss' => $teamId,
            'iat' => time(),
        ], $privateKey, 'ES256', $keyId);
    }
}
