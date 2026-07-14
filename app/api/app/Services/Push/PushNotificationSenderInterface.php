<?php

namespace App\Services\Push;

use App\Models\DeviceToken;
use App\Models\PushNotification;

interface PushNotificationSenderInterface
{
    public function send(DeviceToken $deviceToken, PushNotification $notification): bool;
}
