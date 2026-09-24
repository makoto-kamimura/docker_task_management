<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TitlePreset extends Model
{
    /** @use HasFactory<\Database\Factories\TitlePresetFactory> */
    use HasFactory;

    /**
     * 誰の週間タイムテーブルにも出てくる生活行動。登録なしでサジェストされるようにここに持ち、
     * ユーザーが登録した項目はこの後ろに並ぶ。既定なので削除はできない。
     *
     * 並びは 1 日の流れ（起床 → 日中 → 就寝前）に沿わせている。入力欄に何も打っていないときは
     * この順にそのまま出るので、探すより先に「その時間帯にありそうなもの」が目に入る。
     */
    public const DEFAULT_LABELS = [
        '睡眠',
        '身支度',
        '朝食',
        '通勤・通学',
        '仕事',
        '勉強',
        '昼食',
        '休憩',
        '家事',
        '育児',
        '買い物',
        '夕食',
        'お風呂',
        'ジム',
        '散歩',
        '趣味',
        '夜食',
        '自由時間',
    ];

    protected $fillable = [
        'user_id',
        'label',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
