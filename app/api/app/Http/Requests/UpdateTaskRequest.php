<?php

namespace App\Http\Requests;

use App\Models\Task;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('task'));
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:200'],
            'duration_minutes' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:65535'],
            'deadline_type' => ['sometimes', Rule::in(['today', 'week', 'month', 'none'])],
            'status' => ['sometimes', Rule::in(['active', 'archived'])],
            'needs_breakdown' => ['sometimes', 'boolean'],
            'parent_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('tasks', 'id')->where('user_id', $this->user()->id),
            ],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            if ($validator->errors()->isNotEmpty() || !$this->has('parent_id')) {
                return;
            }

            $parentId = $this->input('parent_id');

            if ($parentId === null) {
                return;
            }

            /** @var Task $task */
            $task = $this->route('task');

            if ((int) $parentId === $task->id || in_array((int) $parentId, $task->descendantIds(), true)) {
                $validator->errors()->add('parent_id', '自分自身または子孫タスクを親にはできません。');

                return;
            }

            $parent = Task::query()->find($parentId);

            if ($parent !== null && $parent->depth() + $this->subtreeHeight($task) > StoreTaskRequest::MAX_DEPTH) {
                $validator->errors()->add('parent_id', 'ツリーは最大5階層までです。');
            }
        });
    }

    /**
     * このタスクを根とする部分木の高さ（自分のみ = 1）。
     */
    private function subtreeHeight(Task $task): int
    {
        $height = 1;
        $frontier = [$task->id];

        while ($frontier !== []) {
            $frontier = Task::query()
                ->whereIn('parent_id', $frontier)
                ->pluck('id')
                ->all();

            if ($frontier !== []) {
                $height++;
            }
        }

        return $height;
    }
}
