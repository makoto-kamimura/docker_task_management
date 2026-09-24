<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 「スキマ」として指定した予定は、その開始時刻に「今日の一歩」を通知する。
     * 未登録の時間帯から自動で求める隙間時間の通知とは別に、ユーザーが明示した枠を鳴らすための印。
     */
    public function up(): void
    {
        Schema::table('schedule_blocks', function (Blueprint $table) {
            $table->boolean('notify_at_start')->default(false)->after('end_minute');
        });
    }

    public function down(): void
    {
        Schema::table('schedule_blocks', function (Blueprint $table) {
            $table->dropColumn('notify_at_start');
        });
    }
};
