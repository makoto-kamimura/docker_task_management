<?php

namespace App\Services;

use App\Models\TaskLog;
use App\Models\User;
use Illuminate\Support\Carbon;

class DashboardService
{
    public function __construct(
        private readonly RecommendationScoreService $recommendationScoreService,
    ) {
    }

    public function summary(User $user): array
    {
        return [
            'today_recommendation' => $this->recommendationScoreService->recommend($user),
            'top_tasks' => $user->tasks()
                ->where('status', 'active')
                ->orderByDesc('rating')
                ->limit(10)
                ->get(),
            'completed_this_week' => $this->completedThisWeekCount($user),
            'comparison_count' => $user->comparisons()->count(),
            'streak_days' => $this->streakDays($user),
        ];
    }

    private function completedThisWeekCount(User $user): int
    {
        return TaskLog::query()
            ->whereHas('task', fn ($query) => $query->where('user_id', $user->id))
            ->where('result', 'done')
            ->whereBetween('finished_at', [now()->startOfWeek(), now()->endOfWeek()])
            ->count();
    }

    private function streakDays(User $user): int
    {
        $dates = TaskLog::query()
            ->whereHas('task', fn ($query) => $query->where('user_id', $user->id))
            ->whereIn('result', ['done', 'partial'])
            ->get()
            ->map(fn (TaskLog $log) => ($log->finished_at ?? $log->started_at)
                ->timezone(config('app.timezone'))
                ->toDateString())
            ->unique()
            ->sortDesc()
            ->values();

        if ($dates->isEmpty()) {
            return 0;
        }

        $today = Carbon::now(config('app.timezone'))->toDateString();
        $yesterday = Carbon::now(config('app.timezone'))->subDay()->toDateString();

        if ($dates->first() !== $today && $dates->first() !== $yesterday) {
            return 0;
        }

        $streak = 0;
        $cursor = Carbon::parse($dates->first());

        foreach ($dates as $date) {
            if ($date === $cursor->toDateString()) {
                $streak++;
                $cursor->subDay();
            } else {
                break;
            }
        }

        return $streak;
    }
}
