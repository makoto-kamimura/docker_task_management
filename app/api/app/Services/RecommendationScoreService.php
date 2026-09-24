<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class RecommendationScoreService
{
    private const WEIGHT_RATING = 0.5;
    private const WEIGHT_RECENCY = 0.2;
    private const WEIGHT_DEADLINE = 0.3;

    private const RECENCY_CAP_DAYS = 14;

    private const DEADLINE_BONUS = [
        'today' => 1.0,
        'week' => 0.6,
        'month' => 0.3,
        'none' => 0.0,
    ];

    /**
     * 今日の一歩を1件返す。
     * スコアリングはルート（やりたいこと）単位で行い、選ばれたルートの
     * ツリーをたどって葉（Leaf Node）を「今日の一歩」として返す。
     * 分解待ち（needs_breakdown）の葉しかないルートはスキップし、次点のルートから選ぶ。
     */
    public function recommend(User $user): ?Task
    {
        $tasks = $user->tasks()->where('status', 'active')->get();
        $roots = $tasks->whereNull('parent_id')->values();

        if ($roots->isEmpty()) {
            return null;
        }

        [$minRating, $maxRating] = $this->ratingRange($roots);

        $orderedRoots = $roots
            ->map(fn (Task $task) => [
                'task' => $task,
                'score' => $this->score($task, $minRating, $maxRating),
            ])
            ->sort(function (array $a, array $b) {
                if ($a['score'] === $b['score']) {
                    return $b['task']->rating <=> $a['task']->rating;
                }

                return $b['score'] <=> $a['score'];
            })
            ->map(fn (array $entry) => $entry['task']);

        foreach ($orderedRoots as $root) {
            $step = $this->todayStep($root, $tasks);

            if ($step !== null) {
                return $step;
            }
        }

        return null;
    }

    /**
     * ルート配下の葉から「今日の一歩」を1件選ぶ。
     * 分解待ち（needs_breakdown）の葉は候補から外す。
     * 未実施（last_done_at が null）を優先し、次に実施が古い順。同点は id 昇順。
     *
     * @param  Collection<int, Task>  $tasks  ユーザーの active タスク全件
     */
    private function todayStep(Task $root, Collection $tasks): ?Task
    {
        $childrenByParent = $tasks->whereNotNull('parent_id')->groupBy('parent_id');

        $leaves = collect();
        $frontier = [$root];

        while ($frontier !== []) {
            $node = array_pop($frontier);
            $children = $childrenByParent->get($node->id, collect());

            if ($children->isEmpty()) {
                $leaves->push($node);
            } else {
                foreach ($children as $child) {
                    $frontier[] = $child;
                }
            }
        }

        return $leaves
            ->reject(fn (Task $leaf) => $leaf->needs_breakdown)
            ->sortBy([
                fn (Task $a, Task $b) => ($a->last_done_at === null ? 0 : 1) <=> ($b->last_done_at === null ? 0 : 1),
                fn (Task $a, Task $b) => ($a->last_done_at?->getTimestamp() ?? 0) <=> ($b->last_done_at?->getTimestamp() ?? 0),
                fn (Task $a, Task $b) => $a->id <=> $b->id,
            ])
            ->first();
    }

    private function score(Task $task, float $minRating, float $maxRating): float
    {
        return self::WEIGHT_RATING * $this->normalizedRating($task->rating, $minRating, $maxRating)
            + self::WEIGHT_RECENCY * $this->recencyBonus($task->last_done_at)
            + self::WEIGHT_DEADLINE * (self::DEADLINE_BONUS[$task->deadline_type] ?? 0.0);
    }

    private function normalizedRating(float $rating, float $min, float $max): float
    {
        if ($max <= $min) {
            return 1.0;
        }

        return ($rating - $min) / ($max - $min);
    }

    private function recencyBonus(?Carbon $lastDoneAt): float
    {
        if ($lastDoneAt === null) {
            return 1.0;
        }

        $daysSince = $lastDoneAt->diffInDays(now());

        return min($daysSince, self::RECENCY_CAP_DAYS) / self::RECENCY_CAP_DAYS;
    }

    /**
     * @param  Collection<int, Task>  $tasks
     * @return array{0: float, 1: float}
     */
    private function ratingRange(Collection $tasks): array
    {
        return [
            (float) $tasks->min('rating'),
            (float) $tasks->max('rating'),
        ];
    }
}
