<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateReminderSettingRequest;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * 隙間時間リマインダーの絞り込み条件。
 * 「どれくらい空いていたら声をかけるか」「何時から何時までなら声をかけてよいか」だけを持つ。
 */
class ReminderSettingController extends Controller
{
    public function show(Request $request)
    {
        return response()->json(['data' => $this->payload($request->user())]);
    }

    public function update(UpdateReminderSettingRequest $request)
    {
        $user = $request->user();
        $user->update($request->validated());

        return response()->json(['data' => $this->payload($user)]);
    }

    private function payload(User $user): array
    {
        return [
            'reminder_min_gap_minutes' => $user->reminder_min_gap_minutes,
            'reminder_window_start_minute' => $user->reminder_window_start_minute,
            'reminder_window_end_minute' => $user->reminder_window_end_minute,
        ];
    }
}
