<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 2026_08_31_000100_create_schedule_blocks_table は元々「日付ベース」（date 列）で書かれ、
 * 一部の環境（デモ等）で一度実行された後に「曜日ベース」（day_of_week 列）へ内容を書き換えた。
 * マイグレーションはファイル名で実行済み判定されるため、その環境では新しい内容が
 * 再実行されず date 列のまま取り残されていた。schedule_blocks は空でも安全に移行できるため、
 * date → day_of_week へ揃える。既に day_of_week を持つ環境（新規構築時など）には何もしない。
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('schedule_blocks', 'date') || Schema::hasColumn('schedule_blocks', 'day_of_week')) {
            return;
        }

        // schedule_blocks_user_id_date_index は user_id の外部キー制約が頼っている唯一の索引なので、
        // 先に (user_id, day_of_week) の新しい索引を張ってから外す（順序を変えると FK エラーになる）。
        Schema::table('schedule_blocks', function (Blueprint $table) {
            // 0=日 〜 6=土。特定の日付ではなく毎週繰り返す 1 週間ぶんの型として持つ。
            $table->unsignedTinyInteger('day_of_week')->after('title');
            $table->index(['user_id', 'day_of_week']);
        });

        Schema::table('schedule_blocks', function (Blueprint $table) {
            $table->dropIndex('schedule_blocks_user_id_date_index');
            $table->dropColumn('date');
        });
    }

    public function down(): void
    {
        // date ベースへは戻さない（曜日単位の週間スケジュールが正の仕様のため）。
    }
};
