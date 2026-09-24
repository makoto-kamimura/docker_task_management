<?php

namespace Database\Factories;

use App\Models\ResumeProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ResumeProfile>
 */
class ResumeProfileFactory extends Factory
{
    protected $model = ResumeProfile::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => '山田 太郎',
            'name_kana' => 'やまだ たろう',
        ];
    }
}
