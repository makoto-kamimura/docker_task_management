<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ComparisonController;
use App\Http\Controllers\Api\CompassController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DeviceTokenController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TaskLogController;
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

        Route::get('/comparisons/next', [ComparisonController::class, 'next']);
        Route::post('/comparisons', [ComparisonController::class, 'store']);

        Route::get('/compass/today', [CompassController::class, 'today']);

        Route::post('/task-logs', [TaskLogController::class, 'store']);

        Route::get('/dashboard', [DashboardController::class, 'index']);

        Route::post('/devices', [DeviceTokenController::class, 'store']);
    });
});
