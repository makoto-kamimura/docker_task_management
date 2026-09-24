<?php

namespace Tests\Feature\Schedule;

use App\Models\ScheduleBlock;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScheduleBlockTest extends TestCase
{
    use RefreshDatabase;

    /** 0=日 〜 6=土 */
    private const MONDAY = 1;

    private const TUESDAY = 2;

    private function authHeader(User $user): array
    {
        $token = $user->createToken('api')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_index_returns_whole_week_in_day_then_start_order(): void
    {
        $user = User::factory()->create();
        ScheduleBlock::factory()->for($user)->create([
            'title' => '火曜の朝',
            'day_of_week' => self::TUESDAY,
            'start_minute' => 540,
            'end_minute' => 600,
        ]);
        ScheduleBlock::factory()->for($user)->create([
            'title' => '月曜の午後',
            'day_of_week' => self::MONDAY,
            'start_minute' => 780,
            'end_minute' => 840,
        ]);
        ScheduleBlock::factory()->for($user)->create([
            'title' => '月曜の朝',
            'day_of_week' => self::MONDAY,
            'start_minute' => 540,
            'end_minute' => 600,
        ]);

        $response = $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/schedule-blocks');

        $response->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.title', '月曜の朝')
            ->assertJsonPath('data.0.day_of_week', self::MONDAY)
            ->assertJsonPath('data.0.duration_minutes', 60)
            ->assertJsonPath('data.1.title', '月曜の午後')
            ->assertJsonPath('data.2.title', '火曜の朝');
    }

    public function test_index_filters_by_day_of_week(): void
    {
        $user = User::factory()->create();
        ScheduleBlock::factory()->for($user)->create([
            'title' => '月曜の予定',
            'day_of_week' => self::MONDAY,
        ]);
        ScheduleBlock::factory()->for($user)->create([
            'title' => '火曜の予定',
            'day_of_week' => self::TUESDAY,
        ]);

        $response = $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/schedule-blocks?day_of_week='.self::MONDAY);

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', '月曜の予定');
    }

    public function test_index_rejects_day_of_week_out_of_range(): void
    {
        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/schedule-blocks?day_of_week=7')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('day_of_week');
    }

    public function test_index_hides_other_users_blocks(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        ScheduleBlock::factory()->for($user)->create(['title' => '自分の予定']);
        ScheduleBlock::factory()->for($other)->create(['title' => '他人の予定']);

        $response = $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/schedule-blocks');

        $response->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', '自分の予定');
    }

    public function test_store_creates_block(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create(['title' => 'Reactを勉強する']);

        $response = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/schedule-blocks', [
                'title' => 'React勉強',
                'day_of_week' => self::MONDAY,
                'start_minute' => 540,
                'end_minute' => 555,
                'task_id' => $task->id,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.task_id', $task->id)
            ->assertJsonPath('data.day_of_week', self::MONDAY)
            ->assertJsonPath('data.duration_minutes', 15);
        $this->assertDatabaseHas('schedule_blocks', [
            'user_id' => $user->id,
            'title' => 'React勉強',
            'day_of_week' => self::MONDAY,
            'start_minute' => 540,
            'end_minute' => 555,
        ]);
    }

    public function test_store_requires_day_of_week(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/schedule-blocks', [
                'title' => '曜日なし',
                'start_minute' => 540,
                'end_minute' => 600,
            ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('day_of_week');
    }

    public function test_store_rejects_end_before_start(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/schedule-blocks', [
                'title' => '逆転',
                'day_of_week' => self::MONDAY,
                'start_minute' => 600,
                'end_minute' => 540,
            ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('end_minute');
    }

    public function test_store_rejects_minute_out_of_day(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/schedule-blocks', [
                'title' => '日をまたぐ',
                'day_of_week' => self::MONDAY,
                'start_minute' => 1400,
                'end_minute' => 1500,
            ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('end_minute');
    }

    public function test_store_rejects_overlapping_block_on_same_day_of_week(): void
    {
        $user = User::factory()->create();
        ScheduleBlock::factory()->for($user)->create([
            'title' => '会議',
            'day_of_week' => self::MONDAY,
            'start_minute' => 540,
            'end_minute' => 660,
        ]);

        $response = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/schedule-blocks', [
                'title' => '重なる予定',
                'day_of_week' => self::MONDAY,
                'start_minute' => 600,
                'end_minute' => 720,
            ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('start_minute');
        $this->assertDatabaseMissing('schedule_blocks', ['title' => '重なる予定']);
    }

    public function test_store_allows_block_starting_when_previous_ends(): void
    {
        $user = User::factory()->create();
        ScheduleBlock::factory()->for($user)->create([
            'day_of_week' => self::MONDAY,
            'start_minute' => 540,
            'end_minute' => 600,
        ]);

        $response = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/schedule-blocks', [
                'title' => '続きの予定',
                'day_of_week' => self::MONDAY,
                'start_minute' => 600,
                'end_minute' => 660,
            ]);

        $response->assertCreated();
    }

    public function test_store_ignores_overlap_on_another_day_of_week(): void
    {
        $user = User::factory()->create();
        ScheduleBlock::factory()->for($user)->create([
            'day_of_week' => self::MONDAY,
            'start_minute' => 540,
            'end_minute' => 660,
        ]);

        $response = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/schedule-blocks', [
                'title' => '火曜の同じ時間',
                'day_of_week' => self::TUESDAY,
                'start_minute' => 540,
                'end_minute' => 660,
            ]);

        $response->assertCreated();
    }

    public function test_store_rejects_task_of_other_user(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $task = Task::factory()->for($other)->create();

        $response = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/schedule-blocks', [
                'title' => '不正なタスク紐付け',
                'day_of_week' => self::MONDAY,
                'start_minute' => 540,
                'end_minute' => 600,
                'task_id' => $task->id,
            ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('task_id');
    }

    public function test_update_changes_time_without_self_overlap(): void
    {
        $user = User::factory()->create();
        $block = ScheduleBlock::factory()->for($user)->create([
            'day_of_week' => self::MONDAY,
            'start_minute' => 540,
            'end_minute' => 600,
        ]);

        $response = $this->withHeaders($this->authHeader($user))
            ->patchJson("/api/v1/schedule-blocks/{$block->id}", ['end_minute' => 630]);

        $response->assertOk()->assertJsonPath('data.duration_minutes', 90);
    }

    public function test_store_defaults_notify_at_start_to_off(): void
    {
        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/schedule-blocks', [
                'title' => 'スキマ',
                'day_of_week' => self::MONDAY,
                'start_minute' => 540,
                'end_minute' => 600,
            ])
            ->assertCreated()
            ->assertJsonPath('data.notify_at_start', false);
    }

    public function test_store_can_turn_notify_at_start_on(): void
    {
        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/schedule-blocks', [
                'title' => 'スキマ',
                'day_of_week' => self::MONDAY,
                'start_minute' => 540,
                'end_minute' => 600,
                'notify_at_start' => true,
            ])
            ->assertCreated()
            ->assertJsonPath('data.notify_at_start', true);
    }

    public function test_update_toggles_notify_at_start(): void
    {
        $user = User::factory()->create();
        $block = ScheduleBlock::factory()->for($user)->create([
            'day_of_week' => self::MONDAY,
            'start_minute' => 540,
            'end_minute' => 600,
            'notify_at_start' => false,
        ]);

        $this->withHeaders($this->authHeader($user))
            ->patchJson("/api/v1/schedule-blocks/{$block->id}", ['notify_at_start' => true])
            ->assertOk()
            ->assertJsonPath('data.notify_at_start', true);

        $this->assertTrue($block->fresh()->notify_at_start);

        $this->withHeaders($this->authHeader($user))
            ->patchJson("/api/v1/schedule-blocks/{$block->id}", ['notify_at_start' => false])
            ->assertOk()
            ->assertJsonPath('data.notify_at_start', false);

        $this->assertFalse($block->fresh()->notify_at_start);
    }

    public function test_update_rejects_non_boolean_notify_at_start(): void
    {
        $user = User::factory()->create();
        $block = ScheduleBlock::factory()->for($user)->create([
            'day_of_week' => self::MONDAY,
            'start_minute' => 540,
            'end_minute' => 600,
        ]);

        $this->withHeaders($this->authHeader($user))
            ->patchJson("/api/v1/schedule-blocks/{$block->id}", ['notify_at_start' => 'まる'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('notify_at_start');
    }

    public function test_update_can_move_block_to_another_day_of_week(): void
    {
        $user = User::factory()->create();
        ScheduleBlock::factory()->for($user)->create([
            'day_of_week' => self::MONDAY,
            'start_minute' => 540,
            'end_minute' => 600,
        ]);
        $block = ScheduleBlock::factory()->for($user)->create([
            'day_of_week' => self::TUESDAY,
            'start_minute' => 540,
            'end_minute' => 600,
        ]);

        // 移動先の月曜には同じ時間帯の予定があるので弾かれる。
        $this->withHeaders($this->authHeader($user))
            ->patchJson("/api/v1/schedule-blocks/{$block->id}", ['day_of_week' => self::MONDAY])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('start_minute');

        // 空いている水曜へならそのまま動く。
        $this->withHeaders($this->authHeader($user))
            ->patchJson("/api/v1/schedule-blocks/{$block->id}", ['day_of_week' => 3])
            ->assertOk()
            ->assertJsonPath('data.day_of_week', 3);
    }

    public function test_update_rejects_overlap_with_another_block(): void
    {
        $user = User::factory()->create();
        ScheduleBlock::factory()->for($user)->create([
            'day_of_week' => self::MONDAY,
            'start_minute' => 600,
            'end_minute' => 660,
        ]);
        $block = ScheduleBlock::factory()->for($user)->create([
            'day_of_week' => self::MONDAY,
            'start_minute' => 540,
            'end_minute' => 600,
        ]);

        $response = $this->withHeaders($this->authHeader($user))
            ->patchJson("/api/v1/schedule-blocks/{$block->id}", ['end_minute' => 620]);

        $response->assertUnprocessable()->assertJsonValidationErrors('start_minute');
    }

    public function test_update_forbidden_for_other_users_block(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $block = ScheduleBlock::factory()->for($owner)->create();

        $response = $this->withHeaders($this->authHeader($other))
            ->patchJson("/api/v1/schedule-blocks/{$block->id}", ['title' => '乗っ取り']);

        $response->assertForbidden();
    }

    public function test_destroy_deletes_own_block(): void
    {
        $user = User::factory()->create();
        $block = ScheduleBlock::factory()->for($user)->create();

        $response = $this->withHeaders($this->authHeader($user))
            ->deleteJson("/api/v1/schedule-blocks/{$block->id}");

        $response->assertNoContent();
        $this->assertDatabaseMissing('schedule_blocks', ['id' => $block->id]);
    }

    public function test_destroy_forbidden_for_other_users_block(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $block = ScheduleBlock::factory()->for($owner)->create();

        $response = $this->withHeaders($this->authHeader($other))
            ->deleteJson("/api/v1/schedule-blocks/{$block->id}");

        $response->assertForbidden();
        $this->assertDatabaseHas('schedule_blocks', ['id' => $block->id]);
    }

    public function test_deleting_task_keeps_block(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        $block = ScheduleBlock::factory()->for($user)->create(['task_id' => $task->id]);

        $this->withHeaders($this->authHeader($user))->deleteJson("/api/v1/tasks/{$task->id}");

        $this->assertDatabaseHas('schedule_blocks', ['id' => $block->id, 'task_id' => null]);
    }

    public function test_requires_authentication(): void
    {
        $this->getJson('/api/v1/schedule-blocks')->assertUnauthorized();
    }
}
