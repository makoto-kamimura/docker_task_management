<?php

namespace Tests\Feature\Schedule;

use App\Models\TitlePreset;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TitlePresetTest extends TestCase
{
    use RefreshDatabase;

    private function authHeader(User $user): array
    {
        $token = $user->createToken('api')->plainTextToken;

        return ['Authorization' => "Bearer {$token}"];
    }

    public function test_index_returns_defaults_for_a_new_user(): void
    {
        $user = User::factory()->create();

        $response = $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/title-presets')
            ->assertOk()
            ->assertJsonCount(count(TitlePreset::DEFAULT_LABELS), 'data')
            ->assertJsonPath('data.0.label', '睡眠')
            ->assertJsonPath('data.0.id', null)
            ->assertJsonPath('data.0.is_default', true);

        $this->assertSame(
            TitlePreset::DEFAULT_LABELS,
            array_column($response->json('data'), 'label'),
        );
    }

    public function test_index_puts_own_presets_after_the_defaults_in_registration_order(): void
    {
        $user = User::factory()->create();
        TitlePreset::factory()->for($user)->create(['label' => 'ヨガ']);
        TitlePreset::factory()->for($user)->create(['label' => '読書']);

        $data = $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/title-presets')
            ->assertOk()
            ->json('data');

        $this->assertSame(
            [...TitlePreset::DEFAULT_LABELS, 'ヨガ', '読書'],
            array_column($data, 'label'),
        );
        $this->assertFalse($data[count(TitlePreset::DEFAULT_LABELS)]['is_default']);
    }

    /** 既定の項目が後から増えた場合、先に同じ名前を登録していた人にも二重に出さない。 */
    public function test_index_hides_own_preset_that_collides_with_a_default(): void
    {
        $user = User::factory()->create();
        TitlePreset::factory()->for($user)->create(['label' => TitlePreset::DEFAULT_LABELS[0]]);

        $data = $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/title-presets')
            ->assertOk()
            ->json('data');

        $this->assertSame(TitlePreset::DEFAULT_LABELS, array_column($data, 'label'));
    }

    public function test_index_hides_other_users_presets(): void
    {
        $user = User::factory()->create();
        TitlePreset::factory()->create(['label' => '他人の項目']);

        $this->withHeaders($this->authHeader($user))
            ->getJson('/api/v1/title-presets')
            ->assertOk()
            ->assertJsonCount(count(TitlePreset::DEFAULT_LABELS), 'data')
            ->assertJsonMissing(['label' => '他人の項目']);
    }

    public function test_store_registers_a_preset(): void
    {
        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/title-presets', ['label' => 'ヨガ'])
            ->assertCreated()
            ->assertJsonPath('data.label', 'ヨガ')
            ->assertJsonPath('data.is_default', false);

        $this->assertDatabaseHas('title_presets', [
            'user_id' => $user->id,
            'label' => 'ヨガ',
        ]);
    }

    public function test_store_trims_surrounding_spaces(): void
    {
        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/title-presets', ['label' => '  ヨガ  '])
            ->assertCreated()
            ->assertJsonPath('data.label', 'ヨガ');
    }

    public function test_store_requires_a_label(): void
    {
        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/title-presets', ['label' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('label');
    }

    public function test_store_rejects_a_duplicate_of_own_preset(): void
    {
        $user = User::factory()->create();
        TitlePreset::factory()->for($user)->create(['label' => 'ヨガ']);

        $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/title-presets', ['label' => 'ヨガ'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('label');

        $this->assertSame(1, TitlePreset::where('user_id', $user->id)->count());
    }

    public function test_store_rejects_a_default_label(): void
    {
        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/title-presets', ['label' => '睡眠'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('label');

        $this->assertDatabaseCount('title_presets', 0);
    }

    public function test_store_allows_the_same_label_for_another_user(): void
    {
        $other = User::factory()->create();
        TitlePreset::factory()->for($other)->create(['label' => 'ヨガ']);

        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->postJson('/api/v1/title-presets', ['label' => 'ヨガ'])
            ->assertCreated();

        $this->assertSame(2, TitlePreset::where('label', 'ヨガ')->count());
    }

    public function test_destroy_deletes_own_preset(): void
    {
        $user = User::factory()->create();
        $preset = TitlePreset::factory()->for($user)->create(['label' => 'ヨガ']);

        $this->withHeaders($this->authHeader($user))
            ->deleteJson("/api/v1/title-presets/{$preset->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('title_presets', ['id' => $preset->id]);
    }

    public function test_destroy_forbidden_for_other_users_preset(): void
    {
        $preset = TitlePreset::factory()->create(['label' => '他人の項目']);
        $user = User::factory()->create();

        $this->withHeaders($this->authHeader($user))
            ->deleteJson("/api/v1/title-presets/{$preset->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('title_presets', ['id' => $preset->id]);
    }

    public function test_deleting_a_user_removes_their_presets(): void
    {
        $user = User::factory()->create();
        TitlePreset::factory()->for($user)->create(['label' => 'ヨガ']);

        $user->delete();

        $this->assertDatabaseCount('title_presets', 0);
    }

    public function test_requires_authentication(): void
    {
        $this->getJson('/api/v1/title-presets')->assertUnauthorized();
    }
}
