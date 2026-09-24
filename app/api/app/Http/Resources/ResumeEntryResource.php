<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ResumeEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'timeline' => $this->timeline,
            'kind' => $this->kind,
            'year' => $this->year,
            'month' => $this->month,
            'content' => $this->content,
            // 将来の行が目標として結んでいる「やりたいこと」のルートタスク。タスクを消すと null になる。
            'task_id' => $this->task_id,
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
        ];
    }
}
