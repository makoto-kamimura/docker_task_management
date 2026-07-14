<?php

namespace Tests\Unit\Services;

use App\Models\Task;
use App\Models\User;
use App\Services\RecommendationScoreService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class RecommendationScoreServiceTest extends TestCase
{
    use RefreshDatabase;

    private RecommendationScoreService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new RecommendationScoreService();
        Carbon::setTestNow(Carbon::parse('2026-07-14 12:00:00'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_returns_null_with_no_active_tasks(): void
    {
        $user = User::factory()->create();

        $this->assertNull($this->service->recommend($user));
    }

    public function test_returns_the_only_task_when_just_one_exists(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();

        $this->assertTrue($this->service->recommend($user)->is($task));
    }

    public function test_tie_break_prefers_higher_rating(): void
    {
        $user = User::factory()->create();

        // score = 0.5*0 + 0.2*1.0(未実施) + 0.3*1.0(today) = 0.5
        $a = Task::factory()->for($user)->create([
            'rating' => 1500,
            'last_done_at' => null,
            'deadline_type' => 'today',
        ]);

        // score = 0.5*0 + 0.2*0(今やった) + 0.3*0(none) = 0
        Task::factory()->for($user)->create([
            'rating' => 1500,
            'last_done_at' => now(),
            'deadline_type' => 'none',
        ]);

        // score = 0.5*1(最高rating) + 0.2*0 + 0.3*0 = 0.5 (aと同点、ratingが高いのでこちらが勝つ)
        $c = Task::factory()->for($user)->create([
            'rating' => 1600,
            'last_done_at' => now(),
            'deadline_type' => 'none',
        ]);

        $result = $this->service->recommend($user);

        $this->assertTrue($result->is($c), "expected task C (higher rating tie-break) but got task {$result->id}");
        $this->assertFalse($result->is($a));
    }

    public function test_deadline_today_outweighs_higher_rating_without_deadline(): void
    {
        $user = User::factory()->create();

        // score = 0.5*1(最高rating) + 0.2*0 + 0.3*0 = 0.5
        $highRatingNoDeadline = Task::factory()->for($user)->create([
            'rating' => 2000,
            'last_done_at' => now(),
            'deadline_type' => 'none',
        ]);

        // score = 0.5*0 + 0.2*0 + 0.3*1.0(today) = 0.3 (これだけでは高rating未満)
        Task::factory()->for($user)->create([
            'rating' => 1500,
            'last_done_at' => now(),
            'deadline_type' => 'today',
        ]);

        $result = $this->service->recommend($user);

        $this->assertTrue($result->is($highRatingNoDeadline));
    }

    public function test_recency_bonus_caps_at_fourteen_days(): void
    {
        $user = User::factory()->create();

        // 20日前 -> 14日キャップされ recency=1.0 => score = 0.5*0 + 0.2*1.0 + 0 = 0.2
        $longAgo = Task::factory()->for($user)->create([
            'rating' => 1500,
            'last_done_at' => now()->subDays(20),
            'deadline_type' => 'none',
        ]);

        // 7日前 -> recency=0.5 => score = 0.5*0 + 0.2*0.5 + 0 = 0.1
        Task::factory()->for($user)->create([
            'rating' => 1500,
            'last_done_at' => now()->subDays(7),
            'deadline_type' => 'none',
        ]);

        $result = $this->service->recommend($user);

        $this->assertTrue($result->is($longAgo));
    }

    public function test_archived_tasks_are_excluded(): void
    {
        $user = User::factory()->create();
        $active = Task::factory()->for($user)->create(['rating' => 1000]);
        Task::factory()->for($user)->archived()->create(['rating' => 3000]);

        $result = $this->service->recommend($user);

        $this->assertTrue($result->is($active));
    }
}
