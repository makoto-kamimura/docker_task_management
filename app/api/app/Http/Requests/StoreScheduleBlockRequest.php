<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesScheduleOverlap;
use App\Models\ScheduleBlock;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreScheduleBlockRequest extends FormRequest
{
    use ValidatesScheduleOverlap;

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:100'],
            'day_of_week' => ['required', 'integer', 'min:0', 'max:'.ScheduleBlock::LAST_DAY_OF_WEEK],
            'start_minute' => ['required', 'integer', 'min:0', 'max:'.(ScheduleBlock::MINUTES_PER_DAY - 1)],
            'end_minute' => ['required', 'integer', 'min:1', 'max:'.ScheduleBlock::MINUTES_PER_DAY, 'gt:start_minute'],
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

            $this->validateNoOverlap(
                $validator,
                (int) $this->validated('day_of_week'),
                (int) $this->validated('start_minute'),
                (int) $this->validated('end_minute'),
            );
        });
    }
}
