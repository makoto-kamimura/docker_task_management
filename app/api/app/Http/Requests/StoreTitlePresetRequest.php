<?php

namespace App\Http\Requests;

use App\Models\TitlePreset;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTitlePresetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'label' => [
                'required',
                'string',
                'max:100',
                Rule::unique('title_presets', 'label')->where('user_id', $this->user()->id),
            ],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            // 既定の項目は登録しなくても選べる。同じ名前を登録させると一覧に二重に出てしまう。
            if (in_array(trim((string) $this->validated('label')), TitlePreset::DEFAULT_LABELS, true)) {
                $validator->errors()->add('label', 'この項目は最初から選べます。');
            }
        });
    }

    public function messages(): array
    {
        return [
            'label.unique' => 'その項目はすでに登録されています。',
            'label.required' => '項目名を入力してください。',
            'label.max' => '項目名は100文字までにしてください。',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('label'))) {
            $this->merge(['label' => trim($this->input('label'))]);
        }
    }
}
