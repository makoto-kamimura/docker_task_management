<?php

namespace Tests\Feature\Comparison;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComparisonFlowTest extends TestCase
{
    use RefreshDatabase;

    private function authHeader(User $user): array
    {
        $token = $user->createToken('api')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_next_returns_null_when_fewer_than_two_tasks(): void
    {
        $user = User::factory()->create();
        Task::factory()->for($user)->create();

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/comparisons/next');

        $response->assertOk()->assertJson(['data' => null]);
    }

    public function test_next_returns_a_pair(): void
    {
        $user = User::factory()->create();
        Task::factory(3)->for($user)->create();

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/comparisons/next');

        $response->assertOk()
            ->assertJsonStructure(['data' => ['left' => ['id', 'title'], 'right' => ['id', 'title']]]);
    }

    public function test_store_updates_ratings_and_records_history(): void
    {
        $user = User::factory()->create();
        $winner = Task::factory()->for($user)->create(['rating' => 1500]);
        $loser = Task::factory()->for($user)->create(['rating' => 1500]);

        $response = $this->withHeaders($this->authHeader($user))->postJson('/api/v1/comparisons', [
            'winner_task_id' => $winner->id,
            'loser_task_id' => $loser->id,
        ]);

        $response->assertCreated();

        $winner->refresh();
        $loser->refresh();

        $this->assertGreaterThan(1500, $winner->rating);
        $this->assertLessThan(1500, $loser->rating);
        $this->assertDatabaseHas('comparisons', [
            'user_id' => $user->id,
            'winner_task_id' => $winner->id,
            'loser_task_id' => $loser->id,
        ]);
    }

    public function test_store_rejects_task_belonging_to_another_user(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $myTask = Task::factory()->for($user)->create();
        $othersTask = Task::factory()->for($other)->create();

        $response = $this->withHeaders($this->authHeader($user))->postJson('/api/v1/comparisons', [
            'winner_task_id' => $myTask->id,
            'loser_task_id' => $othersTask->id,
        ]);

        $response->assertUnprocessable();
    }

    public function test_repeated_wins_converge_ranking_order(): void
    {
        $user = User::factory()->create();
        $strong = Task::factory()->for($user)->create(['rating' => 1500]);
        $weak = Task::factory()->for($user)->create(['rating' => 1500]);

        $headers = $this->authHeader($user);

        for ($i = 0; $i < 15; $i++) {
            $this->withHeaders($headers)->postJson('/api/v1/comparisons', [
                'winner_task_id' => $strong->id,
                'loser_task_id' => $weak->id,
            ])->assertCreated();
        }

        $response = $this->withHeaders($headers)->getJson('/api/v1/tasks');
        $titles = collect($response->json('data'))->pluck('id');

        $this->assertEquals($strong->id, $titles->first());
        $this->assertEquals($weak->id, $titles->last());
    }
}
