<?php

namespace Tests\Feature\Compass;

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

        $response->assertOk()->assertJson(['data' => null]);
    }

    public function test_returns_recommended_task(): void
    {
        $user = User::factory()->create();
        $expected = Task::factory()->for($user)->create(['rating' => 2000, 'deadline_type' => 'today']);
        Task::factory()->for($user)->create(['rating' => 1000, 'deadline_type' => 'none']);

        $response = $this->withHeaders($this->authHeader($user))->getJson('/api/v1/compass/today');

        $response->assertOk()->assertJsonPath('data.id', $expected->id);
    }
}
