<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TaskResource;
use App\Services\TodayStepService;
use Illuminate\Http\Request;

class CompassController extends Controller
{
    public function __construct(
        private readonly TodayStepService $todayStepService,
    ) {
    }

    public function today(Request $request)
    {
        $step = $this->todayStepService->resolve($request->user());

        return response()->json([
            // 実施できる一歩が無いときに何をするか（task / compare / breakdown / empty）。
            'kind' => $step->kind->value,
            'data' => $step->task ? TaskResource::make($step->task) : null,
            'path' => $step->path(),
        ]);
    }
}
