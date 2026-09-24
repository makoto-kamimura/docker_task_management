<?php

namespace App\Console\Commands;

use App\Jobs\SendPushNotificationJob;
use App\Models\PushNotification;
use App\Models\User;
use App\Services\FreeSlotService;
use App\Services\TodayStepService;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Date;

class DispatchFreeSlotNotifications extends Command
{
    protected $signature = 'notifications:dispatch-free-slots';

    protected $description = '週間タイムテーブルの隙間時間が始まるたびに「今日の一歩」通知を生成・送信する';

    public function handle(
        FreeSlotService $freeSlotService,
        TodayStepService $todayStepService,
    ): int {
        $now = Date::now(config('app.timezone'))->startOfMinute();
        $minuteOfDay = $now->hour * 60 + $now->minute;
        $dayOfWeek = $now->dayOfWeek;

        // 通知可能な時間帯の外にいるユーザーは、隙間を計算するまでもなく対象外。
        User::query()
            ->where('reminder_window_start_minute', '<=', $minuteOfDay)
            ->where('reminder_window_end_minute', '>', $minuteOfDay)
            ->chunkById(100, function (Collection $users) use (
                $freeSlotService,
                $todayStepService,
                $now,
                $minuteOfDay,
                $dayOfWeek,
            ) {
                foreach ($users as $user) {
                    $this->dispatchFor(
                        $user,
                        $freeSlotService,
                        $todayStepService,
                        $now,
                        $minuteOfDay,
                        $dayOfWeek,
                    );
                }
            });

        return self::SUCCESS;
    }

    private function dispatchFor(
        User $user,
        FreeSlotService $freeSlotService,
        TodayStepService $todayStepService,
        Carbon $now,
        int $minuteOfDay,
        int $dayOfWeek,
    ): void {
        $slots = $freeSlotService->forDay($user, $dayOfWeek);

        // 隙間が始まるちょうどその分だけ声をかける。途中の分では鳴らさない。
        $startsNow = collect($slots)->contains(fn (array $slot) => $slot['start_minute'] === $minuteOfDay);

        if (! $startsNow) {
            return;
        }

        // スケジューラの二重起動やリトライで同じ隙間に 2 通送らないようにする。
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
