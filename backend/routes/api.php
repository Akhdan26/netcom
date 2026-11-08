<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\v1\AuthController;
use App\Http\Controllers\Api\v1\AnalyticsController;
use App\Http\Controllers\Api\v1\OrderController;
use App\Http\Controllers\Api\v1\DatasetController;

// Public Authentication Route
Route::post('/login', [AuthController::class, 'login']);

// Protected Routes (Harus Menyertakan Sanctum Bearer Token)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Analytics: Revenue Harian & Deteksi Anomali (Point A)
    Route::get('/analytics/revenue/daily', [AnalyticsController::class, 'dailyRevenue']);
    Route::get('/analytics/revenue/anomalies', [AnalyticsController::class, 'anomalies']);

    // Orders: Pesanan Belum Terkirim (Point A)
    Route::get('/orders/pending-shipment', [OrderController::class, 'pendingShipment']);

    // Generic Dataset CRUD Explorer untuk Semua Tabel (Point A)
    Route::get('/datasets/{tableName}', [DatasetController::class, 'index']);
    Route::post('/datasets/{tableName}', [DatasetController::class, 'store']);
    Route::get('/datasets/{tableName}/{id}', [DatasetController::class, 'show']);
    Route::put('/datasets/{tableName}/{id}', [DatasetController::class, 'update']);
    Route::delete('/datasets/{tableName}/{id}', [DatasetController::class, 'destroy']);
});
