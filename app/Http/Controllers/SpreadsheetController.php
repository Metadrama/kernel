<?php

namespace App\Http\Controllers;

use App\Services\SpreadsheetService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SpreadsheetController extends Controller
{
    protected SpreadsheetService $spreadsheetService;

    public function __construct(SpreadsheetService $spreadsheetService)
    {
        $this->spreadsheetService = $spreadsheetService;
    }

    /**
     * List all saved spreadsheets.
     */
    public function index(): JsonResponse
    {
        try {
            $spreadsheets = $this->spreadsheetService->list();

            return response()->json([
                'success' => true,
                'data' => $spreadsheets,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a single spreadsheet by ID.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $spreadsheet = $this->spreadsheetService->get($id);

            if (!$spreadsheet) {
                return response()->json([
                    'success' => false,
                    'error' => 'Spreadsheet not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $spreadsheet,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a new spreadsheet.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'spreadsheetId' => 'required|string',
            'spreadsheetTitle' => 'nullable|string|max:255',
            'url' => 'nullable|string|max:2048',
        ]);

        try {
            $spreadsheet = $this->spreadsheetService->create([
                'name' => $request->input('name'),
                'spreadsheetId' => $request->input('spreadsheetId'),
                'spreadsheetTitle' => $request->input('spreadsheetTitle'),
                'url' => $request->input('url'),
            ]);

            return response()->json([
                'success' => true,
                'data' => $spreadsheet,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update an existing spreadsheet.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'spreadsheetId' => 'sometimes|string',
            'spreadsheetTitle' => 'nullable|string|max:255',
            'url' => 'nullable|string|max:2048',
        ]);

        try {
            $spreadsheet = $this->spreadsheetService->update($id, [
                'name' => $request->input('name'),
                'spreadsheetId' => $request->input('spreadsheetId'),
                'spreadsheetTitle' => $request->input('spreadsheetTitle'),
                'url' => $request->input('url'),
            ]);

            if (!$spreadsheet) {
                return response()->json([
                    'success' => false,
                    'error' => 'Spreadsheet not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $spreadsheet,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a spreadsheet.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $deleted = $this->spreadsheetService->delete($id);

            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'error' => 'Spreadsheet not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Spreadsheet deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
