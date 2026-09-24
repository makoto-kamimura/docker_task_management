<?php

namespace App\Services\Push;

use App\Models\PushNotification;
use App\Services\TodayStepKind;

/**
 * 通知の文面。APNs / FCM で同じ言い回しにするためここへ集める。
 * アプリ内の文言（app/web/src/shared/copy.ts の TODAY）と揃える。
 */
class PushMessage
{
    public const TITLE = '🧭 今日の一歩';

    public static function body(PushNotification $notification): string
    {
        $kind = TodayStepKind::tryFrom($notification->kind ?? TodayStepKind::Task->value);
        $task = $notification->task;

        return match (true) {
            $kind === TodayStepKind::Compare => 'やりたいことを二択で選びませんか？',
            $kind === TodayStepKind::Breakdown && $task !== null => "「{$task->title}」を15分でできる一歩に分けませんか？",
            $task !== null => "{$task->title} を始めませんか？",
            default => '今日の一歩を確認しましょう',
        };
    }
}
