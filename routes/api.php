<?php

use App\Http\Controllers\GoogleSheetsController;
use App\Http\Controllers\DataSourceController;
use App\Http\Controllers\SpreadsheetController;
use Illuminate\Support\Facades\Route;

// Google Sheets API routes (no CSRF protection)
Route::prefix('sheets')->group(function () {
    Route::get('/test', [GoogleSheetsController::class, 'test']);
    Route::post('/read', [GoogleSheetsController::class, 'read']);
    Route::post('/write', [GoogleSheetsController::class, 'write']);
    Route::post('/append', [GoogleSheetsController::class, 'append']);
    Route::post('/metadata', [GoogleSheetsController::class, 'metadata']);
});

// Saved Data Sources API routes
Route::prefix('data-sources')->group(function () {
    Route::get('/', [DataSourceController::class, 'index']);
    Route::get('/{id}', [DataSourceController::class, 'show']);
    Route::post('/', [DataSourceController::class, 'store']);
    Route::put('/{id}', [DataSourceController::class, 'update']);
    Route::delete('/{id}', [DataSourceController::class, 'destroy']);
});

// Saved Spreadsheets API routes
Route::prefix('spreadsheets')->group(function () {
    Route::get('/', [SpreadsheetController::class, 'index']);
    Route::get('/{id}', [SpreadsheetController::class, 'show']);
    Route::post('/', [SpreadsheetController::class, 'store']);
    Route::put('/{id}', [SpreadsheetController::class, 'update']);
    Route::delete('/{id}', [SpreadsheetController::class, 'destroy']);
});
