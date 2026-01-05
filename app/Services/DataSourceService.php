<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DataSourceService
{
    /**
     * Directory for saved data sources.
     */
    protected function getDirectory(): string
    {
        return 'data-sources';
    }

    /**
     * Get path to a specific data source file.
     */
    protected function getPath(string $id): string
    {
        return $this->getDirectory() . "/{$id}.json";
    }

    /**
     * Generate a new data source ID.
     */
    protected function newId(): string
    {
        return 'ds-' . Str::uuid()->toString();
    }

    /**
     * List all saved data sources.
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
        $dataSources = [];

        foreach ($files as $file) {
            if (!str_ends_with($file, '.json')) {
                continue;
            }

            $content = Storage::disk('local')->get($file);
            $data = json_decode($content, true);

            if ($data) {
                $dataSources[] = [
                    'id' => $data['id'] ?? pathinfo($file, PATHINFO_FILENAME),
                    'name' => $data['name'] ?? 'Untitled',
                    'type' => $data['type'] ?? 'unknown',
                    'config' => $data['config'] ?? [],
                    'createdAt' => $data['createdAt'] ?? null,
                    'updatedAt' => $data['updatedAt'] ?? null,
                ];
            }
        }

        // Sort by updatedAt descending
        usort($dataSources, fn($a, $b) => ($b['updatedAt'] ?? '') <=> ($a['updatedAt'] ?? ''));

        return $dataSources;
    }

    /**
     * Get a single data source by ID.
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
     * Create a new saved data source.
     *
     * @param array $data
     * @return array The created data source
     */
    public function create(array $data): array
    {
        $id = $this->newId();
        $now = now()->toIso8601String();

        $dataSource = [
            'id' => $id,
            'name' => $data['name'] ?? 'Untitled Data Source',
            'type' => $data['type'] ?? 'google-sheets',
            'config' => $data['config'] ?? [],
            'createdAt' => $now,
            'updatedAt' => $now,
        ];

        // Ensure directory exists
        Storage::disk('local')->makeDirectory($this->getDirectory());

        // Save as JSON file
        Storage::disk('local')->put(
            $this->getPath($id),
            json_encode($dataSource, JSON_PRETTY_PRINT)
        );

        return $dataSource;
    }

    /**
     * Update an existing data source.
     *
     * @param string $id
     * @param array $data
     * @return array|null The updated data source, or null if not found
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
            'type' => $data['type'] ?? $existing['type'],
            'config' => $data['config'] ?? $existing['config'],
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
     * Delete a data source.
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
