<?php

namespace App\Http\Requests;

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
        ];
    }
}
