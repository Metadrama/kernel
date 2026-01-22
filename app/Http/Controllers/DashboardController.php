<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    public function index(): Response
    {
        $dashboard = $this->dashboardService->loadOrDefault('default');

        return Inertia::render('Dashboard', [
            'savedDashboards' => $this->dashboardService->list(),
            'currentDashboard' => $dashboard,
        ]);
    }

    public function show(string $id): Response
    {
        $dashboard = $this->dashboardService->loadOrDefault($id);

        return Inertia::render('Dashboard', [
            'savedDashboards' => $this->dashboardService->list(),
            'currentDashboard' => $dashboard,
        ]);
    }

    /**
     * List all saved workspaces (metadata only).
     */
    public function list(): JsonResponse
    {
        return response()->json($this->dashboardService->list());
    }

    /**
     * Save workspace "working copy" (manual save).
     *
     * This overwrites the workspace file on the server:
     * - storage/app/dashboards/{id}.json
     */
    public function save(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['required', 'string'],
            'name' => ['required', 'string'],
            'artboards' => ['array'],
            'dataSourceConfig' => ['nullable', 'array'],
        ]);

        $saved = $this->dashboardService->save([
            'id' => $data['id'],
            'name' => $data['name'],
            'content' => [
                'artboards' => $data['artboards'] ?? [],
                'dataSourceConfig' => $data['dataSourceConfig'] ?? null,
            ],
        ]);

        return response()->json([
            'status' => 'ok',
            'dashboard' => $saved,
            'savedDashboards' => $this->dashboardService->list(),
        ]);
    }

    /**
     * Delete a workspace (manual, destructive).
     *
     * Safety:
     * - The service rejects deleting the default workspace.
     */
    public function discard(string $id): JsonResponse
    {
        try {
            $deleted = $this->dashboardService->discardWorkspace($id);

            return response()->json([
                'status' => 'ok',
                'deleted' => $deleted,
                'savedDashboards' => $this->dashboardService->list(),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
                'savedDashboards' => $this->dashboardService->list(),
            ], 400);
        }
    }
}
