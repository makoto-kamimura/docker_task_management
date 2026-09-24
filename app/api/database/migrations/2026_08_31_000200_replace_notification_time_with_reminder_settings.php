<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * 通知は「1日1回の固定時刻」から「週間スケジュールの隙間時間」起点に変わったため、
     * notification_time を捨てて隙間の絞り込み条件（最小の長さ・通知してよい時間帯）に置き換える。
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedSmallInteger('reminder_min_gap_minutes')->default(30)->after('password');
            $table->unsignedSmallInteger('reminder_window_start_minute')->default(7 * 60)->after('reminder_min_gap_minutes');
            $table->unsignedSmallInteger('reminder_window_end_minute')->default(22 * 60)->after('reminder_window_start_minute');
            $table->dropColumn('notification_time');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->time('notification_time')->default('07:00:00')->after('password');
            $table->dropColumn([
                'reminder_min_gap_minutes',
                'reminder_window_start_minute',
                'reminder_window_end_minute',
            ]);
        });
    }
};
