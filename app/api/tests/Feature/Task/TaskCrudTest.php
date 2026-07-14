<?php

namespace Tests\Feature\Task;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskCrudTest extends TestCase
{
    use RefreshDatabase;

    private function authHeader(User $user): array
    {
        $token = $user->createToken('api')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_index_returns_only_active_tasks_ordered_by_rating(): void
    {
        $user = User::factory()->create();
        Task::factory()->for($user)->create(['title' => 'Low', 'rating' => 1400]);
        Task::factory()->for($user)->create(['title' => 'High', 'rating' => 1600]);
        Task::factory()->for($user)->archived()->create(['title' => 'Archived', 'rating' => 1900]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/tasks');

        $response->assertOk();
        $titles = collect($response->json('data'))->pluck('title');
        $this->assertEquals(['High', 'Low'], $titles->all());
    }

    public function test_store_creates_task_with_title_only(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/tasks', ['title' => 'Reactを勉強する']);

        $response->assertCreated()->assertJsonPath('data.rating', 1500)
            ->assertJsonPath('data.status', 'active')
            ->assertJsonPath('data.deadline_type', 'none');
        $this->assertDatabaseHas('tasks', [
            'user_id' => $user->id,
            'title' => 'Reactを勉強する',
            'rating' => 1500,
            'status' => 'active',
        ]);
    }

    public function test_store_requires_title(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/tasks', []);

        $response->assertUnprocessable()->assertJsonValidationErrors('title');
    }

    public function test_store_fails_when_active_task_limit_reached(): void
    {
        $user = User::factory()->create();
        Task::factory(100)->for($user)->create();

        $response = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/tasks', ['title' => '101件目']);

        $response->assertUnprocessable()->assertJsonValidationErrors('title');
        $this->assertDatabaseCount('tasks', 100);
    }

    public function test_update_modifies_own_task(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();

        $response = $this->withHeaders($this->authHeader($user))
            ->patchJson("/api/v1/tasks/{$task->id}", ['deadline_type' => 'today']);

        $response->assertOk();
        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'deadline_type' => 'today']);
    }

    public function test_update_forbidden_for_other_users_task(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $task = Task::factory()->for($owner)->create();

        $response = $this->withHeaders($this->authHeader($other))
            ->patchJson("/api/v1/tasks/{$task->id}", ['deadline_type' => 'today']);

        $response->assertForbidden();
    }

    public function test_destroy_deletes_own_task(): void
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();

        $response = $this->withHeaders($this->authHeader($user))
            ->deleteJson("/api/v1/tasks/{$task->id}");

        $response->assertNoContent();
        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }
}
