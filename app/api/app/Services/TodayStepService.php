<?php

namespace App\Services;

use App\Models\Task;
use App\Models\User;

/**
 * 隙間時間に実施する「今日の一歩」を 1 件決める。
 *
 * 利用フロー（design.md 8.2）のループをそのまま順番にする:
 *   実施できるやりたいこと → 無ければ二択で選ぶ → 優先度が確定していれば細分化 → どれも無ければ登録から
 */
class TodayStepService
{
    public function __construct(
        private readonly RecommendationScoreService $recommendationScoreService,
        private readonly ComparisonPairSelector $comparisonPairSelector,
    ) {
    }

    public function resolve(User $user): TodayStep
    {
        $task = $this->recommendationScoreService->recommend($user);

        if ($task !== null) {
            return TodayStep::task($task);
        }

        // 実施できる葉が無い。まだ優先順位が決まっていないなら、二択そのものを一歩にする。
        if (! $this->comparisonPairSelector->isRankingSettled($user)
            && $this->comparisonPairSelector->selectPair($user) !== null) {
            return TodayStep::compare();
        }

        $breakdownTarget = $this->breakdownTarget($user);

        if ($breakdownTarget !== null) {
            return TodayStep::breakdown($breakdownTarget);
        }

        return TodayStep::nothing();
    }

    /**
     * 細分化する対象。分解待ちのうち、優先度（ルートの rating）が高いツリーのものから選ぶ。
     * 同じツリーの中では浅い＝大きな単位から分けたほうが進めやすいので、深さの浅い順・id 昇順。
     */
    private function breakdownTarget(User $user): ?Task
    {
        $tasks = $user->tasks()->where('status', 'active')->get();
        $pending = $tasks->where('needs_breakdown', true);

        if ($pending->isEmpty()) {
            return null;
        }

        $byId = $tasks->keyBy('id');

        return $pending
            ->sortBy([
                fn (Task $a, Task $b) => $this->rootRating($b, $byId) <=> $this->rootRating($a, $byId),
                fn (Task $a, Task $b) => $this->depth($a, $byId) <=> $this->depth($b, $byId),
                fn (Task $a, Task $b) => $a->id <=> $b->id,
            ])
            ->first();
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Task>  $byId
     */
    private function rootRating(Task $task, $byId): float
    {
        return (float) $this->root($task, $byId)->rating;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Task>  $byId
     */
    private function depth(Task $task, $byId): int
    {
        $depth = 1;
        $current = $task;

        while ($current->parent_id !== null && $byId->has($current->parent_id)) {
            $current = $byId->get($current->parent_id);
            $depth++;
        }

        return $depth;
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Task>  $byId
     */
    private function root(Task $task, $byId): Task
    {
        $current = $task;

        while ($current->parent_id !== null && $byId->has($current->parent_id)) {
            $current = $byId->get($current->parent_id);
        }

        return $current;
    }
}
