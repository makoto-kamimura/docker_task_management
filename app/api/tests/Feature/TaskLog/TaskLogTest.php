<?php

namespace Tests\Feature\TaskLog;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskLogTest extends TestCase
{
    use RefreshDatabase;

    private function authHeader(User $user): array
    {
        $token = $user->createToken('api')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_store_records_done_result_and_updates_last_done_at(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create(['last_done_at' => null]);

        $response = $this->withHeaders($this->authHeader($user))->postJson('/api/v1/task-logs', [
            'task_id' => $task->id,
            'started_at' => now()->subMinutes(15)->toIso8601String(),
            'result' => 'done',
            'elapsed_seconds' => 900,
            'source' => 'web',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('task_logs', [
            'task_id' => $task->id,
            'result' => 'done',
            'elapsed_seconds' => 900,
        ]);
        $this->assertNotNull($task->refresh()->last_done_at);
    }

    public function test_store_records_partial_result_and_updates_last_done_at(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create(['last_done_at' => null]);

        $this->withHeaders($this->authHeader($user))->postJson('/api/v1/task-logs', [
            'task_id' => $task->id,
            'started_at' => now()->subMinutes(7)->toIso8601String(),
            'result' => 'partial',
            'elapsed_seconds' => 420,
            'source' => 'web',
        ])->assertCreated();

        $this->assertNotNull($task->refresh()->last_done_at);
    }

    public function test_store_skipped_result_does_not_update_last_done_at(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create(['last_done_at' => null]);

        $this->withHeaders($this->authHeader($user))->postJson('/api/v1/task-logs', [
            'task_id' => $task->id,
            'started_at' => now()->toIso8601String(),
            'result' => 'skipped',
            'source' => 'web',
        ])->assertCreated();

        $this->assertNull($task->refresh()->last_done_at);
    }

    public function test_store_rejects_task_belonging_to_another_user(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $othersTask = Task::factory()->for($other)->create();

        $response = $this->withHeaders($this->authHeader($user))->postJson('/api/v1/task-logs', [
            'task_id' => $othersTask->id,
            'started_at' => now()->toIso8601String(),
            'result' => 'done',
            'source' => 'web',
        ]);

        $response->assertUnprocessable();
    }
}
