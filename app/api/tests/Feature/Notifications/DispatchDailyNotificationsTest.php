<?php

namespace Tests\Feature\Notifications;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DispatchDailyNotificationsTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    public function test_creates_one_notification_when_time_matches(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-07-14 07:00:00', 'Asia/Tokyo'));

        $user = User::factory()->create(['notification_time' => '07:00:00']);
        Task::factory(2)->for($user)->create();

        $this->artisan('notifications:dispatch-daily')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 1);
        $this->assertDatabaseHas('notifications', ['user_id' => $user->id]);
    }

    public function test_does_not_create_second_notification_same_day(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-07-14 07:00:00', 'Asia/Tokyo'));

        $user = User::factory()->create(['notification_time' => '07:00:00']);
        Task::factory(2)->for($user)->create();

        $this->artisan('notifications:dispatch-daily')->assertSuccessful();
        $this->artisan('notifications:dispatch-daily')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 1);
    }

    public function test_creates_new_notification_on_a_new_day(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-07-14 07:00:00', 'Asia/Tokyo'));
        $user = User::factory()->create(['notification_time' => '07:00:00']);
        Task::factory(2)->for($user)->create();
        $this->artisan('notifications:dispatch-daily')->assertSuccessful();

        Carbon::setTestNow(Carbon::parse('2026-07-15 07:00:00', 'Asia/Tokyo'));
        $this->artisan('notifications:dispatch-daily')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 2);
    }

    public function test_skips_users_whose_notification_time_does_not_match(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-07-14 07:00:00', 'Asia/Tokyo'));

        $user = User::factory()->create(['notification_time' => '20:00:00']);
        Task::factory(2)->for($user)->create();

        $this->artisan('notifications:dispatch-daily')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 0);
    }

    public function test_skips_users_with_no_tasks(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-07-14 07:00:00', 'Asia/Tokyo'));

        User::factory()->create(['notification_time' => '07:00:00']);

        $this->artisan('notifications:dispatch-daily')->assertSuccessful();

        $this->assertDatabaseCount('notifications', 0);
    }
}
