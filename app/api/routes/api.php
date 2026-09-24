<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ComparisonController;
use App\Http\Controllers\Api\CompassController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DeviceTokenController;
use App\Http\Controllers\Api\ReminderSettingController;
use App\Http\Controllers\Api\ResumeController;
use App\Http\Controllers\Api\ResumeEntryController;
use App\Http\Controllers\Api\ScheduleBlockController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TaskLogController;
use App\Http\Controllers\Api\TitlePresetController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    })->middleware('auth:sanctum');

    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

    Route::middleware('auth:sanctum')->group(function () {
        Route::apiResource('tasks', TaskController::class)->except(['show']);

        // apiResource より先に置く。/schedule-blocks/{id} と食い合わないようにするため。
        Route::get('/schedule-blocks/free-slots', [ScheduleBlockController::class, 'freeSlots']);
        Route::apiResource('schedule-blocks', ScheduleBlockController::class)->except(['show']);

        Route::apiResource('title-presets', TitlePresetController::class)->only(['index', 'store', 'destroy']);

        Route::get('/resume', [ResumeController::class, 'show']);
        Route::patch('/resume/profile', [ResumeController::class, 'updateProfile']);
        Route::post('/resume/entries', [ResumeEntryController::class, 'store']);
        Route::patch('/resume/entries/{resume_entry}', [ResumeEntryController::class, 'update']);
        Route::delete('/resume/entries/{resume_entry}', [ResumeEntryController::class, 'destroy']);
        Route::post('/resume/entries/{resume_entry}/achieve', [ResumeEntryController::class, 'achieve']);
        Route::post('/resume/entries/{resume_entry}/task', [ResumeEntryController::class, 'createTask']);

        Route::get('/reminder-settings', [ReminderSettingController::class, 'show']);
        Route::patch('/reminder-settings', [ReminderSettingController::class, 'update']);

        Route::get('/comparisons/next', [ComparisonController::class, 'next']);
        Route::post('/comparisons', [ComparisonController::class, 'store']);

        Route::get('/compass/today', [CompassController::class, 'today']);

        Route::post('/task-logs', [TaskLogController::class, 'store']);

        Route::get('/dashboard', [DashboardController::class, 'index']);

        Route::post('/devices', [DeviceTokenController::class, 'store']);
    });
});
