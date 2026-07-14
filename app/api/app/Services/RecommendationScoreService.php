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
     * 今日の一歩を1件返す。activeタスクが0〜1件の場合は null。
     */
    public function recommend(User $user): ?Task
    {
        $tasks = $user->tasks()->where('status', 'active')->get();

        if ($tasks->count() < 2) {
            return $tasks->first();
        }

        [$minRating, $maxRating] = $this->ratingRange($tasks);

        return $tasks
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
            ->first()['task'];
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
