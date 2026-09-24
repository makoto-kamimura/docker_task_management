<?php

namespace Tests\Feature\Task;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskTreeTest extends TestCase
{
    use RefreshDatabase;

    private function authHeader(User $user): array
    {
        $token = $user->createToken('api')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_store_creates_subtask_with_parent_id(): void
    {
        $user = User::factory()->create();
        $parent = Task::factory()->for($user)->create(['title' => 'Reactを勉強する']);

        $response = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/tasks', ['title' => 'React Hooks', 'parent_id' => $parent->id]);

        $response->assertCreated()->assertJsonPath('data.parent_id', $parent->id);
        $this->assertDatabaseHas('tasks', [
            'title' => 'React Hooks',
            'parent_id' => $parent->id,
            'user_id' => $user->id,
        ]);
    }

    public function test_store_rejects_parent_of_other_user(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $parent = Task::factory()->for($owner)->create();

        $response = $this->withHeaders($this->authHeader($other))
            ->postJson('/api/v1/tasks', ['title' => '不正な子', 'parent_id' => $parent->id]);

        $response->assertUnprocessable()->assertJsonValidationErrors('parent_id');
    }

    public function test_store_rejects_depth_over_limit(): void
    {
        $user = User::factory()->create();
        $node = Task::factory()->for($user)->create();

        for ($depth = 2; $depth <= 5; $depth++) {
            $node = Task::factory()->for($user)->create(['parent_id' => $node->id]);
        }

        $response = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/tasks', ['title' => '6階層目', 'parent_id' => $node->id]);

        $response->assertUnprocessable()->assertJsonValidationErrors('parent_id');
    }

    public function test_index_returns_roots_only_by_default(): void
    {
        $user = User::factory()->create();
        $root = Task::factory()->for($user)->create(['title' => 'ルート']);
        Task::factory()->for($user)->create(['title' => '子', 'parent_id' => $root->id]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/tasks');

        $response->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'ルート');
    }

    public function test_index_with_scope_all_returns_subtasks(): void
    {
        $user = User::factory()->create();
        $root = Task::factory()->for($user)->create(['title' => 'ルート']);
        Task::factory()->for($user)->create(['title' => '子', 'parent_id' => $root->id]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/tasks?scope=all');

        $response->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_destroy_root_deletes_descendants(): void
    {
        $user = User::factory()->create();
        $root = Task::factory()->for($user)->create();
        $child = Task::factory()->for($user)->create(['parent_id' => $root->id]);
        $grandchild = Task::factory()->for($user)->create(['parent_id' => $child->id]);

        $response = $this->withHeaders($this->authHeader($user))
            ->deleteJson("/api/v1/tasks/{$root->id}");

        $response->assertNoContent();
        $this->assertDatabaseMissing('tasks', ['id' => $child->id]);
        $this->assertDatabaseMissing('tasks', ['id' => $grandchild->id]);
    }

    public function test_update_rejects_self_or_descendant_as_parent(): void
    {
        $user = User::factory()->create();
        $root = Task::factory()->for($user)->create();
        $child = Task::factory()->for($user)->create(['parent_id' => $root->id]);

        $selfResponse = $this->withHeaders($this->authHeader($user))
            ->patchJson("/api/v1/tasks/{$root->id}", ['parent_id' => $root->id]);
        $selfResponse->assertUnprocessable()->assertJsonValidationErrors('parent_id');

        $descendantResponse = $this->withHeaders($this->authHeader($user))
            ->patchJson("/api/v1/tasks/{$root->id}", ['parent_id' => $child->id]);
        $descendantResponse->assertUnprocessable()->assertJsonValidationErrors('parent_id');
    }

    public function test_update_can_move_subtask_to_another_parent(): void
    {
        $user = User::factory()->create();
        $rootA = Task::factory()->for($user)->create();
        $rootB = Task::factory()->for($user)->create();
        $child = Task::factory()->for($user)->create(['parent_id' => $rootA->id]);

        $response = $this->withHeaders($this->authHeader($user))
            ->patchJson("/api/v1/tasks/{$child->id}", ['parent_id' => $rootB->id]);

        $response->assertOk()->assertJsonPath('data.parent_id', $rootB->id);
    }

    public function test_root_limit_does_not_count_subtasks(): void
    {
        $user = User::factory()->create();
        $root = Task::factory()->for($user)->create();
        Task::factory(99)->for($user)->create();
        Task::factory(5)->for($user)->create(['parent_id' => $root->id]);

        $rootResponse = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/tasks', ['title' => '101件目のルート']);
        $rootResponse->assertUnprocessable()->assertJsonValidationErrors('title');

        $subtaskResponse = $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/tasks', ['title' => 'サブタスクは追加できる', 'parent_id' => $root->id]);
        $subtaskResponse->assertCreated();
    }
}
