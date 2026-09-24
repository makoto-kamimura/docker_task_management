<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleBlock extends Model
{
    /** @use HasFactory<\Database\Factories\ScheduleBlockFactory> */
    use HasFactory;

    /** 1日の分数。end_minute は 24:00 = 1440 を取りうる。 */
    public const MINUTES_PER_DAY = 1440;

    /** day_of_week の上限。0=日 〜 6=土（Carbon::dayOfWeek / JS Date#getDay と同じ並び）。 */
    public const LAST_DAY_OF_WEEK = 6;

    /** day_of_week の表示名。0 始まりで並べる。 */
    public const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

    protected $fillable = [
        'user_id',
        'task_id',
        'title',
        'day_of_week',
        'start_minute',
        'end_minute',
        'notify_at_start',
    ];

    protected function casts(): array
    {
        return [
            'day_of_week' => 'integer',
            'start_minute' => 'integer',
            'end_minute' => 'integer',
            'notify_at_start' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function durationMinutes(): int
    {
        return $this->end_minute - $this->start_minute;
    }
}
