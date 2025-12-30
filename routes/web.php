<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
Route::get('/dashboard/{id}/states', [DashboardController::class, 'states'])->name('dashboard.states');
Route::post('/dashboard/save', [DashboardController::class, 'save'])->name('dashboard.save');
Route::get('/dashboard/{id}/states/{stateId}', [DashboardController::class, 'loadState'])->name('dashboard.states.load');
Route::delete('/dashboard/{id}/states/{stateId}', [DashboardController::class, 'discardState'])->name('dashboard.states.discard');
Route::get('/dashboard/{id}', [DashboardController::class, 'show'])->name('dashboard.show');
