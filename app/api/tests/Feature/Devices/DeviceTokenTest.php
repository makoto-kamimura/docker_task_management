<?php

namespace Tests\Feature\Devices;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeviceTokenTest extends TestCase
{
    use RefreshDatabase;

    private function authHeader(User $user): array
    {
        $token = $user->createToken('api')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_registers_a_device_token(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeader($user))->postJson('/api/v1/devices', [
            'platform' => 'ios',
            'token' => 'abc123',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('device_tokens', [
            'user_id' => $user->id,
            'platform' => 'ios',
            'token' => 'abc123',
        ]);
    }

    public function test_reregistering_same_token_updates_owner(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $this->withHeaders($this->authHeader($userA))->postJson('/api/v1/devices', [
            'platform' => 'ios',
            'token' => 'shared-token',
        ])->assertCreated();

        // Sanctum の guard は同一テストメソッド内で最初に解決したユーザーをキャッシュするため、
        // 別ユーザーとして2回目のリクエストを送る前に明示的に破棄する
        $this->app['auth']->forgetGuards();

        $this->withHeaders($this->authHeader($userB))->postJson('/api/v1/devices', [
            'platform' => 'android',
            'token' => 'shared-token',
        ])->assertCreated();

        $this->assertDatabaseCount('device_tokens', 1);
        $this->assertDatabaseHas('device_tokens', [
            'user_id' => $userB->id,
            'platform' => 'android',
            'token' => 'shared-token',
        ]);
    }

    public function test_rejects_invalid_platform(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeader($user))->postJson('/api/v1/devices', [
            'platform' => 'windows',
            'token' => 'abc123',
        ]);

        $response->assertUnprocessable();
    }
}
