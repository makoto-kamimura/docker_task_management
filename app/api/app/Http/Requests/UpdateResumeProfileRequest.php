<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * 履歴書の個人情報・自由記述。どの項目も任意で、送った項目だけを更新する（空文字は null として消す）。
 */
class UpdateResumeProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $postalCode = ['sometimes', 'nullable', 'string', 'regex:/^\d{3}-?\d{4}$/'];
        $phone = ['sometimes', 'nullable', 'string', 'max:20', 'regex:/^[0-9+\-() ]+$/'];

        return [
            'name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'name_kana' => ['sometimes', 'nullable', 'string', 'max:100'],
            'birth_date' => ['sometimes', 'nullable', 'date_format:Y-m-d', 'before:today'],
            'gender' => ['sometimes', 'nullable', 'string', 'max:20'],
            'postal_code' => $postalCode,
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'address_kana' => ['sometimes', 'nullable', 'string', 'max:255'],
            'phone' => $phone,
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'contact_postal_code' => $postalCode,
            'contact_address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'contact_phone' => $phone,
            'motivation' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'self_pr' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'requests' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'commute_minutes' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:600'],
            'dependents_count' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:20'],
            'has_spouse' => ['sometimes', 'nullable', 'boolean'],
            'spouse_dependent' => ['sometimes', 'nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'postal_code.regex' => '郵便番号は「123-4567」の形で入力してください。',
            'contact_postal_code.regex' => '郵便番号は「123-4567」の形で入力してください。',
            'phone.regex' => '電話番号は数字とハイフンで入力してください。',
            'contact_phone.regex' => '電話番号は数字とハイフンで入力してください。',
            'birth_date.before' => '生年月日は今日より前の日付にしてください。',
        ];
    }
}
