<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'task_id' => [
                'required',
                'integer',
                Rule::exists('tasks', 'id')->where('user_id', $this->user()->id),
            ],
            'started_at' => ['required', 'date'],
            'result' => ['required', Rule::in(['done', 'partial', 'skipped'])],
            'elapsed_seconds' => ['nullable', 'integer', 'min:0'],
            'source' => ['required', Rule::in(['web', 'mobile', 'watch'])],
        ];
    }
}
