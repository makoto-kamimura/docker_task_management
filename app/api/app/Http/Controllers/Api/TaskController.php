<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TaskController extends Controller
{
    /**
     * デフォルトはルート（やりたいこと）のみ。?scope=all でサブタスクを含む全件を返す。
     */
    public function index(Request $request)
    {
        $tasks = $request->user()->tasks()
            ->where('status', 'active')
            ->when($request->query('scope') !== 'all', fn ($query) => $query->whereNull('parent_id'))
            ->orderByDesc('rating')
            ->get();

        return TaskResource::collection($tasks);
    }

    public function store(StoreTaskRequest $request)
    {
        $task = $request->user()->tasks()->create([
            'title' => $request->validated('title'),
            'parent_id' => $request->validated('parent_id'),
        ])->refresh();

        return TaskResource::make($task)->response()->setStatusCode(201);
    }

    public function update(UpdateTaskRequest $request, Task $task)
    {
        $task->update($request->validated());

        return TaskResource::make($task);
    }

    public function destroy(Task $task)
    {
        Gate::authorize('delete', $task);

        $task->delete();

        return response()->noContent();
    }
}
