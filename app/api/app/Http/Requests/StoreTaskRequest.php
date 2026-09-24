<?php

namespace App\Http\Requests;

use App\Models\Task;
use App\Models\User;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    public const MAX_DEPTH = 5;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:200'],
            'parent_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('tasks', 'id')->where('user_id', $this->user()->id),
            ],
        ];
    }

    public static function rootLimitMessage(): string
    {
        return 'やりたいことの登録は最大'.User::MAX_ACTIVE_ROOT_TASKS.'件までです。';
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $parentId = $this->input('parent_id');

            if ($parentId === null) {
                if ($this->user()->hasReachedRootTaskLimit()) {
                    $validator->errors()->add('title', self::rootLimitMessage());
                }

                return;
            }

            $parent = Task::query()->find($parentId);

            if ($parent !== null && $parent->depth() >= self::MAX_DEPTH) {
                $validator->errors()->add('parent_id', 'ツリーは最大5階層までです。');
            }
        });
    }
}
