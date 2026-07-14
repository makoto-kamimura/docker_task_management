<?php

namespace Tests\Unit\Services;

use App\Models\Comparison;
use App\Models\Task;
use App\Models\User;
use App\Services\ComparisonPairSelector;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComparisonPairSelectorTest extends TestCase
{
    use RefreshDatabase;

    private ComparisonPairSelector $selector;

    protected function setUp(): void
    {
        parent::setUp();
        $this->selector = new ComparisonPairSelector();
    }

    public function test_returns_null_when_fewer_than_two_active_tasks(): void
    {
        $user = User::factory()->create();
        Task::factory()->for($user)->create();

        $this->assertNull($this->selector->selectPair($user));
    }

    public function test_prefers_pair_with_smallest_rating_gap(): void
    {
        $user = User::factory()->create();
        $close1 = Task::factory()->for($user)->create(['rating' => 1500]);
        $close2 = Task::factory()->for($user)->create(['rating' => 1510]);
        Task::factory()->for($user)->create(['rating' => 1800]);

        [$a, $b] = $this->selector->selectPair($user);

        $this->assertEqualsCanonicalizing([$close1->id, $close2->id], [$a->id, $b->id]);
    }

    public function test_excludes_pairs_already_seen_in_session(): void
    {
        $user = User::factory()->create();
        $t1 = Task::factory()->for($user)->create(['rating' => 1500]);
        $t2 = Task::factory()->for($user)->create(['rating' => 1500]);
        $t3 = Task::factory()->for($user)->create(['rating' => 1500]);

        $pair = $this->selector->selectPair($user, [[$t1->id, $t2->id]]);

        $ids = [$pair[0]->id, $pair[1]->id];
        sort($ids);
        $this->assertNotEquals([$t1->id, $t2->id], $ids);
        $this->assertContains($t3->id, $ids);
    }

    public function test_pool_prioritizes_tasks_with_fewer_comparisons_over_smaller_rating_gap(): void
    {
        $user = User::factory()->create();

        // rating差が最小(1)だが、比較回数が多い(20回)のでプール(サイズ10)から除外されるべきペア
        $p = Task::factory()->for($user)->create(['rating' => 1500]);
        $q = Task::factory()->for($user)->create(['rating' => 1501]);
        for ($i = 0; $i < 20; $i++) {
            Comparison::create([
                'user_id' => $user->id,
                'winner_task_id' => $p->id,
                'loser_task_id' => $q->id,
                'compared_at' => now(),
            ]);
        }

        // 比較回数0件、rating差は100刻みで大きいが、プール優先で選ばれるべき10件
        $poolTaskIds = [];
        for ($i = 0; $i < 10; $i++) {
            $poolTaskIds[] = Task::factory()->for($user)->create(['rating' => 1000 + $i * 100])->id;
        }

        $pair = $this->selector->selectPair($user);
        $resultIds = [$pair[0]->id, $pair[1]->id];

        sort($resultIds);
        $expectedExcluded = [$p->id, $q->id];
        sort($expectedExcluded);
        $this->assertNotEquals($expectedExcluded, $resultIds);
        foreach ($resultIds as $id) {
            $this->assertContains($id, $poolTaskIds);
        }
    }
}
