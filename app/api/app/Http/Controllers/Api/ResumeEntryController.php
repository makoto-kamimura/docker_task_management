<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreResumeEntryRequest;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateResumeEntryRequest;
use App\Http\Resources\ResumeEntryResource;
use App\Models\ResumeEntry;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

/**
 * 履歴書の行。将来の行は登録と同時に同名の「やりたいこと」（ルートタスク）を作り、
 * 必要なタスクはそのツリーの子として分解していく（二択比較・今日の一歩にもそのまま乗る）。
 */
class ResumeEntryController extends Controller
{
    public function store(StoreResumeEntryRequest $request)
    {
        $entry = DB::transaction(function () use ($request) {
            $user = $request->user();
            $attributes = $request->validated();

            if ($attributes['timeline'] === 'future') {
                $attributes['task_id'] = $user->tasks()->create(['title' => $attributes['content']])->id;
            }

            return $user->resumeEntries()->create($attributes);
        });

        return ResumeEntryResource::make($entry->refresh())->response()->setStatusCode(201);
    }

    /** 中身を直す。将来の行の文言を変えたら、結んだタスクの名前もそろえる。 */
    public function update(UpdateResumeEntryRequest $request, ResumeEntry $resumeEntry)
    {
        DB::transaction(function () use ($request, $resumeEntry) {
            $resumeEntry->update($request->validated());

            if ($resumeEntry->wasChanged('content') && $resumeEntry->task !== null) {
                $resumeEntry->task->update(['title' => $resumeEntry->content]);
            }
        });

        return ResumeEntryResource::make($resumeEntry);
    }

    /**
     * 将来の行を達成した → 今の履歴書へ移す。結んだタスクはやり終えたので archived にし、
     * ランキングや今日の一歩の候補から外す（ツリーと実施記録は残る）。
     */
    public function achieve(ResumeEntry $resumeEntry)
    {
        Gate::authorize('update', $resumeEntry);

        if (! $resumeEntry->isFuture()) {
            throw ValidationException::withMessages(['timeline' => 'この項目はすでに今の履歴書にあります。']);
        }

        DB::transaction(function () use ($resumeEntry) {
            $resumeEntry->update(['timeline' => 'current']);
            $resumeEntry->task?->update(['status' => 'archived']);
        });

        return ResumeEntryResource::make($resumeEntry->refresh());
    }

    /** タスクを消してしまった将来の行に、もう一度「やりたいこと」を作って結び直す。 */
    public function createTask(ResumeEntry $resumeEntry)
    {
        Gate::authorize('update', $resumeEntry);

        if (! $resumeEntry->isFuture() || $resumeEntry->task_id !== null) {
            throw ValidationException::withMessages(['task_id' => 'この項目にはやりたいことを追加できません。']);
        }

        $user = $resumeEntry->user;
        if ($user->hasReachedRootTaskLimit()) {
            throw ValidationException::withMessages(['task_id' => StoreTaskRequest::rootLimitMessage()]);
        }

        DB::transaction(function () use ($resumeEntry, $user) {
            $task = $user->tasks()->create(['title' => $resumeEntry->content]);
            $resumeEntry->update(['task_id' => $task->id]);
        });

        return ResumeEntryResource::make($resumeEntry->refresh());
    }

    /** 行だけを消す。結んだ「やりたいこと」は、目標として続けたい場合もあるので残す。 */
    public function destroy(ResumeEntry $resumeEntry)
    {
        Gate::authorize('delete', $resumeEntry);

        $resumeEntry->delete();

        return response()->noContent();
    }
}
