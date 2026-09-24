<?php

namespace App\Http\Requests;

use App\Models\ResumeEntry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * 行の中身だけを直す。今の履歴書 / 将来の履歴書の移動は achieve（達成）でだけ行う。
 */
class UpdateResumeEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('resume_entry'));
    }

    public function rules(): array
    {
        return [
            'kind' => ['sometimes', Rule::in(ResumeEntry::KINDS)],
            'year' => ['sometimes', 'integer', 'min:1900', 'max:2100'],
            'month' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:12'],
            'content' => ['sometimes', 'string', 'max:200'],
        ];
    }
}
