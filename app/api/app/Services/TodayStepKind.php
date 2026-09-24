<?php

namespace App\Services;

/**
 * 「今日の一歩」として何を実施するか。
 * 隙間時間に手が止まらないよう、実施できるやりたいことが無いときは
 * 二択・細分化そのものを一歩として案内する（design.md 8.2）。
 */
enum TodayStepKind: string
{
    /** 実施できるやりたいこと（葉）がある。 */
    case Task = 'task';

    /** 実施できる葉が無い。まず「二択で選ぶ」で優先度を決める。 */
    case Compare = 'compare';

    /** 優先度は確定済み。分解待ちのやりたいことを細分化する。 */
    case Breakdown = 'breakdown';

    /** やりたいこと自体が無い。まず登録してもらう。 */
    case Nothing = 'empty';
}
