<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('title_presets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // 予定のタイトルにそのまま入る文字列。schedule_blocks.title と同じ上限にそろえる。
            $table->string('label', 100);
            $table->timestamps();

            // 同じ項目を二重に登録させない。user_id が先頭なので一覧取得の索引も兼ねる。
            $table->unique(['user_id', 'label']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('title_presets');
    }
};
