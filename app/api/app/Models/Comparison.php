<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comparison extends Model
{
    protected $fillable = [
        'user_id',
        'winner_task_id',
        'loser_task_id',
        'compared_at',
    ];

    protected function casts(): array
    {
        return [
            'compared_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function winner(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'winner_task_id');
    }

    public function loser(): BelongsTo
    {
        return $this->belongsTo(Task::class, 'loser_task_id');
    }
}
