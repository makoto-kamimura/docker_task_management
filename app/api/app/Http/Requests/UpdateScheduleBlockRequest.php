<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesScheduleOverlap;
use App\Models\ScheduleBlock;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateScheduleBlockRequest extends FormRequest
{
    use ValidatesScheduleOverlap;

    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('schedule_block'));
    }

    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:100'],
            'day_of_week' => ['sometimes', 'integer', 'min:0', 'max:'.ScheduleBlock::LAST_DAY_OF_WEEK],
            'start_minute' => ['sometimes', 'integer', 'min:0', 'max:'.(ScheduleBlock::MINUTES_PER_DAY - 1)],
            'end_minute' => ['sometimes', 'integer', 'min:1', 'max:'.ScheduleBlock::MINUTES_PER_DAY],
            'task_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('tasks', 'id')->where('user_id', $this->user()->id),
            ],
            'notify_at_start' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(ValidatorContract $validator): void
    {
        $validator->after(function (ValidatorContract $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            /** @var ScheduleBlock $block */
            $block = $this->route('schedule_block');

            // 部分更新なので、未指定の項目は既存値を使って時間帯を組み立て直す。
            $dayOfWeek = (int) $this->input('day_of_week', $block->day_of_week);
            $startMinute = (int) $this->input('start_minute', $block->start_minute);
            $endMinute = (int) $this->input('end_minute', $block->end_minute);

            if ($endMinute <= $startMinute) {
                $validator->errors()->add('end_minute', '終了時刻は開始時刻より後にしてください。');

                return;
            }

            $this->validateNoOverlap($validator, $dayOfWeek, $startMinute, $endMinute, $block->id);
        });
    }
}
