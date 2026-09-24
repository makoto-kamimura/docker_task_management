<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Collection;

class ComparisonPairSelector
{
    private const POOL_SIZE = 10;

    /**
     * @param  list<array{0: int, 1: int}>  $excludePairs  セッション内でスキップ済みのペア（未整列可）
     * @return array{0: Task, 1: Task}|null
     */
    public function selectPair(User $user, array $excludePairs = []): ?array
    {
        $tasks = $user->tasks()
            ->where('status', 'active')
            ->whereNull('parent_id')
            ->withCount([
                'wonComparisons as won_count',
                'lostComparisons as lost_count',
            ])
            ->get();

        if ($tasks->count() < 2) {
            return null;
        }

        $tasks->each(function (Task $task) {
            $task->comparison_count = $task->won_count + $task->lost_count;
        });

        $pool = $tasks->sortBy('comparison_count')->take(self::POOL_SIZE);

        return $this->closestPairExcluding($pool, $excludePairs)
            ?? $this->closestPairExcluding($tasks, $excludePairs);
    }

    /**
     * やりたいことの優先度付けが確定したか。
     * active なルートの全ペアを一度でも比べていれば確定とみなす（Elo は 1 回の比較ごとに更新されるため、
     * 全ペアを 1 周した時点で順位は付いている）。ルートが 1 件以下なら比べようがないので確定扱い。
     */
    public function isRankingSettled(User $user): bool
    {
        $rootIds = $user->tasks()
            ->where('status', 'active')
            ->whereNull('parent_id')
            ->pluck('id');

        if ($rootIds->count() < 2) {
            return true;
        }

        $comparedPairs = $user->comparisons()
            ->whereIn('winner_task_id', $rootIds)
            ->whereIn('loser_task_id', $rootIds)
            ->get(['winner_task_id', 'loser_task_id'])
            ->map(fn ($comparison) => $comparison->winner_task_id < $comparison->loser_task_id
                ? "{$comparison->winner_task_id}-{$comparison->loser_task_id}"
                : "{$comparison->loser_task_id}-{$comparison->winner_task_id}")
            ->unique()
            ->count();

        $totalPairs = $rootIds->count() * ($rootIds->count() - 1) / 2;

        return $comparedPairs >= $totalPairs;
    }

    /**
     * @param  Collection<int, Task>  $candidates
     * @param  list<array{0: int, 1: int}>  $excludePairs
     * @return array{0: Task, 1: Task}|null
     */
    private function closestPairExcluding(Collection $candidates, array $excludePairs): ?array
    {
        $best = null;
        $bestGap = null;

        foreach ($candidates as $a) {
            foreach ($candidates as $b) {
                if ($a->id >= $b->id) {
                    continue;
                }
                if ($this->isExcluded($a->id, $b->id, $excludePairs)) {
                    continue;
                }

                $gap = abs($a->rating - $b->rating);

                if ($bestGap === null || $gap < $bestGap) {
                    $bestGap = $gap;
                    $best = [$a, $b];
                }
            }
        }

        return $best;
    }

    /**
     * @param  list<array{0: int, 1: int}>  $excludePairs
     */
    private function isExcluded(int $idA, int $idB, array $excludePairs): bool
    {
        foreach ($excludePairs as [$x, $y]) {
            if (($idA === $x && $idB === $y) || ($idA === $y && $idB === $x)) {
                return true;
            }
        }

        return false;
    }
}
