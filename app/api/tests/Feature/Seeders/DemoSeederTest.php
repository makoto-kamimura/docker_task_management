<?php

namespace Tests\Feature\Seeders;

use App\Models\User;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DemoSeederTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::parse('2026-07-14 12:00:00', 'Asia/Tokyo'));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function authHeader(User $user): array
    {
        $token = $user->createToken('api')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_creates_demo_user_with_sample_data(): void
    {
        $this->seed(DemoSeeder::class);

        $user = User::where('email', DemoSeeder::EMAIL)->firstOrFail();
        $this->assertTrue(Hash::check(DemoSeeder::PASSWORD, $user->password));
        $this->assertNotNull($user->email_verified_at);

        $this->assertSame(5, $user->tasks()->whereNull('parent_id')->count());
        $this->assertSame(10, $user->comparisons()->count());
        $this->assertSame(7 * 11 - 2 * 3, $user->scheduleBlocks()->count());
        $this->assertSame(6, $user->resumeEntries()->count());
        $this->assertNotNull($user->resumeProfile);
    }

    public function test_sample_data_fills_today_step_dashboard_and_ranking(): void
    {
        $this->seed(DemoSeeder::class);
        $user = User::where('email', DemoSeeder::EMAIL)->firstOrFail();
        $headers = $this->authHeader($user);

        // 二択は全組み合わせを回答済みなので、今日の一歩は最上位のやりたいことの未実施の葉になる。
        $this->getJson('/api/v1/compass/today', $headers)
            ->assertOk()
            ->assertJsonPath('kind', 'task')
            ->assertJsonPath('data.title', '午後の過去問を1問解く');

        $this->getJson('/api/v1/dashboard', $headers)
            ->assertOk()
            ->assertJsonPath('data.streak_days', 5);

        $roots = $user->tasks()->whereNull('parent_id')->orderByDesc('rating')->pluck('title')->all();
        $this->assertSame('応用情報技術者試験に合格する', $roots[0]);
        $this->assertSame('家族で温泉旅行に行く', $roots[4]);
    }

    public function test_does_not_touch_existing_demo_data(): void
    {
        $user = User::factory()->create(['email' => DemoSeeder::EMAIL]);
        $user->tasks()->create(['title' => '訪問者が登録したこと']);

        $this->seed(DemoSeeder::class);

        $this->assertSame(['訪問者が登録したこと'], $user->tasks()->pluck('title')->all());
        $this->assertSame(0, $user->scheduleBlocks()->count());
        $this->assertSame(1, User::where('email', DemoSeeder::EMAIL)->count());
    }

    public function test_running_twice_does_not_duplicate(): void
    {
        $this->seed(DemoSeeder::class);
        $this->seed(DemoSeeder::class);

        $user = User::where('email', DemoSeeder::EMAIL)->firstOrFail();
        $this->assertSame(5, $user->tasks()->whereNull('parent_id')->count());
    }
}
