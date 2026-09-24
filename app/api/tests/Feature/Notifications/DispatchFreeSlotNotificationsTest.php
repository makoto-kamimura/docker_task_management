<?php

namespace Tests\Feature\Notifications;

use App\Models\ScheduleBlock;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DispatchFreeSlotNotificationsTest extends TestCase
{
    use RefreshDatabase;

    /** 2026-08-31 は月曜。 */
    private const MONDAY = 1;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function at(string $time): void
    {
        Carbon::setTestNow(Carbon::parse("2026-08-31 {$time}", config('app.timezone')));
    }

    /** 通知可能な時間帯 7:00〜22:00、最小 30 分のユーザー。 */
    private function user(): User
    {
        return User::factory()->create([
            'reminder_min_gap_minutes' => 30,
            'reminder_window_start_minute' => 7 * 60,
            'reminder_window_end_minute' => 22 * 60,
        ]);
    }

    /** 月曜 9:00-18:00 を埋める → 隙間は 7:00-9:00 と 18:00-22:00 の 2 つ。 */
    private function fillMondayWorkday(User $user): void
    {
        ScheduleBlock::factory()->for($user)->create([
            'title' => '仕事',
            'day_of_week' => self::MONDAY,
            'start_minute' => 9 * 60,
            'end_minute' => 18 * 60,
        ]);
    }

    public function test_creates_notification_at_the_start_of_a_free_slot(): void
    {
        $this->at('07:00:00');

        $user = $this->user();
        $this->fillMondayWorkday($user);
        Task::factory(2)->for($user)->create();

        $this->artisan('notifications:dispatch-free-slots')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseHas('notifications', ['user_id' => $user->id]);
    }

    public function test_does_not_notify_in_the_middle_of_a_free_slot(): void
    {
        $this->at('07:30:00');

        $user = $this->user();
        $this->fillMondayWorkday($user);
        Task::factory(2)->for($user)->create();

        $this->artisan('notifications:dispatch-free-slots')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_does_not_notify_during_a_registered_block(): void
    {
        $this->at('09:00:00');

        $user = $this->user();
        $this->fillMondayWorkday($user);
        Task::factory(2)->for($user)->create();

        $this->artisan('notifications:dispatch-free-slots')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_notifies_at_every_free_slot_of_the_day(): void
    {
        $user = $this->user();
        $this->fillMondayWorkday($user);
        Task::factory(2)->for($user)->create();

        $this->at('07:00:00');
        $this->artisan('notifications:dispatch-free-slots')->assertSuccessful();

        $this->at('18:00:00');
        $this->artisan('notifications:dispatch-free-slots')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 2);
    }

    public function test_does_not_send_twice_for_the_same_slot(): void
    {
        $this->at('07:00:00');

        $user = $this->user();
        $this->fillMondayWorkday($user);
        Task::factory(2)->for($user)->create();

        $this->artisan('notifications:dispatch-free-slots')->assertSuccessful();
        $this->artisan('notifications:dispatch-free-slots')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 1);
    }

    public function test_skips_gaps_shorter_than_the_user_minimum(): void
    {
        $this->at('12:00:00');

        $user = $this->user();
        // 7:00-12:00 / 12:15-22:00。12:00 に始まる隙間は 15 分しかない。
        ScheduleBlock::factory()->for($user)->create([
            'day_of_week' => self::MONDAY,
            'start_minute' => 7 * 60,
            'end_minute' => 12 * 60,
        ]);
        ScheduleBlock::factory()->for($user)->create([
            'day_of_week' => self::MONDAY,
            'start_minute' => 12 * 60 + 15,
            'end_minute' => 22 * 60,
        ]);
        Task::factory(2)->for($user)->create();

        $this->artisan('notifications:dispatch-free-slots')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_skips_users_outside_their_notification_window(): void
    {
        // 6:00 は既定の通知可能な時間帯（7:00〜）より前。予定は空でも通知しない。
        $this->at('06:00:00');

        $user = $this->user();
        Task::factory(2)->for($user)->create();

        $this->artisan('notifications:dispatch-free-slots')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_uses_the_schedule_of_the_current_day_of_week(): void
    {
        // 火曜（2026-09-01）7:00。月曜の予定は影響しないので窓の頭がそのまま隙間になる。
        Carbon::setTestNow(Carbon::parse('2026-09-01 07:00:00', config('app.timezone')));

        $user = $this->user();
        ScheduleBlock::factory()->for($user)->create([
            'day_of_week' => self::MONDAY,
            'start_minute' => 7 * 60,
            'end_minute' => 22 * 60,
        ]);
        Task::factory(2)->for($user)->create();

        $this->artisan('notifications:dispatch-free-slots')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 1);
    }

    public function test_creates_a_new_notification_on_a_new_day(): void
    {
        $user = $this->user();
        $this->fillMondayWorkday($user);
        Task::factory(2)->for($user)->create();

        $this->at('07:00:00');
        $this->artisan('notifications:dispatch-free-slots')->assertSuccessful();

        // 翌日（火曜）は予定が無いので 7:00 が隙間の頭になる。
        Carbon::setTestNow(Carbon::parse('2026-09-01 07:00:00', config('app.timezone')));
        $this->artisan('notifications:dispatch-free-slots')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 2);
    }

    public function test_skips_users_with_no_tasks(): void
    {
        $this->at('07:00:00');

        $user = $this->user();
        $this->fillMondayWorkday($user);

        $this->artisan('notifications:dispatch-free-slots')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_notifies_the_comparison_step_when_nothing_is_doable(): void
    {
        $this->at('07:00:00');

        $user = $this->user();
        $this->fillMondayWorkday($user);
        // どれも「15分でできない」→ 実施できる一歩は無い。二択で選ぶことを今日の一歩として声をかける。
        Task::factory(2)->for($user)->create(['needs_breakdown' => true]);

        $this->artisan('notifications:dispatch-free-slots')->assertSuccessful();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $user->id,
            'task_id' => null,
            'kind' => 'compare',
        ]);
    }
}
