<?php

namespace Tests\Feature\Schedule;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReminderSettingTest extends TestCase
{
    use RefreshDatabase;

    private function authHeader(User $user): array
    {
        $token = $user->createToken('api')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_show_returns_defaults(): void
    {
        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/reminder-settings')
            ->assertOk()
            ->assertJsonPath('data.reminder_min_gap_minutes', 30)
            ->assertJsonPath('data.reminder_window_start_minute', 7 * 60)
            ->assertJsonPath('data.reminder_window_end_minute', 22 * 60);
    }

    public function test_update_changes_settings(): void
    {
        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->patchJson('/api/v1/reminder-settings', [
                'reminder_min_gap_minutes' => 60,
                'reminder_window_start_minute' => 6 * 60,
                'reminder_window_end_minute' => 23 * 60,
            ])
            ->assertOk()
            ->assertJsonPath('data.reminder_min_gap_minutes', 60);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'reminder_min_gap_minutes' => 60,
            'reminder_window_start_minute' => 6 * 60,
            'reminder_window_end_minute' => 23 * 60,
        ]);
    }

    public function test_update_rejects_window_end_before_start(): void
    {
        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->patchJson('/api/v1/reminder-settings', ['reminder_window_end_minute' => 6 * 60])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('reminder_window_end_minute');
    }

    public function test_update_rejects_too_short_minimum_gap(): void
    {
        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->patchJson('/api/v1/reminder-settings', ['reminder_min_gap_minutes' => 5])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('reminder_min_gap_minutes');
    }

    public function test_requires_authentication(): void
    {
        $this->getJson('/api/v1/reminder-settings')->assertUnauthorized();
    }
}
