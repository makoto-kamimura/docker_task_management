<?php

namespace App\Console\Commands;

use App\Jobs\SendPushNotificationJob;
use App\Models\PushNotification;
use App\Models\User;
use App\Services\RecommendationScoreService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Date;

class DispatchDailyNotifications extends Command
{
    protected $signature = 'notifications:dispatch-daily';

    protected $description = '各ユーザーの通知時刻に「今日の一歩」通知を1日1回だけ生成・送信する';

    public function handle(RecommendationScoreService $recommendationScoreService): int
    {
        $now = Date::now(config('app.timezone'));
        $currentTime = $now->format('H:i:00');

        $users = User::query()
            ->whereTime('notification_time', $currentTime)
            ->get();

        foreach ($users as $user) {
            $alreadySentToday = PushNotification::query()
                ->where('user_id', $user->id)
                ->whereDate('scheduled_at', $now->toDateString())
                ->exists();

            if ($alreadySentToday) {
                continue;
            }

            $task = $recommendationScoreService->recommend($user);

            if ($task === null) {
                continue;
            }

            $notification = PushNotification::create([
                'user_id' => $user->id,
                'task_id' => $task->id,
                'scheduled_at' => $now,
            ]);

            SendPushNotificationJob::dispatch($notification);
        }

        return self::SUCCESS;
    }
}
