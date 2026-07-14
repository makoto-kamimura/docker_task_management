<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 200);
            $table->unsignedSmallInteger('duration_minutes')->nullable();
            $table->enum('deadline_type', ['today', 'week', 'month', 'none'])->default('none');
            $table->double('rating')->default(1500);
            $table->enum('status', ['active', 'archived'])->default('active');
            $table->timestamp('last_done_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
