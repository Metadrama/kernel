<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $dashboard = session('dashboard_layout');
        if (!$dashboard) {
            $dashboard = [
                'id' => 'demo',
                'name' => 'Untitled Dashboard',
                'artboards' => [],
                'createdAt' => now()->toIso8601String(),
                'updatedAt' => now()->toIso8601String(),
            ];
        }

        return Inertia::render('Dashboard', [
            'dashboards' => [$dashboard],
            'currentDashboard' => $dashboard,
        ]);
    }

    public function save(Request $request)
    {
        $data = $request->validate([
            'id' => ['required', 'string'],
            'name' => ['required', 'string'],
            'artboards' => ['array'],
            'createdAt' => ['string'],
            'updatedAt' => ['string'],
        ]);

        session(['dashboard_layout' => $data]);

        return response()->json(['status' => 'ok']);
    }
}
