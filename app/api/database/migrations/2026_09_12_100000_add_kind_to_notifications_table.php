<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * 「今日の一歩」は実施できるやりたいことが無いとき「二択で選ぶ」「細分化」になる（design.md 8.2）。
 * 何を提案したかを通知履歴にも残せるよう kind を足し、タスクを伴わない二択のために
 * task_id を NULL 許容にする。タスクを消しても履歴は残したいので、削除時は NULL 化に変える。
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->enum('kind', ['task', 'compare', 'breakdown'])->default('task')->after('task_id');
        });

        $isSqlite = DB::getDriverName() === 'sqlite';

        // SQLite は外部キーを付け替えられない。change() がテーブルを作り直すときに
        // 制約ごと引き継ぐので、列の定義だけ変える。
        if (! $isSqlite) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->dropForeign(['task_id']);
            });
        }

        Schema::table('notifications', function (Blueprint $table) {
            $table->foreignId('task_id')->nullable()->change();
        });

        if (! $isSqlite) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->foreign('task_id')->references('id')->on('tasks')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        DB::table('notifications')->whereNull('task_id')->delete();

        $isSqlite = DB::getDriverName() === 'sqlite';

        if (! $isSqlite) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->dropForeign(['task_id']);
            });
        }

        Schema::table('notifications', function (Blueprint $table) {
            $table->foreignId('task_id')->nullable(false)->change();
        });

        if (! $isSqlite) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->foreign('task_id')->references('id')->on('tasks')->cascadeOnDelete();
            });
        }

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn('kind');
        });
    }
};
