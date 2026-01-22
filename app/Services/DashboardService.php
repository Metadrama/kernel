<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;

class DashboardService
{
    /**
     * Dashboard "working copy" file path.
     *
     * NOTE:
     * We keep this for loading the current dashboard (project) metadata/content.
     * "Saved States" (snapshots) are stored separately under a scoped directory.
     */
    protected function getPath(string $id): string
    {
        return "dashboards/{$id}.json";
    }

    /**
     * Scoped directory for saved states (snapshots) for a given dashboard/project.
     *
     * Each snapshot is stored as:
     * - dashboards/{dashboardId}/states/{stateId}.json
     */
    protected function getStatesDir(string $dashboardId): string
    {
        return "dashboards/{$dashboardId}/states";
    }

    protected function getStatePath(string $dashboardId, string $stateId): string
    {
        return $this->getStatesDir($dashboardId) . "/{$stateId}.json";
    }

    protected function newStateId(): string
    {
        return 'state-' . now()->format('YmdHis') . '-' . substr(bin2hex(random_bytes(6)), 0, 12);
    }

    /**
     * List dashboards/projects (metadata only).
     *
     * NOTE:
     * This is NOT the list of saved states. States are listed via listStates(...).
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
     * Delete/discard a workspace (dashboard/project) working copy.
     *
     * Safety:
     * - Prevent deleting the default workspace.
     *
     * @param string $id Workspace ID
     * @return bool True if deleted, false if not found
     */
    public function discardWorkspace(string $id): bool
    {
        if ($id === 'default') {
            throw new \InvalidArgumentException('Cannot delete the default workspace.');
        }

        $path = $this->getPath($id);

        if (!Storage::disk('local')->exists($path)) {
            return false;
        }

        Storage::disk('local')->delete($path);
        return true;
    }

    /**
     * List saved states (snapshots) for a given dashboard/project.
     *
     * @param string $dashboardId
     * @return array
     */
    public function listStates(string $dashboardId): array
    {
        $dir = $this->getStatesDir($dashboardId);

        if (!Storage::disk('local')->exists($dir)) {
            return [];
        }

        $files = Storage::disk('local')->files($dir);
        $states = [];

        foreach ($files as $file) {
            if (!str_ends_with($file, '.json')) continue;

            $content = Storage::disk('local')->get($file);
            $data = json_decode($content, true);

            if (!$data) continue;

            $states[] = [
                'id' => $data['id'] ?? pathinfo($file, PATHINFO_FILENAME),
                'name' => $data['name'] ?? 'Untitled State',
                'updatedAt' => $data['updatedAt'] ?? null,
                'createdAt' => $data['createdAt'] ?? null,
                'artboardCount' => count($data['artboards'] ?? []),
            ];
        }

        // Sort by updatedAt descending (fallback to createdAt)
        usort($states, function ($a, $b) {
            $aKey = $a['updatedAt'] ?? $a['createdAt'] ?? '';
            $bKey = $b['updatedAt'] ?? $b['createdAt'] ?? '';
            return $bKey <=> $aKey;
        });

        return $states;
    }

    /**
     * Create a saved state (snapshot) for a given dashboard/project.
     *
     * @param string $dashboardId
     * @param array $payload
     *   - name?: string
     *   - artboards?: array
     * @return array The created state payload
     */
    public function createState(string $dashboardId, array $payload): array
    {
        $stateId = $this->newStateId();
        $now = now()->toIso8601String();

        $state = [
            'id' => $stateId,
            'dashboardId' => $dashboardId,
            'name' => $payload['name'] ?? 'Untitled State',
            'artboards' => $payload['artboards'] ?? [],
            'createdAt' => $now,
            'updatedAt' => $now,
        ];

        Storage::disk('local')->makeDirectory($this->getStatesDir($dashboardId));

        Storage::disk('local')->put(
            $this->getStatePath($dashboardId, $stateId),
            json_encode($state, JSON_PRETTY_PRINT)
        );

        return $state;
    }

    /**
     * Load a saved state (snapshot).
     *
     * @param string $dashboardId
     * @param string $stateId
     * @return array|null
     */
    public function loadState(string $dashboardId, string $stateId): ?array
    {
        $path = $this->getStatePath($dashboardId, $stateId);

        if (!Storage::disk('local')->exists($path)) {
            return null;
        }

        $content = Storage::disk('local')->get($path);
        return json_decode($content, true);
    }

    /**
     * Discard (delete) a saved state (snapshot).
     *
     * @param string $dashboardId
     * @param string $stateId
     * @return bool True if deleted, false if not found
     */
    public function discardState(string $dashboardId, string $stateId): bool
    {
        $path = $this->getStatePath($dashboardId, $stateId);

        if (!Storage::disk('local')->exists($path)) {
            return false;
        }

        Storage::disk('local')->delete($path);
        return true;
    }

    /**
     * Save a dashboard/project "working copy" to file.
     *
     * NOTE:
     * In the revised model, "Save" in the UI should create a snapshot (saved state),
     * not overwrite the working copy. We keep this method for compatibility and for
     * explicitly saving the current dashboard if needed.
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
            'dataSourceConfig' => $data['content']['dataSourceConfig'] ?? null,
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
     * Load a dashboard/project from file.
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
     * Load a dashboard/project or return a default structure.
     *
     * @param string $id Dashboard ID
     * @return array Dashboard data
     */
    public function loadOrDefault(string $id = 'default'): array
    {
        $dashboard = $this->load($id);

        if ($dashboard) {
            // Migrate old widget structure to new component structure
            $dashboard['artboards'] = array_map(function ($artboard) {
                // If artboard has widgets but no components, migrate
                if (isset($artboard['widgets']) && !isset($artboard['components'])) {
                    $components = [];

                    // Flatten all components from all widgets into a single array
                    foreach ($artboard['widgets'] as $widget) {
                        if (isset($widget['components']) && is_array($widget['components'])) {
                            foreach ($widget['components'] as $component) {
                                // Components now use absolute positioning on the artboard
                                // Add widget position offset to component position
                                $components[] = [
                                    'instanceId' => $component['instanceId'] ?? uniqid('component-'),
                                    'componentType' => $component['componentType'] ?? 'unknown',
                                    'position' => [
                                        'x' => ($component['x'] ?? 0),
                                        'y' => ($component['y'] ?? 0),
                                        'width' => $component['width'] ?? 200,
                                        'height' => $component['height'] ?? 200,
                                        'zIndex' => $component['zIndex'] ?? 0,
                                    ],
                                    'config' => $component['config'] ?? (object)[],
                                    'locked' => $component['locked'] ?? false,
                                ];
                            }
                        }
                    }

                    $artboard['components'] = $components;
                    unset($artboard['widgets']);
                }

                // Ensure components array exists
                if (!isset($artboard['components'])) {
                    $artboard['components'] = [];
                }

                return $artboard;
            }, $dashboard['artboards'] ?? []);

            // Remove archivedWidgets from response
            unset($dashboard['archivedWidgets']);

            // Ensure data source config exists
            $dashboard['dataSourceConfig'] = $dashboard['dataSourceConfig'] ?? null;

            return $dashboard;
        }

        return [
            'id' => $id,
            'name' => 'Untitled Dashboard',
            'artboards' => [],
            'dataSourceConfig' => null,
            'createdAt' => now()->toIso8601String(),
            'updatedAt' => now()->toIso8601String(),
        ];
    }
}
