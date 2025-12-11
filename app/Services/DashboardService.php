<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;

class DashboardService
{
    /**
     * Get the storage path for a dashboard.
     */
    protected function getPath(string $id): string
    {
        return "dashboards/{$id}.json";
    }

    /**
     * List all saved dashboards (metadata only).
     *
     * @return array
     */
    public function list(): array
    {
        $files = Storage::disk('local')->files('dashboards');
        $dashboards = [];

        foreach ($files as $file) {
            if (str_ends_with($file, '.json')) {
                $content = Storage::disk('local')->get($file);
                $data = json_decode($content, true);
                if ($data) {
                    $dashboards[] = [
                        'id' => $data['id'] ?? pathinfo($file, PATHINFO_FILENAME),
                        'name' => $data['name'] ?? 'Untitled',
                        'updatedAt' => $data['updatedAt'] ?? null,
                        'artboardCount' => count($data['artboards'] ?? []),
                    ];
                }
            }
        }

        // Sort by updatedAt descending
        usort($dashboards, fn($a, $b) => ($b['updatedAt'] ?? '') <=> ($a['updatedAt'] ?? ''));

        return $dashboards;
    }

    /**
     * Save a dashboard to file.
     *
     * @param array $data Dashboard data including id, name, and content
     * @return array The saved data
     */
    public function save(array $data): array
    {
        $id = $data['id'] ?? 'default';
        $payload = [
            'id' => $id,
            'name' => $data['name'] ?? 'Untitled Dashboard',
            'artboards' => $data['content']['artboards'] ?? [],
            'archivedWidgets' => $data['content']['archivedWidgets'] ?? [],
            'updatedAt' => now()->toIso8601String(),
        ];

        // Ensure directory exists
        Storage::disk('local')->makeDirectory('dashboards');
        
        // Save as JSON file
        Storage::disk('local')->put(
            $this->getPath($id),
            json_encode($payload, JSON_PRETTY_PRINT)
        );

        return $payload;
    }

    /**
     * Load a dashboard from file.
     *
     * @param string $id Dashboard ID
     * @return array|null
     */
    public function load(string $id): ?array
    {
        $path = $this->getPath($id);
        
        if (!Storage::disk('local')->exists($path)) {
            return null;
        }

        $content = Storage::disk('local')->get($path);
        return json_decode($content, true);
    }

    /**
     * Load a dashboard or return a default structure.
     *
     * @param string $id Dashboard ID
     * @return array Dashboard data
     */
    public function loadOrDefault(string $id = 'default'): array
    {
        $dashboard = $this->load($id);

        if ($dashboard) {
            return $dashboard;
        }

        return [
            'id' => $id,
            'name' => 'Untitled Dashboard',
            'artboards' => [],
            'archivedWidgets' => [],
            'createdAt' => now()->toIso8601String(),
            'updatedAt' => now()->toIso8601String(),
        ];
    }
}
