<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
Route::get('/dashboard/list', [DashboardController::class, 'list'])->name('dashboard.list');
Route::post('/dashboard/save', [DashboardController::class, 'save'])->name('dashboard.save');
Route::get('/dashboard/{id}', [DashboardController::class, 'show'])->name('dashboard.show');
