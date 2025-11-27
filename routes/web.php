<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\GoogleSheetsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

// Google Sheets API routes
Route::prefix('api/sheets')->group(function () {
    Route::get('/test', [GoogleSheetsController::class, 'test']);
    Route::post('/read', [GoogleSheetsController::class, 'read']);
    Route::post('/write', [GoogleSheetsController::class, 'write']);
    Route::post('/append', [GoogleSheetsController::class, 'append']);
    Route::post('/metadata', [GoogleSheetsController::class, 'metadata']);
});
