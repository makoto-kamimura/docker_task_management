<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\TaskLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TaskLog>
 */
class TaskLogFactory extends Factory
{
    protected $model = TaskLog::class;

    public function definition(): array
    {
        $startedAt = fake()->dateTimeBetween('-14 days', 'now');

        return [
            'task_id' => Task::factory(),
            'started_at' => $startedAt,
            'finished_at' => $startedAt,
            'result' => fake()->randomElement(['done', 'partial', 'skipped']),
            'elapsed_seconds' => fake()->numberBetween(60, 3600),
            'source' => fake()->randomElement(['web', 'mobile', 'watch']),
        ];
    }
}
