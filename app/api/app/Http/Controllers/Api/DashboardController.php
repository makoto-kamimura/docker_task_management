<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Services\DashboardService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private readonly DashboardService $dashboardService,
    ) {
    }

    public function index(Request $request)
    {
        $summary = $this->dashboardService->summary($request->user());

        return response()->json([
            'data' => [
                'today_recommendation' => $summary['today_recommendation']
                    ? TaskResource::make($summary['today_recommendation'])
                    : null,
                'top_tasks' => TaskResource::collection($summary['top_tasks']),
                'completed_this_week' => $summary['completed_this_week'],
                'comparison_count' => $summary['comparison_count'],
                'streak_days' => $summary['streak_days'],
            ],
        ]);
    }
}
