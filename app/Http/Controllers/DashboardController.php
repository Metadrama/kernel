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

        return Inertia::render('Dashboard', [
            // "Saved States" (snapshots), scoped to the current dashboard/project
            'savedDashboards' => $this->dashboardService->listStates($dashboard['id'] ?? 'default'),
            'currentDashboard' => $dashboard,
        ]);
    }

    public function show(string $id): Response
    {
        $dashboard = $this->dashboardService->loadOrDefault($id);

        return Inertia::render('Dashboard', [
            // "Saved States" (snapshots), scoped to the current dashboard/project
            'savedDashboards' => $this->dashboardService->listStates($id),
            'currentDashboard' => $dashboard,
        ]);
    }

    /**
     * List saved states (snapshots) for a dashboard/project.
     */
    public function states(string $id): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'savedDashboards' => $this->dashboardService->listStates($id),
        ]);
    }

    /**
     * Create a saved state (snapshot) for a dashboard/project.
     */
    public function save(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['required', 'string'], // dashboard/project id (scope)
            'name' => ['required', 'string'],
            'artboards' => ['array'],
        ]);

        $state = $this->dashboardService->createState($data['id'], [
            'name' => $data['name'],
            'artboards' => $data['artboards'] ?? [],
        ]);

        return response()->json([
            'status' => 'ok',
            'state' => $state,
            // Keep prop name for now to avoid front-end churn
            'savedDashboards' => $this->dashboardService->listStates($data['id']),
        ]);
    }

    /**
     * Load a saved state (snapshot).
     */
    public function loadState(string $id, string $stateId): JsonResponse
    {
        $state = $this->dashboardService->loadState($id, $stateId);

        if (!$state) {
            return response()->json([
                'status' => 'error',
                'message' => 'State not found.',
            ], 404);
        }

        return response()->json([
            'status' => 'ok',
            'state' => $state,
        ]);
    }

    /**
     * Discard (delete) a saved state (snapshot).
     */
    public function discardState(string $id, string $stateId): JsonResponse
    {
        $deleted = $this->dashboardService->discardState($id, $stateId);

        return response()->json([
            'status' => 'ok',
            'deleted' => $deleted,
            // Keep prop name for now to avoid front-end churn
            'savedDashboards' => $this->dashboardService->listStates($id),
        ]);
    }
}
