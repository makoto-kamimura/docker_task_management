<?php

namespace Tests\Feature\Resume;

use App\Models\ResumeProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ResumeProfileTest extends TestCase
{
    use RefreshDatabase;

    private function authHeader(User $user): array
    {
        $token = $user->createToken('api')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_show_returns_every_field_as_null_before_anything_is_entered(): void
    {
        $user = User::factory()->create();

        $profile = $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/resume')
            ->assertOk()
            ->assertJsonPath('data.entries', [])
            ->json('data.profile');

        $this->assertSame(ResumeProfile::fields(), array_keys($profile));
        $this->assertSame([], array_filter($profile, fn ($value) => $value !== null));
    }

    public function test_update_saves_only_sent_fields_and_every_field_is_optional(): void
    {
        $user = User::factory()->create();
        $headers = $this->authHeader($user);

        $this->withHeaders($headers)
            ->patchJson('/api/v1/resume/profile', ['name' => '山田 太郎', 'commute_minutes' => 45, 'has_spouse' => false])
            ->assertOk()
            ->assertJsonPath('data.name', '山田 太郎')
            ->assertJsonPath('data.commute_minutes', 45)
            ->assertJsonPath('data.has_spouse', false)
            ->assertJsonPath('data.address', null);

        // 別の項目だけ送っても、先に入れた項目は消えない。空文字は null として消える。
        $this->withHeaders($headers)
            ->patchJson('/api/v1/resume/profile', ['self_pr' => '粘り強い', 'name' => ''])
            ->assertOk()
            ->assertJsonPath('data.self_pr', '粘り強い')
            ->assertJsonPath('data.name', null)
            ->assertJsonPath('data.commute_minutes', 45);

        $this->assertSame(1, ResumeProfile::query()->count());
    }

    /** 住所・電話などの個人情報は DB に平文で残さない。 */
    public function test_personal_fields_are_encrypted_at_rest(): void
    {
        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->patchJson('/api/v1/resume/profile', [
                'address' => '東京都千代田区千代田1-1',
                'phone' => '090-1234-5678',
                'birth_date' => '1990-04-01',
            ])
            ->assertOk()
            ->assertJsonPath('data.address', '東京都千代田区千代田1-1');

        $raw = DB::table('resume_profiles')->where('user_id', $user->id)->first();

        $this->assertNotSame('東京都千代田区千代田1-1', $raw->address);
        $this->assertStringNotContainsString('090-1234-5678', $raw->phone);
        $this->assertStringNotContainsString('1990', $raw->birth_date);
    }

    public function test_update_validates_formats(): void
    {
        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->patchJson('/api/v1/resume/profile', [
                'postal_code' => '12-34',
                'phone' => 'abc',
                'email' => 'not-an-email',
                'birth_date' => now()->addDay()->toDateString(),
                'dependents_count' => 99,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['postal_code', 'phone', 'email', 'birth_date', 'dependents_count']);
    }

    public function test_profile_is_private_to_each_user(): void
    {
        $owner = User::factory()->create();
        ResumeProfile::factory()->for($owner)->create(['name' => '持ち主']);
        $other = User::factory()->create();

        $this->withHeaders($this->authHeader($other))
            ->getJson('/api/v1/resume')
            ->assertOk()
            ->assertJsonPath('data.profile.name', null);
    }
}
