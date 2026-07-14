<?php

namespace Tests\Unit\Services;

use App\Services\EloRatingService;
use Tests\TestCase;

class EloRatingServiceTest extends TestCase
{
    private EloRatingService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new EloRatingService();
    }

    public function test_equal_ratings_with_established_k_factor(): void
    {
        $result = $this->service->update(
            winnerRating: 1500,
            loserRating: 1500,
            winnerPriorComparisons: 10,
            loserPriorComparisons: 10,
        );

        $this->assertEqualsWithDelta(1516.0, $result['winner'], 0.01);
        $this->assertEqualsWithDelta(1484.0, $result['loser'], 0.01);
    }

    public function test_equal_ratings_with_provisional_k_factor(): void
    {
        $result = $this->service->update(
            winnerRating: 1500,
            loserRating: 1500,
            winnerPriorComparisons: 3,
            loserPriorComparisons: 5,
        );

        $this->assertEqualsWithDelta(1532.0, $result['winner'], 0.01);
        $this->assertEqualsWithDelta(1468.0, $result['loser'], 0.01);
    }

    public function test_lower_rated_upset_gains_more_than_equal_case(): void
    {
        $result = $this->service->update(
            winnerRating: 1400,
            loserRating: 1600,
            winnerPriorComparisons: 20,
            loserPriorComparisons: 20,
        );

        $this->assertEqualsWithDelta(1424.31, $result['winner'], 0.01);
        $this->assertEqualsWithDelta(1575.69, $result['loser'], 0.01);
    }

    public function test_k_factor_is_independent_per_side(): void
    {
        // 勝者は比較回数少（K=64）、敗者は多い（K=32）
        $result = $this->service->update(
            winnerRating: 1500,
            loserRating: 1500,
            winnerPriorComparisons: 2,
            loserPriorComparisons: 15,
        );

        $this->assertEqualsWithDelta(1532.0, $result['winner'], 0.01); // K=64
        $this->assertEqualsWithDelta(1484.0, $result['loser'], 0.01); // K=32
    }
}
