<?php

namespace Database\Factories;

use App\Models\TitlePreset;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TitlePreset>
 */
class TitlePresetFactory extends Factory
{
    protected $model = TitlePreset::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'label' => fake()->unique()->word(),
        ];
    }
}
