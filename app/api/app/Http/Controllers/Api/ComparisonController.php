<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreComparisonRequest;
use App\Http\Resources\TaskResource;
use App\Models\Comparison;
use App\Models\Task;
use App\Services\ComparisonPairSelector;
use App\Services\EloRatingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ComparisonController extends Controller
{
    public function __construct(
        private readonly ComparisonPairSelector $pairSelector,
        private readonly EloRatingService $eloRatingService,
    ) {
    }

    public function next(Request $request)
    {
        $excludePairs = $this->parseExcludePairs($request->query('exclude', []));

        $pair = $this->pairSelector->selectPair($request->user(), $excludePairs);

        if ($pair === null) {
            return response()->json(['data' => null]);
        }

        return response()->json([
            'data' => [
                'left' => TaskResource::make($pair[0]),
                'right' => TaskResource::make($pair[1]),
            ],
        ]);
    }

    public function store(StoreComparisonRequest $request)
    {
        $user = $request->user();

        $winner = Task::findOrFail($request->validated('winner_task_id'));
        $loser = Task::findOrFail($request->validated('loser_task_id'));

        DB::transaction(function () use ($user, $winner, $loser) {
            $winnerPriorComparisons = $winner->wonComparisons()->count() + $winner->lostComparisons()->count();
            $loserPriorComparisons = $loser->wonComparisons()->count() + $loser->lostComparisons()->count();

            $result = $this->eloRatingService->update(
                winnerRating: $winner->rating,
                loserRating: $loser->rating,
                winnerPriorComparisons: $winnerPriorComparisons,
                loserPriorComparisons: $loserPriorComparisons,
            );

            $winner->update(['rating' => $result['winner']]);
            $loser->update(['rating' => $result['loser']]);

            Comparison::create([
                'user_id' => $user->id,
                'winner_task_id' => $winner->id,
                'loser_task_id' => $loser->id,
                'compared_at' => now(),
            ]);
        });

        return response()->json(null, 201);
    }

    /**
     * @param  list<string>  $rawPairs  "taskIdA_taskIdB" 形式の配列
     * @return list<array{0: int, 1: int}>
     */
    private function parseExcludePairs(array $rawPairs): array
    {
        $pairs = [];

        foreach ($rawPairs as $raw) {
            if (! is_string($raw) || ! preg_match('/^(\d+)_(\d+)$/', $raw, $matches)) {
                continue;
            }
            $pairs[] = [(int) $matches[1], (int) $matches[2]];
        }

        return $pairs;
    }
}
