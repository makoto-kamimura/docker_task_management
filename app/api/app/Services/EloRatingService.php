<?php

namespace App\Services;

class EloRatingService
{
    private const DEFAULT_K = 32;
    private const PROVISIONAL_K = 64;
    private const PROVISIONAL_THRESHOLD = 10;

    /**
     * @return array{winner: float, loser: float}
     */
    public function update(
        float $winnerRating,
        float $loserRating,
        int $winnerPriorComparisons,
        int $loserPriorComparisons,
    ): array {
        $winnerExpected = $this->expectedScore($winnerRating, $loserRating);
        $loserExpected = $this->expectedScore($loserRating, $winnerRating);

        $winnerK = $this->kFactor($winnerPriorComparisons);
        $loserK = $this->kFactor($loserPriorComparisons);

        return [
            'winner' => $winnerRating + $winnerK * (1 - $winnerExpected),
            'loser' => $loserRating + $loserK * (0 - $loserExpected),
        ];
    }

    private function expectedScore(float $rating, float $opponentRating): float
    {
        return 1 / (1 + 10 ** (($opponentRating - $rating) / 400));
    }

    private function kFactor(int $priorComparisons): int
    {
        return $priorComparisons < self::PROVISIONAL_THRESHOLD
            ? self::PROVISIONAL_K
            : self::DEFAULT_K;
    }
}
