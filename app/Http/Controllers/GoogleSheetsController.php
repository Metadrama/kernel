<?php

namespace App\Http\Controllers;

use App\Services\GoogleSheetsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GoogleSheetsController extends Controller
{
    protected GoogleSheetsService $sheetsService;

    public function __construct(GoogleSheetsService $sheetsService)
    {
        $this->sheetsService = $sheetsService;
    }

    /**
     * Test the Google Sheets connection by reading from a spreadsheet
     */
    public function test(Request $request): JsonResponse
    {
        $spreadsheetId = $request->query('spreadsheet_id');
        $range = $request->query('range', 'Sheet1!A1:E10');

        if (!$spreadsheetId) {
            return response()->json([
                'success' => false,
                'error' => 'Missing spreadsheet_id parameter. Usage: /api/sheets/test?spreadsheet_id=YOUR_SPREADSHEET_ID&range=Sheet1!A1:E10',
                'help' => [
                    'spreadsheet_id' => 'The ID from the Google Sheets URL (e.g., from https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit)',
                    'range' => 'Optional. A1 notation range to read (default: Sheet1!A1:E10)',
                    'note' => 'Make sure to share the spreadsheet with the service account email from your google-service-account.json file',
                ]
            ], 400);
        }

        try {
            // Get metadata first
            $metadata = $this->sheetsService->getMetadata($spreadsheetId);
            
            // Read the specified range
            $data = $this->sheetsService->read($spreadsheetId, $range);

            return response()->json([
                'success' => true,
                'spreadsheet' => [
                    'id' => $metadata['spreadsheetId'],
                    'title' => $metadata['title'],
                    'sheets' => array_map(fn($s) => $s['title'], $metadata['sheets']),
                ],
                'range' => $range,
                'data' => $data,
                'rowCount' => count($data),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'troubleshooting' => [
                    'Check that the spreadsheet_id is correct',
                    'Ensure the spreadsheet is shared with the service account email',
                    'Verify the range format is correct (e.g., Sheet1!A1:D10)',
                    'Check that google-service-account.json exists in storage/app/',
                ]
            ], 500);
        }
    }

    /**
     * Read data from a spreadsheet
     */
    public function read(Request $request): JsonResponse
    {
        $request->validate([
            'spreadsheet_id' => 'required|string',
            'range' => 'required|string',
        ]);

        try {
            $data = $this->sheetsService->read(
                $request->input('spreadsheet_id'),
                $request->input('range')
            );

            return response()->json([
                'success' => true,
                'data' => $data,
                'rowCount' => count($data),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Write data to a spreadsheet
     */
    public function write(Request $request): JsonResponse
    {
        $request->validate([
            'spreadsheet_id' => 'required|string',
            'range' => 'required|string',
            'values' => 'required|array',
        ]);

        try {
            $updatedCells = $this->sheetsService->write(
                $request->input('spreadsheet_id'),
                $request->input('range'),
                $request->input('values')
            );

            return response()->json([
                'success' => true,
                'updatedCells' => $updatedCells,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Append data to a spreadsheet
     */
    public function append(Request $request): JsonResponse
    {
        $request->validate([
            'spreadsheet_id' => 'required|string',
            'range' => 'required|string',
            'values' => 'required|array',
        ]);

        try {
            $appendedRows = $this->sheetsService->append(
                $request->input('spreadsheet_id'),
                $request->input('range'),
                $request->input('values')
            );

            return response()->json([
                'success' => true,
                'appendedRows' => $appendedRows,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get spreadsheet metadata
     */
    public function metadata(Request $request): JsonResponse
    {
        $request->validate([
            'spreadsheet_id' => 'required|string',
        ]);

        try {
            $metadata = $this->sheetsService->getMetadata(
                $request->input('spreadsheet_id')
            );

            return response()->json([
                'success' => true,
                'metadata' => $metadata,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
