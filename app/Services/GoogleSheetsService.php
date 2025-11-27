<?php

namespace App\Services;

use Google\Client;
use Google\Service\Sheets;
use Google\Service\Sheets\ValueRange;

class GoogleSheetsService
{
    protected Client $client;
    protected Sheets $service;

    public function __construct()
    {
        $this->client = new Client();
        $this->client->setApplicationName('Dataviser Dashboard');
        $this->client->setScopes([Sheets::SPREADSHEETS]);
        
        // Disable SSL verification if configured (for local development)
        if (env('GOOGLE_SHEETS_VERIFY_SSL', true) === false) {
            $this->client->setHttpClient(new \GuzzleHttp\Client([
                'verify' => false,
            ]));
        }
        
        // Use service account credentials
        $credentialsPath = storage_path('app/google-service-account.json');
        
        if (!file_exists($credentialsPath)) {
            throw new \Exception('Google service account credentials not found at: ' . $credentialsPath);
        }
        
        $this->client->setAuthConfig($credentialsPath);
        $this->service = new Sheets($this->client);
    }

    /**
     * Read data from a spreadsheet
     *
     * @param string $spreadsheetId The ID of the spreadsheet
     * @param string $range The A1 notation of the range to read (e.g., 'Sheet1!A1:D10')
     * @return array The values from the spreadsheet
     */
    public function read(string $spreadsheetId, string $range): array
    {
        try {
            $response = $this->service->spreadsheets_values->get($spreadsheetId, $range);
            return $response->getValues() ?? [];
        } catch (\Exception $e) {
            throw new \Exception('Failed to read from Google Sheet: ' . $e->getMessage());
        }
    }

    /**
     * Write data to a spreadsheet
     *
     * @param string $spreadsheetId The ID of the spreadsheet
     * @param string $range The A1 notation of the range to write (e.g., 'Sheet1!A1')
     * @param array $values 2D array of values to write
     * @return int Number of cells updated
     */
    public function write(string $spreadsheetId, string $range, array $values): int
    {
        try {
            $body = new ValueRange([
                'values' => $values
            ]);
            
            $params = [
                'valueInputOption' => 'USER_ENTERED'
            ];
            
            $response = $this->service->spreadsheets_values->update(
                $spreadsheetId,
                $range,
                $body,
                $params
            );
            
            return $response->getUpdatedCells();
        } catch (\Exception $e) {
            throw new \Exception('Failed to write to Google Sheet: ' . $e->getMessage());
        }
    }

    /**
     * Append data to a spreadsheet
     *
     * @param string $spreadsheetId The ID of the spreadsheet
     * @param string $range The A1 notation of the range to append to (e.g., 'Sheet1!A1')
     * @param array $values 2D array of values to append
     * @return int Number of rows appended
     */
    public function append(string $spreadsheetId, string $range, array $values): int
    {
        try {
            $body = new ValueRange([
                'values' => $values
            ]);
            
            $params = [
                'valueInputOption' => 'USER_ENTERED',
                'insertDataOption' => 'INSERT_ROWS'
            ];
            
            $response = $this->service->spreadsheets_values->append(
                $spreadsheetId,
                $range,
                $body,
                $params
            );
            
            return count($values);
        } catch (\Exception $e) {
            throw new \Exception('Failed to append to Google Sheet: ' . $e->getMessage());
        }
    }

    /**
     * Get spreadsheet metadata
     *
     * @param string $spreadsheetId The ID of the spreadsheet
     * @return array Spreadsheet metadata including title and sheets
     */
    public function getMetadata(string $spreadsheetId): array
    {
        try {
            $spreadsheet = $this->service->spreadsheets->get($spreadsheetId);
            
            $sheets = [];
            foreach ($spreadsheet->getSheets() as $sheet) {
                $properties = $sheet->getProperties();
                $sheets[] = [
                    'sheetId' => $properties->getSheetId(),
                    'title' => $properties->getTitle(),
                    'index' => $properties->getIndex(),
                    'rowCount' => $properties->getGridProperties()->getRowCount(),
                    'columnCount' => $properties->getGridProperties()->getColumnCount(),
                ];
            }
            
            return [
                'spreadsheetId' => $spreadsheet->getSpreadsheetId(),
                'title' => $spreadsheet->getProperties()->getTitle(),
                'locale' => $spreadsheet->getProperties()->getLocale(),
                'sheets' => $sheets,
            ];
        } catch (\Exception $e) {
            throw new \Exception('Failed to get spreadsheet metadata: ' . $e->getMessage());
        }
    }

    /**
     * Clear a range in the spreadsheet
     *
     * @param string $spreadsheetId The ID of the spreadsheet
     * @param string $range The A1 notation of the range to clear
     * @return bool True if successful
     */
    public function clear(string $spreadsheetId, string $range): bool
    {
        try {
            $this->service->spreadsheets_values->clear(
                $spreadsheetId,
                $range,
                new \Google\Service\Sheets\ClearValuesRequest()
            );
            return true;
        } catch (\Exception $e) {
            throw new \Exception('Failed to clear Google Sheet range: ' . $e->getMessage());
        }
    }
}
