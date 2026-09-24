<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 履歴書の個人情報・自由記述。1 ユーザー 1 件。どの項目も任意入力。
        // 文字列はモデルの encrypted キャストで APP_KEY により暗号化して保存するため、
        // 暗号文の長さを見込んで text にしておく（桁数の上限はリクエスト側で検証する）。
        Schema::create('resume_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->text('name')->nullable();
            $table->text('name_kana')->nullable();
            $table->text('birth_date')->nullable();
            $table->text('gender')->nullable();
            $table->text('postal_code')->nullable();
            $table->text('address')->nullable();
            $table->text('address_kana')->nullable();
            $table->text('phone')->nullable();
            $table->text('email')->nullable();
            $table->text('contact_postal_code')->nullable();
            $table->text('contact_address')->nullable();
            $table->text('contact_phone')->nullable();
            $table->text('motivation')->nullable();
            $table->text('self_pr')->nullable();
            $table->text('requests')->nullable();
            $table->unsignedSmallInteger('commute_minutes')->nullable();
            $table->unsignedTinyInteger('dependents_count')->nullable();
            $table->boolean('has_spouse')->nullable();
            $table->boolean('spouse_dependent')->nullable();
            $table->timestamps();
        });

        // 学歴・職歴・免許資格の 1 行。今の履歴書（current）と、なりたい将来の履歴書（future）を同じ形で持つ。
        // 将来の行は「やりたいこと」のルートタスクと 1 対 1 で結び、タスク側で分解・二択比較・今日の一歩に乗せる。
        Schema::create('resume_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // タスクを消しても履歴書の行は残す（目標そのものは消えないため）。
            $table->foreignId('task_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->enum('timeline', ['current', 'future']);
            $table->enum('kind', ['education', 'work', 'license']);
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('month')->nullable();
            // tasks.title と同じ上限。将来の行はそのままタスク名になる。
            $table->string('content', 200);
            $table->timestamps();

            $table->index(['user_id', 'timeline']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('resume_entries');
        Schema::dropIfExists('resume_profiles');
    }
};
