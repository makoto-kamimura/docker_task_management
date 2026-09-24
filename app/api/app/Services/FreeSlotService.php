<?php

namespace App\Services;

use App\Models\ScheduleBlock;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * 週間タイムテーブルの「隙間時間」を求める。
 *
 * 予定は 1 週間ぶんの型（曜日 × 時間帯）として登録され、同じ曜日で時間帯が重ならないことが
 * 保証されている。よって隙間 = 通知可能な時間帯から予定を引いた塗り残し、で一意に決まる。
 */
class FreeSlotService
{
    /**
     * 指定曜日の隙間時間を開始時刻順で返す。
     *
     * @return list<array{start_minute: int, end_minute: int, duration_minutes: int}>
     */
    public function forDay(User $user, int $dayOfWeek): array
    {
        $blocks = $user->scheduleBlocks()
            ->where('day_of_week', $dayOfWeek)
            ->orderBy('start_minute')
            ->get();

        return $this->gaps(
            $blocks,
            $user->reminder_window_start_minute,
            $user->reminder_window_end_minute,
            $user->reminder_min_gap_minutes,
        );
    }

    /**
     * 予定の塗り残しのうち、通知可能な時間帯に入っていて minGapMinutes 以上の長さのものを返す。
     *
     * 予定を 1 件も登録していない曜日は「通知可能な時間帯まるごと」が 1 つの隙間になる。
     *
     * @param  Collection<int, ScheduleBlock>  $blocks
     * @return list<array{start_minute: int, end_minute: int, duration_minutes: int}>
     */
    public function gaps(Collection $blocks, int $windowStart, int $windowEnd, int $minGapMinutes): array
    {
        $slots = [];
        $cursor = $windowStart;

        foreach ($blocks->sortBy('start_minute') as $block) {
            if ($block->start_minute >= $windowEnd) {
                break;
            }

            // 通知可能な時間帯より前に終わる予定は、隙間の計算に影響しない。
            if ($block->end_minute <= $cursor) {
                continue;
            }

            if ($block->start_minute > $cursor) {
                $slots[] = [$cursor, min($block->start_minute, $windowEnd)];
            }

            $cursor = $block->end_minute;

            if ($cursor >= $windowEnd) {
                break;
            }
        }

        if ($cursor < $windowEnd) {
            $slots[] = [$cursor, $windowEnd];
        }

        return collect($slots)
            ->map(fn (array $slot) => [
                'start_minute' => $slot[0],
                'end_minute' => $slot[1],
                'duration_minutes' => $slot[1] - $slot[0],
            ])
            ->filter(fn (array $slot) => $slot['duration_minutes'] >= $minGapMinutes)
            ->values()
            ->all();
    }
}
