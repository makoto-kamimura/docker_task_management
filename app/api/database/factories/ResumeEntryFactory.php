<?php

namespace Database\Factories;

use App\Models\ResumeEntry;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ResumeEntry>
 */
class ResumeEntryFactory extends Factory
{
    protected $model = ResumeEntry::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'timeline' => 'current',
            'kind' => 'work',
            'year' => fake()->numberBetween(2000, 2025),
            'month' => fake()->numberBetween(1, 12),
            'content' => fake()->company().' 入社',
        ];
    }

    public function future(): static
    {
        return $this->state(fn () => ['timeline' => 'future', 'year' => 2030]);
    }
}
