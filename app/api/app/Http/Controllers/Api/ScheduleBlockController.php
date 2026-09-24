<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreScheduleBlockRequest;
use App\Http\Requests\UpdateScheduleBlockRequest;
use App\Http\Resources\ScheduleBlockResource;
use App\Models\ScheduleBlock;
use App\Services\FreeSlotService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ScheduleBlockController extends Controller
{
    /**
     * 週間タイムテーブルを返す。
     * 既定は 1 週間ぶん全件（曜日 → 開始時刻の順）。`?day_of_week=0〜6` で 1 曜日に絞れる。
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'day_of_week' => ['sometimes', 'integer', 'min:0', 'max:'.ScheduleBlock::LAST_DAY_OF_WEEK],
        ]);

        $blocks = $request->user()->scheduleBlocks()
            ->when(
                isset($validated['day_of_week']),
                fn ($query) => $query->where('day_of_week', $validated['day_of_week']),
            )
            ->orderBy('day_of_week')
            ->orderBy('start_minute')
            ->get();

        return ScheduleBlockResource::collection($blocks);
    }

    /**
     * 指定曜日（既定は今日）の隙間時間。リマインダーが飛ぶ時間帯そのもの。
     */
    public function freeSlots(Request $request, FreeSlotService $freeSlotService)
    {
        $validated = $request->validate([
            'day_of_week' => ['sometimes', 'integer', 'min:0', 'max:'.ScheduleBlock::LAST_DAY_OF_WEEK],
        ]);

        $user = $request->user();
        // クエリ文字列は文字列で届くので、レスポンスに載せる前に数値へ揃える。
        $dayOfWeek = isset($validated['day_of_week'])
            ? (int) $validated['day_of_week']
            : now(config('app.timezone'))->dayOfWeek;

        return response()->json([
            'data' => [
                'day_of_week' => $dayOfWeek,
                'min_gap_minutes' => $user->reminder_min_gap_minutes,
                'window_start_minute' => $user->reminder_window_start_minute,
                'window_end_minute' => $user->reminder_window_end_minute,
                'slots' => $freeSlotService->forDay($user, $dayOfWeek),
            ],
        ]);
    }

    public function store(StoreScheduleBlockRequest $request)
    {
        $block = $request->user()->scheduleBlocks()->create([
            'title' => $request->validated('title'),
            'day_of_week' => $request->validated('day_of_week'),
            'start_minute' => $request->validated('start_minute'),
            'end_minute' => $request->validated('end_minute'),
            'task_id' => $request->validated('task_id'),
            'notify_at_start' => $request->validated('notify_at_start', false),
        ])->refresh();

        return ScheduleBlockResource::make($block)->response()->setStatusCode(201);
    }

    public function update(UpdateScheduleBlockRequest $request, ScheduleBlock $scheduleBlock)
    {
        $scheduleBlock->update($request->validated());

        return ScheduleBlockResource::make($scheduleBlock);
    }

    public function destroy(ScheduleBlock $scheduleBlock)
    {
        Gate::authorize('delete', $scheduleBlock);

        $scheduleBlock->delete();

        return response()->noContent();
    }
}
