<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskLogRequest;
use App\Http\Resources\TaskLogResource;
use App\Models\Task;
use App\Models\TaskLog;
use Illuminate\Support\Facades\DB;

class TaskLogController extends Controller
{
    public function store(StoreTaskLogRequest $request)
    {
        $taskLog = DB::transaction(function () use ($request) {
            $task = Task::findOrFail($request->validated('task_id'));

            $taskLog = TaskLog::create([
                'task_id' => $task->id,
                'started_at' => $request->validated('started_at'),
                'finished_at' => now(),
                'result' => $request->validated('result'),
                'elapsed_seconds' => $request->validated('elapsed_seconds'),
                'source' => $request->validated('source'),
            ]);

            if (in_array($request->validated('result'), ['done', 'partial'], true)) {
                $task->update(['last_done_at' => now()]);
            }

            return $taskLog;
        });

        return TaskLogResource::make($taskLog->refresh())->response()->setStatusCode(201);
    }
}
