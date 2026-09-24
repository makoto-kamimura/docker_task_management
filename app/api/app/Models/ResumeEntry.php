<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * 履歴書の学歴・職歴・免許資格の 1 行。
 * current = 今の履歴書、future = なりたい将来の履歴書。将来の行は「やりたいこと」のルートタスクと結ぶ。
 */
class ResumeEntry extends Model
{
    /** @use HasFactory<\Database\Factories\ResumeEntryFactory> */
    use HasFactory;

    public const TIMELINES = ['current', 'future'];

    public const KINDS = ['education', 'work', 'license'];

    protected $fillable = [
        'task_id',
        'timeline',
        'kind',
        'year',
        'month',
        'content',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'month' => 'integer',
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

    public function isFuture(): bool
    {
        return $this->timeline === 'future';
    }

    /** 履歴書に書く順（年月の古い順。月が未入力の行はその年の先頭に置く）。 */
    public function scopeChronological(Builder $query): Builder
    {
        return $query->orderBy('year')->orderByRaw('COALESCE(month, 0)')->orderBy('id');
    }
}
