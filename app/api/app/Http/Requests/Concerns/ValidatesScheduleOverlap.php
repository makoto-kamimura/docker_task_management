<?php

namespace App\Http\Requests\Concerns;

use App\Models\ScheduleBlock;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;

trait ValidatesScheduleOverlap
{
    /**
     * 同じ曜日の他の予定と時間帯が重なっていないか検証する。
     * 円グラフは 24 時間を隙間なく塗り分け、塗り残しをそのまま隙間時間として扱うため、
     * 重複した予定は表現できない。
     */
    protected function validateNoOverlap(
        ValidatorContract $validator,
        int $dayOfWeek,
        int $startMinute,
        int $endMinute,
        ?int $ignoreId = null,
    ): void {
        $overlapping = $this->user()->scheduleBlocks()
            ->where('day_of_week', $dayOfWeek)
            ->when($ignoreId !== null, fn ($query) => $query->whereKeyNot($ignoreId))
            ->where('start_minute', '<', $endMinute)
            ->where('end_minute', '>', $startMinute)
            ->first();

        if ($overlapping instanceof ScheduleBlock) {
            $validator->errors()->add(
                'start_minute',
                ScheduleBlock::DAY_LABELS[$dayOfWeek]."曜の「{$overlapping->title}」（"
                .self::formatMinute($overlapping->start_minute)
                .'〜'.self::formatMinute($overlapping->end_minute).'）と時間が重なっています。',
            );
        }
    }

    private static function formatMinute(int $minute): string
    {
        return sprintf('%d:%02d', intdiv($minute, 60), $minute % 60);
    }
}
