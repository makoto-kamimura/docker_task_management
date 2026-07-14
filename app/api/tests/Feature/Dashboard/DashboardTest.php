<?php

namespace Tests\Feature\Dashboard;

use App\Models\Comparison;
use App\Models\Task;
use App\Models\TaskLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-07-14 12:00:00', 'Asia/Tokyo'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function authHeader(User $user): array
    {
        $token = $user->createToken('api')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_dashboard_returns_expected_structure(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create(['rating' => 1800]);
        Task::factory(3)->for($user)->create();

        TaskLog::create([
            'task_id' => $task->id,
            'started_at' => now()->subMinutes(10),
            'finished_at' => now(),
            'result' => 'done',
            'elapsed_seconds' => 600,
            'source' => 'web',
        ]);

        Comparison::create([
            'user_id' => $user->id,
            'winner_task_id' => $task->id,
            'loser_task_id' => Task::factory()->for($user)->create()->id,
            'compared_at' => now(),
        ]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/dashboard');

        $response->assertOk()->assertJsonStructure([
            'data' => [
                'today_recommendation',
                'top_tasks',
                'completed_this_week',
                'comparison_count',
                'streak_days',
            ],
        ]);

        $response->assertJsonPath('data.completed_this_week', 1);
        $response->assertJsonPath('data.comparison_count', 1);
        $response->assertJsonPath('data.streak_days', 1);
    }

    public function test_streak_counts_consecutive_days_ending_today(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();

        foreach ([0, 1, 2] as $daysAgo) {
            TaskLog::create([
                'task_id' => $task->id,
                'started_at' => now()->subDays($daysAgo),
                'finished_at' => now()->subDays($daysAgo),
                'result' => 'done',
                'source' => 'web',
            ]);
        }
        // 4日前の記録は連続が途切れるため含まれない
        TaskLog::create([
            'task_id' => $task->id,
            'started_at' => now()->subDays(4),
            'finished_at' => now()->subDays(4),
            'result' => 'done',
            'source' => 'web',
        ]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/dashboard');

        $response->assertJsonPath('data.streak_days', 3);
    }

    public function test_streak_is_zero_when_last_activity_is_older_than_yesterday(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();

        TaskLog::create([
            'task_id' => $task->id,
            'started_at' => now()->subDays(3),
            'finished_at' => now()->subDays(3),
            'result' => 'done',
            'source' => 'web',
        ]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/dashboard');

        $response->assertJsonPath('data.streak_days', 0);
    }
}
