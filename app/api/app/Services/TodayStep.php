<?php

namespace App\Services;

use App\Models\Task;

/**
 * 今日の一歩 1 件。kind によって task の意味が変わる。
 * - task      : 実施する葉タスク
 * - breakdown : 細分化する対象のタスク
 * - compare   : タスクを伴わない（null）
 * - empty     : 同上
 */
readonly class TodayStep
{
    public function __construct(
        public TodayStepKind $kind,
        public ?Task $task = null,
    ) {
    }

    public static function task(Task $task): self
    {
        return new self(TodayStepKind::Task, $task);
    }

    public static function compare(): self
    {
        return new self(TodayStepKind::Compare);
    }

    public static function breakdown(Task $task): self
    {
        return new self(TodayStepKind::Breakdown, $task);
    }

    public static function nothing(): self
    {
        return new self(TodayStepKind::Nothing);
    }

    /** 通知を送る価値があるか。やりたいことが無いときだけ黙る。 */
    public function isActionable(): bool
    {
        return $this->kind !== TodayStepKind::Nothing;
    }

    /**
     * ルートから task の親までのパンくず。
     *
     * @return list<array{id: int, title: string}>
     */
    public function path(): array
    {
        if ($this->task === null) {
            return [];
        }

        return array_map(
            fn ($ancestor) => ['id' => $ancestor->id, 'title' => $ancestor->title],
            $this->task->ancestors(),
        );
    }
}
