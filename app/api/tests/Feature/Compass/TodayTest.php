<?php

namespace Tests\Feature\Compass;

use App\Models\Comparison;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TodayTest extends TestCase
{
    use RefreshDatabase;

    private function authHeader(User $user): array
    {
        $token = $user->createToken('api')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_returns_null_with_no_tasks(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/compass/today');

        $response->assertOk()
            ->assertJson(['data' => null])
            ->assertJsonPath('kind', 'empty');
    }

    public function test_returns_recommended_task(): void
    {
        $user = User::factory()->create();
        $expected = Task::factory()->for($user)->create(['rating' => 2000, 'deadline_type' => 'today']);
        Task::factory()->for($user)->create(['rating' => 1000, 'deadline_type' => 'none']);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/compass/today');

        $response->assertOk()
            ->assertJsonPath('kind', 'task')
            ->assertJsonPath('data.id', $expected->id);
    }

    public function test_returns_leaf_of_recommended_root_with_path(): void
    {
        $user = User::factory()->create();
        $root = Task::factory()->for($user)->create([
            'title' => 'Reactを勉強する',
            'rating' => 2000,
            'deadline_type' => 'today',
        ]);
        Task::factory()->for($user)->create(['rating' => 1000, 'deadline_type' => 'none']);

        $middle = Task::factory()->for($user)->create(['title' => 'useContext', 'parent_id' => $root->id]);
        $leaf = Task::factory()->for($user)->create(['title' => '公式ページを15分読む', 'parent_id' => $middle->id]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/compass/today');

        $response->assertOk()
            ->assertJsonPath('data.id', $leaf->id)
            ->assertJsonPath('path.0.title', 'Reactを勉強する')
            ->assertJsonPath('path.1.title', 'useContext');
    }

    public function test_prefers_leaf_never_done_before(): void
    {
        $user = User::factory()->create();
        $root = Task::factory()->for($user)->create(['rating' => 2000, 'deadline_type' => 'today']);
        Task::factory()->for($user)->create(['rating' => 1000, 'deadline_type' => 'none']);

        Task::factory()->for($user)->create([
            'parent_id' => $root->id,
            'last_done_at' => now()->subDay(),
        ]);
        $neverDone = Task::factory()->for($user)->create([
            'parent_id' => $root->id,
            'last_done_at' => null,
        ]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/compass/today');

        $response->assertOk()->assertJsonPath('data.id', $neverDone->id);
    }

    public function test_skips_leaf_marked_as_needs_breakdown(): void
    {
        $user = User::factory()->create();
        Task::factory()->for($user)->create(['rating' => 2000, 'needs_breakdown' => true]);
        $doable = Task::factory()->for($user)->create(['rating' => 1000]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/compass/today');

        $response->assertOk()->assertJsonPath('data.id', $doable->id);
    }

    public function test_recommends_child_of_needs_breakdown_task(): void
    {
        $user = User::factory()->create();
        $root = Task::factory()->for($user)->create(['rating' => 2000, 'needs_breakdown' => true]);
        $child = Task::factory()->for($user)->create(['parent_id' => $root->id]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/compass/today');

        $response->assertOk()->assertJsonPath('data.id', $child->id);
    }

    public function test_suggests_comparison_when_no_leaf_is_doable(): void
    {
        $user = User::factory()->create();
        Task::factory()->for($user)->create(['needs_breakdown' => true]);
        Task::factory()->for($user)->create(['needs_breakdown' => true]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/compass/today');

        $response->assertOk()
            ->assertJsonPath('kind', 'compare')
            ->assertJson(['data' => null]);
    }

    public function test_suggests_breakdown_once_ranking_is_settled(): void
    {
        $user = User::factory()->create();
        $winner = Task::factory()->for($user)->create(['rating' => 1600, 'needs_breakdown' => true]);
        $loser = Task::factory()->for($user)->create(['rating' => 1400, 'needs_breakdown' => true]);
        Comparison::create([
            'user_id' => $user->id,
            'winner_task_id' => $winner->id,
            'loser_task_id' => $loser->id,
            'compared_at' => now(),
        ]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/compass/today');

        // 全ペアを比べ終えたら優先度は確定。上位のやりたいことから細分化する。
        $response->assertOk()
            ->assertJsonPath('kind', 'breakdown')
            ->assertJsonPath('data.id', $winner->id);
    }

    public function test_suggests_breakdown_when_only_one_root_exists(): void
    {
        $user = User::factory()->create();
        $root = Task::factory()->for($user)->create(['needs_breakdown' => true]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/compass/today');

        // 1 件しかなければ比べようがないので、そのまま細分化へ進む。
        $response->assertOk()
            ->assertJsonPath('kind', 'breakdown')
            ->assertJsonPath('data.id', $root->id);
    }

    public function test_breakdown_target_includes_path(): void
    {
        $user = User::factory()->create();
        $root = Task::factory()->for($user)->create(['title' => 'Reactを勉強する']);
        $child = Task::factory()->for($user)->create([
            'title' => 'React Hooks',
            'parent_id' => $root->id,
            'needs_breakdown' => true,
        ]);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/compass/today');

        $response->assertOk()
            ->assertJsonPath('kind', 'breakdown')
            ->assertJsonPath('data.id', $child->id)
            ->assertJsonPath('path.0.title', 'Reactを勉強する');
    }
}
