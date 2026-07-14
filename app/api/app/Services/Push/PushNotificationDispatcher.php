<?php

namespace App\Services\Push;

use App\Models\PushNotification;

class PushNotificationDispatcher
{
    public function __construct(
        private readonly ApnsSender $apnsSender,
        private readonly FcmSender $fcmSender,
    ) {
    }

    public function send(PushNotification $notification): void
    {
        $user = $notification->user;
        $deviceTokens = $user->deviceTokens;

        $delivered = false;

        foreach ($deviceTokens as $deviceToken) {
            $sender = $this->senderFor($deviceToken->platform);
            $sent = $sender->send($deviceToken, $notification);
            $delivered = $delivered || $sent;
        }

        if ($delivered) {
            $notification->update(['delivered_at' => now()]);
        }
    }

    private function senderFor(string $platform): PushNotificationSenderInterface
    {
        return match ($platform) {
            'ios', 'watchos' => $this->apnsSender,
            'android' => $this->fcmSender,
        };
    }
}
