<?php

namespace Database\Factories;

use App\Models\Task;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Task>
 */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(3),
            'duration_minutes' => fake()->randomElement([15, 30, 60, null]),
            'deadline_type' => fake()->randomElement(['today', 'week', 'month', 'none']),
            'rating' => 1500,
            'status' => 'active',
            'last_done_at' => null,
        ];
    }

    public function archived(): static
    {
        return $this->state(fn () => ['status' => 'archived']);
    }
}
