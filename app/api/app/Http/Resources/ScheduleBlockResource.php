<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ScheduleBlockResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'task_id' => $this->task_id,
            'title' => $this->title,
            'day_of_week' => $this->day_of_week,
            'start_minute' => $this->start_minute,
            'end_minute' => $this->end_minute,
            'duration_minutes' => $this->durationMinutes(),
            'notify_at_start' => $this->notify_at_start,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
