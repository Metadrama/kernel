<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SpreadsheetService
{
    /**
     * Directory for saved spreadsheets.
     */
    protected function getDirectory(): string
    {
        return 'spreadsheets';
    }

    /**
     * Get path to a specific spreadsheet file.
     */
    protected function getPath(string $id): string
    {
        return $this->getDirectory() . "/{$id}.json";
    }

    /**
     * Generate a new spreadsheet ID.
     */
    protected function newId(): string
    {
        return 'ss-' . Str::uuid()->toString();
    }

    /**
     * List all saved spreadsheets.
     *
     * @return array
     */
    public function list(): array
    {
        $directory = $this->getDirectory();

        if (!Storage::disk('local')->exists($directory)) {
            return [];
        }

        $files = Storage::disk('local')->files($directory);
        $spreadsheets = [];

        foreach ($files as $file) {
            if (!str_ends_with($file, '.json')) {
                continue;
            }

            $content = Storage::disk('local')->get($file);
            $data = json_decode($content, true);

            if ($data) {
                $spreadsheets[] = [
                    'id' => $data['id'] ?? pathinfo($file, PATHINFO_FILENAME),
                    'name' => $data['name'] ?? 'Untitled',
                    'spreadsheetId' => $data['spreadsheetId'] ?? '',
                    'spreadsheetTitle' => $data['spreadsheetTitle'] ?? null,
                    'url' => $data['url'] ?? null,
                    'createdAt' => $data['createdAt'] ?? null,
                    'updatedAt' => $data['updatedAt'] ?? null,
                ];
            }
        }

        // Sort by updatedAt descending
        usort($spreadsheets, fn($a, $b) => ($b['updatedAt'] ?? '') <=> ($a['updatedAt'] ?? ''));

        return $spreadsheets;
    }

    /**
     * Get a single spreadsheet by ID.
     *
     * @param string $id
     * @return array|null
     */
    public function get(string $id): ?array
    {
        $path = $this->getPath($id);

        if (!Storage::disk('local')->exists($path)) {
            return null;
        }

        $content = Storage::disk('local')->get($path);
        return json_decode($content, true);
    }

    /**
     * Create a new saved spreadsheet.
     *
     * @param array $data
     * @return array The created spreadsheet
     */
    public function create(array $data): array
    {
        $id = $this->newId();
        $now = now()->toIso8601String();

        $spreadsheet = [
            'id' => $id,
            'name' => $data['name'] ?? 'Untitled Spreadsheet',
            'spreadsheetId' => $data['spreadsheetId'] ?? '',
            'spreadsheetTitle' => $data['spreadsheetTitle'] ?? null,
            'url' => $data['url'] ?? null,
            'createdAt' => $now,
            'updatedAt' => $now,
        ];

        // Ensure directory exists
        Storage::disk('local')->makeDirectory($this->getDirectory());

        // Save as JSON file
        Storage::disk('local')->put(
            $this->getPath($id),
            json_encode($spreadsheet, JSON_PRETTY_PRINT)
        );

        return $spreadsheet;
    }

    /**
     * Update an existing spreadsheet.
     *
     * @param string $id
     * @param array $data
     * @return array|null The updated spreadsheet, or null if not found
     */
    public function update(string $id, array $data): ?array
    {
        $existing = $this->get($id);

        if (!$existing) {
            return null;
        }

        $updated = [
            'id' => $id,
            'name' => $data['name'] ?? $existing['name'],
            'spreadsheetId' => $data['spreadsheetId'] ?? $existing['spreadsheetId'],
            'spreadsheetTitle' => $data['spreadsheetTitle'] ?? $existing['spreadsheetTitle'],
            'url' => $data['url'] ?? $existing['url'],
            'createdAt' => $existing['createdAt'],
            'updatedAt' => now()->toIso8601String(),
        ];

        Storage::disk('local')->put(
            $this->getPath($id),
            json_encode($updated, JSON_PRETTY_PRINT)
        );

        return $updated;
    }

    /**
     * Delete a spreadsheet.
     *
     * @param string $id
     * @return bool True if deleted, false if not found
     */
    public function delete(string $id): bool
    {
        $path = $this->getPath($id);

        if (!Storage::disk('local')->exists($path)) {
            return false;
        }

        Storage::disk('local')->delete($path);
        return true;
    }
}
