<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Services\RecommendationScoreService;
use Illuminate\Http\Request;

class CompassController extends Controller
{
    public function __construct(
        private readonly RecommendationScoreService $recommendationScoreService,
    ) {
    }

    public function today(Request $request)
    {
        $task = $this->recommendationScoreService->recommend($request->user());

        return response()->json([
            'data' => $task ? TaskResource::make($task) : null,
        ]);
    }
}
