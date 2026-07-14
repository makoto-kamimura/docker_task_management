<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreComparisonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'winner_task_id' => [
                'required',
                'integer',
                'different:loser_task_id',
                Rule::exists('tasks', 'id')->where('user_id', $this->user()->id)->where('status', 'active'),
            ],
            'loser_task_id' => [
                'required',
                'integer',
                Rule::exists('tasks', 'id')->where('user_id', $this->user()->id)->where('status', 'active'),
            ],
        ];
    }
}
