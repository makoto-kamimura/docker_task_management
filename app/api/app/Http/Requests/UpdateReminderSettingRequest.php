<?php

namespace App\Http\Requests;

use App\Models\ScheduleBlock;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;

class UpdateReminderSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // 移動の合間のような細切れを弾くための下限。15 分刻みの UI に合わせて 15 分単位で扱う。
            'reminder_min_gap_minutes' => ['sometimes', 'integer', 'min:15', 'max:'.ScheduleBlock::MINUTES_PER_DAY],
            'reminder_window_start_minute' => ['sometimes', 'integer', 'min:0', 'max:'.(ScheduleBlock::MINUTES_PER_DAY - 1)],
            'reminder_window_end_minute' => ['sometimes', 'integer', 'min:1', 'max:'.ScheduleBlock::MINUTES_PER_DAY],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $user = $this->user();
            $start = (int) $this->input('reminder_window_start_minute', $user->reminder_window_start_minute);
            $end = (int) $this->input('reminder_window_end_minute', $user->reminder_window_end_minute);

            if ($end <= $start) {
                $validator->errors()->add(
                    'reminder_window_end_minute',
                    '通知の終了時刻は開始時刻より後にしてください。',
                );
            }
        });
    }
}
