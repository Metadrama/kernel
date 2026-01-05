<?php

namespace App\Http\Controllers;

use App\Services\DataSourceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DataSourceController extends Controller
{
    protected DataSourceService $dataSourceService;

    public function __construct(DataSourceService $dataSourceService)
    {
        $this->dataSourceService = $dataSourceService;
    }

    /**
     * List all saved data sources.
     */
    public function index(): JsonResponse
    {
        try {
            $dataSources = $this->dataSourceService->list();

            return response()->json([
                'success' => true,
                'data' => $dataSources,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a single data source by ID.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $dataSource = $this->dataSourceService->get($id);

            if (!$dataSource) {
                return response()->json([
                    'success' => false,
                    'error' => 'Data source not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $dataSource,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a new data source.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|in:google-sheets,api',
            'config' => 'required|array',
        ]);

        try {
            $dataSource = $this->dataSourceService->create([
                'name' => $request->input('name'),
                'type' => $request->input('type'),
                'config' => $request->input('config'),
            ]);

            return response()->json([
                'success' => true,
                'data' => $dataSource,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update an existing data source.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string|in:google-sheets,api',
            'config' => 'sometimes|array',
        ]);

        try {
            $dataSource = $this->dataSourceService->update($id, [
                'name' => $request->input('name'),
                'type' => $request->input('type'),
                'config' => $request->input('config'),
            ]);

            if (!$dataSource) {
                return response()->json([
                    'success' => false,
                    'error' => 'Data source not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $dataSource,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a data source.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $deleted = $this->dataSourceService->delete($id);

            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'error' => 'Data source not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Data source deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
