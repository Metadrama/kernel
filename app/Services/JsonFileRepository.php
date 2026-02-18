<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Abstract base class for flat-file JSON CRUD repositories.
 *
 * Subclasses only need to define the storage directory, ID prefix,
 * and how raw JSON data maps to list items, create payloads, and update payloads.
 */
abstract class JsonFileRepository
{
    /**
     * Storage directory name (e.g. 'spreadsheets', 'data-sources').
     */
    abstract protected function getDirectory(): string;

    /**
     * ID prefix (e.g. 'ss-', 'ds-').
     */
    abstract protected function getIdPrefix(): string;

    /**
     * Map a raw JSON record to a list-item array.
     * Override in subclass to expose the relevant fields.
     */
    abstract protected function mapToListItem(array $data, string $filename): array;

    /**
     * Build a new record from user-supplied data.
     * Should NOT include id, createdAt, updatedAt — those are added by create().
     */
    abstract protected function buildNewRecord(array $data): array;

    /**
     * Merge user-supplied data into an existing record for updates.
     * Should NOT include id, createdAt, updatedAt — those are handled by update().
     */
    abstract protected function mergeForUpdate(array $existing, array $data): array;

    /**
     * Get path to a specific file.
     */
    protected function getPath(string $id): string
    {
        return $this->getDirectory()."/{$id}.json";
    }

    /**
     * Generate a new ID.
     */
    protected function newId(): string
    {
        return $this->getIdPrefix().Str::uuid()->toString();
    }

    /**
     * List all records, sorted by updatedAt descending.
     */
    public function list(): array
    {
        $directory = $this->getDirectory();

        if (! Storage::disk('local')->exists($directory)) {
            return [];
        }

        $files = Storage::disk('local')->files($directory);
        $items = [];

        foreach ($files as $file) {
            if (! str_ends_with($file, '.json')) {
                continue;
            }

            $content = Storage::disk('local')->get($file);
            $data = json_decode($content, true);

            if ($data) {
                $items[] = $this->mapToListItem($data, pathinfo($file, PATHINFO_FILENAME));
            }
        }

        // Sort by updatedAt descending
        usort($items, fn ($a, $b) => ($b['updatedAt'] ?? '') <=> ($a['updatedAt'] ?? ''));

        return $items;
    }

    /**
     * Get a single record by ID.
     */
    public function get(string $id): ?array
    {
        $path = $this->getPath($id);

        if (! Storage::disk('local')->exists($path)) {
            return null;
        }

        $content = Storage::disk('local')->get($path);

        return json_decode($content, true);
    }

    /**
     * Create a new record.
     *
     * @return array The created record
     */
    public function create(array $data): array
    {
        $id = $this->newId();
        $now = now()->toIso8601String();

        $record = array_merge(
            ['id' => $id],
            $this->buildNewRecord($data),
            ['createdAt' => $now, 'updatedAt' => $now],
        );

        // Ensure directory exists
        Storage::disk('local')->makeDirectory($this->getDirectory());

        // Save as JSON file
        Storage::disk('local')->put(
            $this->getPath($id),
            json_encode($record, JSON_PRETTY_PRINT)
        );

        return $record;
    }

    /**
     * Update an existing record.
     *
     * @return array|null The updated record, or null if not found
     */
    public function update(string $id, array $data): ?array
    {
        $existing = $this->get($id);

        if (! $existing) {
            return null;
        }

        $updated = array_merge(
            ['id' => $id],
            $this->mergeForUpdate($existing, $data),
            ['createdAt' => $existing['createdAt'], 'updatedAt' => now()->toIso8601String()],
        );

        Storage::disk('local')->put(
            $this->getPath($id),
            json_encode($updated, JSON_PRETTY_PRINT)
        );

        return $updated;
    }

    /**
     * Delete a record.
     *
     * @return bool True if deleted, false if not found
     */
    public function delete(string $id): bool
    {
        $path = $this->getPath($id);

        if (! Storage::disk('local')->exists($path)) {
            return false;
        }

        Storage::disk('local')->delete($path);

        return true;
    }
}
