<?php

namespace Tests\Feature\Notifications;

use App\Models\ScheduleBlock;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DispatchScheduleStartNotificationsTest extends TestCase
{
    use RefreshDatabase;

    /** 2026-08-31 は月曜。 */
    private const MONDAY = 1;

    private const TUESDAY = 2;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function at(string $time): void
    {
        Carbon::setTestNow(Carbon::parse("2026-08-31 {$time}", config('app.timezone')));
    }

    private function user(): User
    {
        return User::factory()->create([
            'reminder_min_gap_minutes' => 30,
            'reminder_window_start_minute' => 7 * 60,
            'reminder_window_end_minute' => 22 * 60,
        ]);
    }

    private function block(User $user, array $attributes = []): ScheduleBlock
    {
        return ScheduleBlock::factory()->for($user)->create([
            'title' => 'スキマ',
            'day_of_week' => self::MONDAY,
            'start_minute' => 13 * 60,
            'end_minute' => 14 * 60,
            'notify_at_start' => true,
            ...$attributes,
        ]);
    }

    public function test_notifies_at_the_start_of_a_flagged_block(): void
    {
        $this->at('13:00:00');

        $user = $this->user();
        $this->block($user);
        Task::factory(2)->for($user)->create();

        $this->artisan('notifications:dispatch-schedule-starts')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseHas('notifications', ['user_id' => $user->id]);
    }

    public function test_does_not_notify_for_a_block_without_the_flag(): void
    {
        $this->at('13:00:00');

        $user = $this->user();
        $this->block($user, ['notify_at_start' => false]);
        Task::factory(2)->for($user)->create();

        $this->artisan('notifications:dispatch-schedule-starts')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_does_not_notify_in_the_middle_of_a_flagged_block(): void
    {
        $this->at('13:30:00');

        $user = $this->user();
        $this->block($user);
        Task::factory(2)->for($user)->create();

        $this->artisan('notifications:dispatch-schedule-starts')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_uses_the_schedule_of_the_current_day_of_week(): void
    {
        $this->at('13:00:00');

        $user = $this->user();
        $this->block($user, ['day_of_week' => self::TUESDAY]);
        Task::factory(2)->for($user)->create();

        $this->artisan('notifications:dispatch-schedule-starts')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 0);
    }

    /** ユーザーが指定した枠なので、通知してよい時間帯の外でも鳴らす。 */
    public function test_notifies_even_outside_the_reminder_window(): void
    {
        $this->at('05:00:00');

        $user = $this->user();
        $this->block($user, ['start_minute' => 5 * 60, 'end_minute' => 6 * 60]);
        Task::factory(2)->for($user)->create();

        $this->artisan('notifications:dispatch-schedule-starts')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 1);
    }

    public function test_does_not_send_twice_for_the_same_start(): void
    {
        $this->at('13:00:00');

        $user = $this->user();
        $this->block($user);
        Task::factory(2)->for($user)->create();

        $this->artisan('notifications:dispatch-schedule-starts')->assertSuccessful();
        $this->artisan('notifications:dispatch-schedule-starts')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 1);
    }

    public function test_sends_only_one_notification_when_two_flagged_blocks_start_together(): void
    {
        $this->at('13:00:00');

        $user = $this->user();
        $this->block($user);
        // 重複チェックは API 側の話なので、ここでは同時刻に 2 件ある状況だけ作る。
        $this->block($user, ['title' => 'もうひとつ', 'end_minute' => 13 * 60 + 30]);
        Task::factory(2)->for($user)->create();

        $this->artisan('notifications:dispatch-schedule-starts')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 1);
    }

    public function test_skips_users_with_no_tasks(): void
    {
        $this->at('13:00:00');

        $user = $this->user();
        $this->block($user);

        $this->artisan('notifications:dispatch-schedule-starts')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_notifies_each_user_separately(): void
    {
        $this->at('13:00:00');

        $first = $this->user();
        $this->block($first);
        Task::factory(2)->for($first)->create();

        $second = $this->user();
        $this->block($second);
        Task::factory(2)->for($second)->create();

        $this->artisan('notifications:dispatch-schedule-starts')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 2);
        $this->assertDatabaseHas('notifications', ['user_id' => $first->id]);
        $this->assertDatabaseHas('notifications', ['user_id' => $second->id]);
    }

    public function test_creates_a_new_notification_on_a_new_day(): void
    {
        $user = $this->user();
        $this->block($user);
        Task::factory(2)->for($user)->create();

        $this->at('13:00:00');
        $this->artisan('notifications:dispatch-schedule-starts')->assertSuccessful();

        // 翌週の月曜。同じ曜日・同じ時刻でも、日付が変われば改めて通知する。
        Carbon::setTestNow(Carbon::parse('2026-09-07 13:00:00', config('app.timezone')));
        $this->artisan('notifications:dispatch-schedule-starts')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 2);
    }
}
