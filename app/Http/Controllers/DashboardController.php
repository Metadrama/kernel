<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    public function index(): Response
    {
        $dashboard = $this->dashboardService->loadOrDefault('default');
        $savedDashboards = $this->dashboardService->list();

        return Inertia::render('Dashboard', [
            'savedDashboards' => $savedDashboards,
            'currentDashboard' => $dashboard,
        ]);
    }

    public function show(string $id): Response
    {
        $dashboard = $this->dashboardService->loadOrDefault($id);
        $savedDashboards = $this->dashboardService->list();

        return Inertia::render('Dashboard', [
            'savedDashboards' => $savedDashboards,
            'currentDashboard' => $dashboard,
        ]);
    }

    public function list(): JsonResponse
    {
        return response()->json($this->dashboardService->list());
    }

    public function save(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['required', 'string'],
            'name' => ['required', 'string'],
            'artboards' => ['array'],
            'archivedWidgets' => ['array'],
        ]);

        $saved = $this->dashboardService->save([
            'id' => $data['id'],
            'name' => $data['name'],
            'content' => [
                'artboards' => $data['artboards'] ?? [],
                'archivedWidgets' => $data['archivedWidgets'] ?? [],
            ],
        ]);

        // Return saved data and updated list
        return response()->json([
            'status' => 'ok',
            'dashboard' => $saved,
            'savedDashboards' => $this->dashboardService->list(),
        ]);
    }
}
