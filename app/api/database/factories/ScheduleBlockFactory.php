<?php

namespace Database\Factories;

use App\Models\ScheduleBlock;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ScheduleBlock>
 */
class ScheduleBlockFactory extends Factory
{
    protected $model = ScheduleBlock::class;

    public function definition(): array
    {
        $start = fake()->numberBetween(0, 92) * 15;

        return [
            'user_id' => User::factory(),
            'task_id' => null,
            'title' => fake()->sentence(2),
            'day_of_week' => fake()->numberBetween(0, 6),
            'start_minute' => $start,
            'end_minute' => $start + 30,
        ];
    }
}
