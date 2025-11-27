<?php

use App\Http\Controllers\GoogleSheetsController;
use Illuminate\Support\Facades\Route;

// Google Sheets API routes (no CSRF protection)
Route::prefix('sheets')->group(function () {
    Route::get('/test', [GoogleSheetsController::class, 'test']);
    Route::post('/read', [GoogleSheetsController::class, 'read']);
    Route::post('/write', [GoogleSheetsController::class, 'write']);
    Route::post('/append', [GoogleSheetsController::class, 'append']);
    Route::post('/metadata', [GoogleSheetsController::class, 'metadata']);
});
