<?php

namespace Tests\Feature\Resume;

use App\Models\ResumeEntry;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResumeEntryTest extends TestCase
{
    use RefreshDatabase;

    private function authHeader(User $user): array
    {
        $token = $user->createToken('api')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_current_entry_does_not_create_a_task(): void
    {
        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/resume/entries', [
                'timeline' => 'current',
                'kind' => 'education',
                'year' => 2012,
                'month' => 3,
                'content' => '〇〇大学 卒業',
            ])
            ->assertCreated()
            ->assertJsonPath('data.task_id', null);

        $this->assertSame(0, $user->tasks()->count());
    }

    /** 将来の行は同名の「やりたいこと」を作り、分解・二択比較・今日の一歩に乗せる。 */
    public function test_future_entry_creates_a_root_task_with_the_same_title(): void
    {
        $user = User::factory()->create();

        $taskId = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/resume/entries', [
                'timeline' => 'future',
                'kind' => 'license',
                'year' => 2027,
                'month' => 4,
                'content' => '情報処理安全確保支援士 合格',
            ])
            ->assertCreated()
            ->assertJsonPath('data.timeline', 'future')
            ->json('data.task_id');

        $task = Task::query()->findOrFail($taskId);
        $this->assertSame('情報処理安全確保支援士 合格', $task->title);
        $this->assertNull($task->parent_id);
        $this->assertSame($user->id, $task->user_id);
    }

    public function test_future_entry_respects_the_root_task_limit(): void
    {
        $user = User::factory()->create();
        Task::factory()->for($user)->count(User::MAX_ACTIVE_ROOT_TASKS)->create();

        $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/resume/entries', [
                'timeline' => 'future',
                'kind' => 'work',
                'year' => 2030,
                'content' => 'セキュリティエンジニアとして転職',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('content');

        $this->assertSame(0, ResumeEntry::query()->count());
    }

    public function test_entries_are_listed_chronologically(): void
    {
        $user = User::factory()->create();
        ResumeEntry::factory()->for($user)->create(['year' => 2020, 'month' => 4, 'content' => 'B']);
        ResumeEntry::factory()->for($user)->create(['year' => 2012, 'month' => 3, 'content' => 'A']);
        ResumeEntry::factory()->for($user)->future()->create(['year' => 2028, 'month' => null, 'content' => 'C']);

        $contents = array_column(
            $this->withHeaders($this->authHeader($user))->getJson('/api/v1/resume')->assertOk()->json('data.entries'),
            'content',
        );

        $this->assertSame(['A', 'B', 'C'], $contents);
    }

    public function test_updating_a_future_entry_renames_its_task(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create(['title' => '旧']);
        $entry = ResumeEntry::factory()->for($user)->future()->create(['content' => '旧', 'task_id' => $task->id]);

        $this->withHeaders($this->authHeader($user))
            ->patchJson("/api/v1/resume/entries/{$entry->id}", ['content' => '応用情報技術者 合格', 'year' => 2026])
            ->assertOk()
            ->assertJsonPath('data.content', '応用情報技術者 合格')
            ->assertJsonPath('data.year', 2026);

        $this->assertSame('応用情報技術者 合格', $task->refresh()->title);
    }

    /** 達成したら今の履歴書へ移し、タスクは archived にしてランキング・今日の一歩から外す。 */
    public function test_achieve_moves_the_entry_to_current_and_archives_the_task(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        $entry = ResumeEntry::factory()->for($user)->future()->create(['task_id' => $task->id]);
        $headers = $this->authHeader($user);

        $this->withHeaders($headers)
            ->postJson("/api/v1/resume/entries/{$entry->id}/achieve")
            ->assertOk()
            ->assertJsonPath('data.timeline', 'current');

        $this->assertSame('archived', $task->refresh()->status);

        $this->withHeaders($headers)
            ->postJson("/api/v1/resume/entries/{$entry->id}/achieve")
            ->assertStatus(422);
    }

    public function test_deleting_the_task_keeps_the_entry_and_it_can_be_linked_again(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        $entry = ResumeEntry::factory()->for($user)->future()->create(['content' => '海外で働く', 'task_id' => $task->id]);
        $headers = $this->authHeader($user);

        $this->withHeaders($headers)->deleteJson("/api/v1/tasks/{$task->id}")->assertNoContent();
        $this->assertNull($entry->refresh()->task_id);

        $newTaskId = $this->withHeaders($headers)
            ->postJson("/api/v1/resume/entries/{$entry->id}/task")
            ->assertOk()
            ->json('data.task_id');

        $this->assertSame('海外で働く', Task::query()->findOrFail($newTaskId)->title);

        // すでに結んでいる行にはもう作らない。
        $this->withHeaders($headers)->postJson("/api/v1/resume/entries/{$entry->id}/task")->assertStatus(422);
    }

    public function test_deleting_an_entry_keeps_its_task(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();
        $entry = ResumeEntry::factory()->for($user)->future()->create(['task_id' => $task->id]);

        $this->withHeaders($this->authHeader($user))
            ->deleteJson("/api/v1/resume/entries/{$entry->id}")
            ->assertNoContent();

        $this->assertModelMissing($entry);
        $this->assertModelExists($task);
    }

    public function test_validation_rejects_unknown_kind_and_month(): void
    {
        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/resume/entries', [
                'timeline' => 'someday',
                'kind' => 'hobby',
                'year' => 1800,
                'month' => 13,
                'content' => '',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['timeline', 'kind', 'year', 'month', 'content']);
    }

    public function test_other_users_cannot_touch_an_entry(): void
    {
        $entry = ResumeEntry::factory()->future()->create();
        $headers = $this->authHeader(User::factory()->create());

        $this->withHeaders($headers)->patchJson("/api/v1/resume/entries/{$entry->id}", ['content' => 'x'])->assertForbidden();
        $this->withHeaders($headers)->postJson("/api/v1/resume/entries/{$entry->id}/achieve")->assertForbidden();
        $this->withHeaders($headers)->postJson("/api/v1/resume/entries/{$entry->id}/task")->assertForbidden();
        $this->withHeaders($headers)->deleteJson("/api/v1/resume/entries/{$entry->id}")->assertForbidden();
    }
}
