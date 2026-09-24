<?php

namespace App\Console\Commands;

use App\Jobs\SendPushNotificationJob;
use App\Models\PushNotification;
use App\Models\ScheduleBlock;
use App\Models\User;
use App\Services\TodayStepService;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Date;

class DispatchScheduleStartNotifications extends Command
{
    protected $signature = 'notifications:dispatch-schedule-starts';

    protected $description = '「スキマ」に指定した予定の開始時刻に「今日の一歩」通知を生成・送信する';

    public function handle(TodayStepService $todayStepService): int
    {
        $now = Date::now(config('app.timezone'))->startOfMinute();
        $minuteOfDay = $now->hour * 60 + $now->minute;

        // 自動で求める隙間時間と違い、こちらはユーザーが自分で「ここに通知して」と指定した枠。
        // 指定を尊重したいので、通知してよい時間帯（reminder_window_*）では絞り込まない。
        ScheduleBlock::query()
            ->with('user')
            ->where('day_of_week', $now->dayOfWeek)
            ->where('start_minute', $minuteOfDay)
            ->where('notify_at_start', true)
            ->chunkById(100, function (Collection $blocks) use ($todayStepService, $now) {
                foreach ($blocks as $block) {
                    if ($block->user === null) {
                        continue;
                    }

                    $this->dispatchFor($block->user, $todayStepService, $now);
                }
            });

        return self::SUCCESS;
    }

    private function dispatchFor(
        User $user,
        TodayStepService $todayStepService,
        Carbon $now,
    ): void {
        // 同じ分に複数の枠が始まっても、隙間時間の通知と重なっても、1 通だけにする。
        $alreadySent = PushNotification::query()
            ->where('user_id', $user->id)
            ->whereDate('scheduled_at', $now->toDateString())
            ->whereTime('scheduled_at', $now->format('H:i:s'))
            ->exists();

        if ($alreadySent) {
            return;
        }

        // 実施できるやりたいことが無くても、二択・細分化を今日の一歩として声をかける。
        $step = $todayStepService->resolve($user);

        if (! $step->isActionable()) {
            return;
        }

        $notification = PushNotification::create([
            'user_id' => $user->id,
            'task_id' => $step->task?->id,
            'kind' => $step->kind->value,
            'scheduled_at' => $now,
        ]);

        SendPushNotificationJob::dispatch($notification);
    }
}
