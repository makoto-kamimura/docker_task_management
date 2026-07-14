<?php

namespace App\Jobs;

use App\Models\PushNotification;
use App\Services\Push\PushNotificationDispatcher;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendPushNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly PushNotification $notification,
    ) {
    }

    public function handle(PushNotificationDispatcher $dispatcher): void
    {
        $dispatcher->send($this->notification);
    }
}
