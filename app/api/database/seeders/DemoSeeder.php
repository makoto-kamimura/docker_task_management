<?php

namespace Database\Seeders;

use App\Models\Comparison;
use App\Models\Task;
use App\Models\TaskLog;
use App\Models\User;
use App\Services\EloRatingService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * 公開デモ用のアカウントとサンプルデータ。
 *
 * デモユーザーがいなければ作る。サンプルデータは、デモユーザーのやりたいこと・時間割・履歴書が
 * すべて空のときだけ入れる（訪問者が登録したデータは上書きしない）。何度実行してもよい。
 */
class DemoSeeder extends Seeder
{
    public const EMAIL = 'test@example.com';

    public const PASSWORD = 'password';

    /**
     * やりたいこと（ルート）と、その下の子タスク。二択での優先順位が高い順に並べる。
     * 子は [タイトル, 所要時間(分), 子の配列] または分解待ちの印（needs_breakdown）を持つ。
     */
    private const TREES = [
        [
            'title' => '応用情報技術者試験に合格する',
            'deadline_type' => 'month',
            'children' => [
                ['title' => '午前の過去問を10問解く', 'duration' => 15],
                ['title' => '参考書の1節を読む', 'duration' => 30],
                ['title' => '午後問題の対策', 'children' => [
                    ['title' => '午後の過去問を1問解く', 'duration' => 30],
                    ['title' => '間違えた問題の解説を読み直す', 'duration' => 15],
                ]],
                ['title' => '試験の申し込み期間を確認する', 'duration' => 15],
            ],
        ],
        [
            'title' => '英語で海外の人と話せるようになる',
            'deadline_type' => 'none',
            'children' => [
                ['title' => '瞬間英作文を1ユニット', 'duration' => 15],
                ['title' => '英語のニュースを1本聞く', 'duration' => 15],
                ['title' => 'オンライン英会話の体験を予約する', 'duration' => 15],
            ],
        ],
        [
            'title' => 'フルマラソンを完走する',
            'deadline_type' => 'none',
            'children' => [
                ['title' => '近所を20分ジョギングする', 'duration' => 30],
                ['title' => '出られる大会を1つ調べる', 'duration' => 15],
                ['title' => 'ランニングシューズを選ぶ', 'needs_breakdown' => true],
            ],
        ],
        [
            'title' => '部屋を片づける',
            'deadline_type' => 'week',
            'children' => [
                ['title' => '本棚を1段だけ整理する', 'duration' => 15],
                ['title' => '着ていない服を5着選ぶ', 'duration' => 15],
            ],
        ],
        [
            'title' => '家族で温泉旅行に行く',
            'deadline_type' => 'month',
            'needs_breakdown' => true,
        ],
    ];

    /**
     * 実施の記録。[何日前, 葉のタイトル, 結果, 端末]。連続日数と今週の完了数が出るように並べる。
     */
    private const LOGS = [
        [6, '近所を20分ジョギングする', 'skipped', 'mobile'],
        [5, '瞬間英作文を1ユニット', 'done', 'watch'],
        [4, '午前の過去問を10問解く', 'done', 'web'],
        [3, '本棚を1段だけ整理する', 'done', 'mobile'],
        [2, '参考書の1節を読む', 'partial', 'web'],
        [1, '英語のニュースを1本聞く', 'done', 'watch'],
    ];

    /**
     * 週間の時間割。[曜日の区分, タイトル, 開始, 終了]（時刻は "HH:MM"、終了の 24:00 は日付の終わり）。
     * 塗り残しが隙間時間になる。
     */
    private const WEEKDAY_BLOCKS = [
        ['睡眠', '00:00', '06:30'],
        ['身支度', '06:30', '07:00'],
        ['朝食', '07:00', '07:30'],
        ['通勤・通学', '07:30', '08:30'],
        ['仕事', '09:00', '12:00'],
        ['昼食', '12:00', '13:00'],
        ['仕事', '13:00', '18:00'],
        ['通勤・通学', '18:00', '19:00'],
        ['夕食', '19:00', '20:00'],
        ['お風呂', '20:30', '21:00'],
        ['睡眠', '23:30', '24:00'],
    ];

    private const WEEKEND_BLOCKS = [
        ['睡眠', '00:00', '07:30'],
        ['朝食', '08:00', '09:00'],
        ['家事', '09:00', '10:30'],
        ['昼食', '12:00', '13:00'],
        ['買い物', '14:00', '15:30'],
        ['夕食', '18:30', '19:30'],
        ['お風呂', '20:00', '20:30'],
        ['睡眠', '23:30', '24:00'],
    ];

    public function __construct(private readonly EloRatingService $eloRatingService)
    {
    }

    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => self::EMAIL],
            [
                'name' => 'デモユーザー',
                'password' => bcrypt(self::PASSWORD),
                'email_verified_at' => now(),
            ],
        );

        if ($user->tasks()->exists()
            || $user->scheduleBlocks()->exists()
            || $user->resumeEntries()->exists()) {
            $this->command?->info('デモユーザーにデータがあるため、サンプルデータは入れません。');

            return;
        }

        DB::transaction(function () use ($user) {
            $roots = $this->seedTasks($user);
            $this->seedComparisons($user, $roots);
            $this->seedLogs($user);
            $this->seedSchedule($user);
            $this->seedResume($user, $roots);
        });

        $this->command?->info('デモユーザーにサンプルデータを入れました: '.self::EMAIL);
    }

    /**
     * @return list<Task> ルート（TREES の順）
     */
    private function seedTasks(User $user): array
    {
        $roots = [];

        foreach (self::TREES as $tree) {
            $roots[] = $this->createNode($user, $tree, null, $tree['deadline_type']);
        }

        return $roots;
    }

    private function createNode(User $user, array $node, ?Task $parent, string $deadlineType): Task
    {
        $task = $user->tasks()->create([
            'parent_id' => $parent?->id,
            'title' => $node['title'],
            'duration_minutes' => $node['duration'] ?? null,
            'deadline_type' => $parent === null ? $deadlineType : 'none',
            'rating' => 1500,
            'status' => 'active',
            'needs_breakdown' => $node['needs_breakdown'] ?? false,
        ]);

        foreach ($node['children'] ?? [] as $child) {
            $this->createNode($user, $child, $task, $deadlineType);
        }

        return $task;
    }

    /**
     * ルートのすべての組み合わせを、TREES の順（上が重要）で二択に答えたことにする。
     * レーティングは ComparisonController と同じ Elo の計算で更新する。
     *
     * @param  list<Task>  $roots
     */
    private function seedComparisons(User $user, array $roots): void
    {
        $comparedAt = now()->subDays(7)->setTime(21, 0);
        $counts = array_fill(0, count($roots), 0);

        for ($i = 0; $i < count($roots); $i++) {
            for ($j = $i + 1; $j < count($roots); $j++) {
                $winner = $roots[$i];
                $loser = $roots[$j];

                $result = $this->eloRatingService->update(
                    winnerRating: $winner->rating,
                    loserRating: $loser->rating,
                    winnerPriorComparisons: $counts[$i],
                    loserPriorComparisons: $counts[$j],
                );

                $winner->update(['rating' => $result['winner']]);
                $loser->update(['rating' => $result['loser']]);
                $counts[$i]++;
                $counts[$j]++;

                $comparedAt = $comparedAt->copy()->addMinute();
                Comparison::create([
                    'user_id' => $user->id,
                    'winner_task_id' => $winner->id,
                    'loser_task_id' => $loser->id,
                    'compared_at' => $comparedAt,
                ]);
            }
        }
    }

    private function seedLogs(User $user): void
    {
        $leaves = $user->tasks()->get()->keyBy('title');

        foreach (self::LOGS as [$daysAgo, $title, $result, $source]) {
            $task = $leaves->get($title);
            $startedAt = Carbon::now(config('app.timezone'))->subDays($daysAgo)->setTime(20, 0);
            $elapsed = $result === 'skipped' ? 0 : ($task->duration_minutes ?? 15) * 60;

            TaskLog::create([
                'task_id' => $task->id,
                'started_at' => $startedAt,
                'finished_at' => $startedAt->copy()->addSeconds($elapsed),
                'result' => $result,
                'elapsed_seconds' => $elapsed,
                'source' => $source,
            ]);

            if ($result !== 'skipped') {
                $task->update(['last_done_at' => $startedAt->copy()->addSeconds($elapsed)]);
            }
        }
    }

    private function seedSchedule(User $user): void
    {
        // 0 = 日曜、6 = 土曜（ScheduleBlock::DAY_LABELS）
        foreach (range(0, 6) as $day) {
            $blocks = in_array($day, [0, 6], true) ? self::WEEKEND_BLOCKS : self::WEEKDAY_BLOCKS;

            foreach ($blocks as [$title, $start, $end]) {
                $user->scheduleBlocks()->create([
                    'title' => $title,
                    'day_of_week' => $day,
                    'start_minute' => $this->minutes($start),
                    'end_minute' => $this->minutes($end),
                ]);
            }
        }
    }

    /**
     * @param  list<Task>  $roots
     */
    private function seedResume(User $user, array $roots): void
    {
        $user->resumeProfile()->create([
            'name' => '山田 太郎',
            'name_kana' => 'やまだ たろう',
            'motivation' => '身につけた技術を、海外のチームとも一緒に生かしたいと考えています。',
            'self_pr' => '毎日15分の積み重ねを続けることが得意です。',
        ]);

        $entries = [
            ['current', 'education', 2016, 3, '〇〇大学 経済学部 卒業', null],
            ['current', 'work', 2016, 4, '株式会社〇〇 入社（営業部）', null],
            ['current', 'work', 2021, 4, '社内公募で情報システム部に異動', null],
            ['current', 'license', 2022, 11, '基本情報技術者試験 合格', null],
            ['future', 'license', (int) now()->addYear()->format('Y'), 4, '応用情報技術者試験 合格', $roots[0]],
            ['future', 'work', (int) now()->addYears(3)->format('Y'), null, '海外のチームと英語で開発を進める', $roots[1]],
        ];

        foreach ($entries as [$timeline, $kind, $year, $month, $content, $task]) {
            $user->resumeEntries()->create([
                'timeline' => $timeline,
                'kind' => $kind,
                'year' => $year,
                'month' => $month,
                'content' => $content,
                'task_id' => $task?->id,
            ]);
        }
    }

    private function minutes(string $time): int
    {
        [$hours, $minutes] = array_map('intval', explode(':', $time));

        return $hours * 60 + $minutes;
    }
}
