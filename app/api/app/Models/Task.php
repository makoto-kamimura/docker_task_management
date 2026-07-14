<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    /** @use HasFactory<\Database\Factories\TaskFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'duration_minutes',
        'deadline_type',
        'rating',
        'status',
        'last_done_at',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'double',
            'last_done_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function taskLogs(): HasMany
    {
        return $this->hasMany(TaskLog::class);
    }

    public function wonComparisons(): HasMany
    {
        return $this->hasMany(Comparison::class, 'winner_task_id');
    }

    public function lostComparisons(): HasMany
    {
        return $this->hasMany(Comparison::class, 'loser_task_id');
    }
}
