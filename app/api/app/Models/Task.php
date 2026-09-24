<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Task extends Model
{
    /** @use HasFactory<\Database\Factories\TaskFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'parent_id',
        'title',
        'duration_minutes',
        'deadline_type',
        'rating',
        'status',
        'needs_breakdown',
        'last_done_at',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'double',
            'needs_breakdown' => 'boolean',
            'last_done_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function isRoot(): bool
    {
        return $this->parent_id === null;
    }

    /**
     * ルートからこのタスクの親までの祖先（ルートが先頭）。
     *
     * @return list<Task>
     */
    public function ancestors(): array
    {
        $ancestors = [];
        $current = $this->parent;

        while ($current !== null) {
            array_unshift($ancestors, $current);
            $current = $current->parent;
        }

        return $ancestors;
    }

    /**
     * ルートを深さ1としたときの深さ。
     */
    public function depth(): int
    {
        return count($this->ancestors()) + 1;
    }

    /**
     * 子孫タスクの ID 一覧（幅優先）。
     *
     * @return list<int>
     */
    public function descendantIds(): array
    {
        $ids = [];
        $frontier = [$this->id];

        while ($frontier !== []) {
            $frontier = self::query()
                ->whereIn('parent_id', $frontier)
                ->pluck('id')
                ->all();
            $ids = array_merge($ids, $frontier);
        }

        return $ids;
    }

    /** このタスクを目標として持つ将来の履歴書の行（ルートタスクのみ結ばれる）。 */
    public function resumeEntry(): HasOne
    {
        return $this->hasOne(ResumeEntry::class);
    }

    public function taskLogs(): HasMany
    {
        return $this->hasMany(TaskLog::class);
    }

    public function wonComparisons(): HasMany
    {
        return $this->hasMany(Comparison::class, 'winner_task_id');
    }

    public function lostComparisons(): HasMany
    {
        return $this->hasMany(Comparison::class, 'loser_task_id');
    }
}
