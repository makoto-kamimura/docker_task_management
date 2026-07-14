<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;

class StoreTaskRequest extends FormRequest
{
    public const MAX_ACTIVE_TASKS = 100;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:200'],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            $activeCount = $this->user()->tasks()->where('status', 'active')->count();

            if ($activeCount >= self::MAX_ACTIVE_TASKS) {
                $validator->errors()->add('title', 'やりたいことの登録は最大100件までです。');
            }
        });
    }
}
