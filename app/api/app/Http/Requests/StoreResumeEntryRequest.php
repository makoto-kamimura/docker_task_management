<?php

namespace App\Http\Requests;

use App\Models\ResumeEntry;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreResumeEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'timeline' => ['required', Rule::in(ResumeEntry::TIMELINES)],
            'kind' => ['required', Rule::in(ResumeEntry::KINDS)],
            'year' => ['required', 'integer', 'min:1900', 'max:2100'],
            'month' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:12'],
            'content' => ['required', 'string', 'max:200'],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            // 将来の行は「やりたいこと」のルートタスクを 1 件作るので、その上限にかかるなら登録させない。
            if ($this->input('timeline') === 'future' && $this->user()->hasReachedRootTaskLimit()) {
                $validator->errors()->add('content', StoreTaskRequest::rootLimitMessage());
            }
        });
    }
}
