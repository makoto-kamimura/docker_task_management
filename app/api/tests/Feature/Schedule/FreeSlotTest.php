<?php

namespace Tests\Feature\Schedule;

use App\Models\ScheduleBlock;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class FreeSlotTest extends TestCase
{
    use RefreshDatabase;

    private const MONDAY = 1;

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

    /** 通知可能な時間帯 7:00〜22:00、最小 30 分のユーザー。 */
    private function user(array $overrides = []): User
    {
        return User::factory()->create($overrides + [
            'reminder_min_gap_minutes' => 30,
            'reminder_window_start_minute' => 7 * 60,
            'reminder_window_end_minute' => 22 * 60,
        ]);
    }

    public function test_returns_gaps_between_blocks(): void
    {
        $user = $this->user();
        ScheduleBlock::factory()->for($user)->create([
            'title' => '仕事',
            'day_of_week' => self::MONDAY,
            'start_minute' => 9 * 60,
            'end_minute' => 18 * 60,
        ]);

        $response = $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/schedule-blocks/free-slots?day_of_week='.self::MONDAY);

        $response->assertOk()
            ->assertJsonPath('data.day_of_week', self::MONDAY)
            ->assertJsonPath('data.min_gap_minutes', 30)
            ->assertJsonCount(2, 'data.slots')
            ->assertJsonPath('data.slots.0.start_minute', 7 * 60)
            ->assertJsonPath('data.slots.0.end_minute', 9 * 60)
            ->assertJsonPath('data.slots.0.duration_minutes', 120)
            ->assertJsonPath('data.slots.1.start_minute', 18 * 60)
            ->assertJsonPath('data.slots.1.end_minute', 22 * 60);
    }

    public function test_day_without_blocks_is_one_whole_window(): void
    {
        $user = $this->user();

        $response = $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/schedule-blocks/free-slots?day_of_week='.self::MONDAY);

        $response->assertOk()
            ->assertJsonCount(1, 'data.slots')
            ->assertJsonPath('data.slots.0.start_minute', 7 * 60)
            ->assertJsonPath('data.slots.0.end_minute', 22 * 60);
    }

    public function test_gaps_shorter_than_minimum_are_dropped(): void
    {
        $user = $this->user();
        // 9:00-12:00 / 12:15-18:00。間の 15 分は最小 30 分に満たない。
        ScheduleBlock::factory()->for($user)->create([
            'day_of_week' => self::MONDAY,
            'start_minute' => 9 * 60,
            'end_minute' => 12 * 60,
        ]);
        ScheduleBlock::factory()->for($user)->create([
            'day_of_week' => self::MONDAY,
            'start_minute' => 12 * 60 + 15,
            'end_minute' => 18 * 60,
        ]);

        $response = $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/schedule-blocks/free-slots?day_of_week='.self::MONDAY);

        $response->assertOk()->assertJsonCount(2, 'data.slots');
        $this->assertSame(
            [7 * 60, 18 * 60],
            array_column($response->json('data.slots'), 'start_minute'),
        );
    }

    public function test_blocks_outside_the_window_do_not_create_slots(): void
    {
        $user = $this->user();
        // 通知可能な時間帯の外（深夜・早朝）は、空いていても隙間として扱わない。
        ScheduleBlock::factory()->for($user)->create([
            'day_of_week' => self::MONDAY,
            'start_minute' => 0,
            'end_minute' => 6 * 60,
        ]);
        ScheduleBlock::factory()->for($user)->create([
            'day_of_week' => self::MONDAY,
            'start_minute' => 23 * 60,
            'end_minute' => 24 * 60,
        ]);

        $response = $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/schedule-blocks/free-slots?day_of_week='.self::MONDAY);

        $response->assertOk()
            ->assertJsonCount(1, 'data.slots')
            ->assertJsonPath('data.slots.0.start_minute', 7 * 60)
            ->assertJsonPath('data.slots.0.end_minute', 22 * 60);
    }

    public function test_block_straddling_the_window_start_shortens_the_first_slot(): void
    {
        $user = $this->user();
        ScheduleBlock::factory()->for($user)->create([
            'day_of_week' => self::MONDAY,
            'start_minute' => 6 * 60,
            'end_minute' => 8 * 60,
        ]);

        $response = $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/schedule-blocks/free-slots?day_of_week='.self::MONDAY);

        $response->assertOk()
            ->assertJsonCount(1, 'data.slots')
            ->assertJsonPath('data.slots.0.start_minute', 8 * 60)
            ->assertJsonPath('data.slots.0.end_minute', 22 * 60);
    }

    public function test_defaults_to_today_day_of_week(): void
    {
        // 2026-08-31 は月曜。
        Carbon::setTestNow(Carbon::parse('2026-08-31 10:00:00', config('app.timezone')));

        $user = $this->user();
        ScheduleBlock::factory()->for($user)->create([
            'day_of_week' => self::MONDAY,
            'start_minute' => 9 * 60,
            'end_minute' => 18 * 60,
        ]);

        $response = $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/schedule-blocks/free-slots');

        $response->assertOk()
            ->assertJsonPath('data.day_of_week', self::MONDAY)
            ->assertJsonCount(2, 'data.slots');
    }

    public function test_requires_authentication(): void
    {
        $this->getJson('/api/v1/schedule-blocks/free-slots')->assertUnauthorized();
    }
}
