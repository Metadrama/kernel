<?php

namespace App\Services;

/**
 * Handles migration of legacy dashboard structures.
 *
 * Converts old widget-based artboard layouts to the current
 * component-based flat structure.
 */
class DashboardMigrator
{
    /**
     * Migrate a dashboard's artboards from legacy widget structure
     * to the current component structure.
     */
    public function migrate(array $dashboard): array
    {
        $dashboard['artboards'] = array_map(
            [$this, 'migrateArtboard'],
            $dashboard['artboards'] ?? []
        );

        // Remove deprecated fields
        unset($dashboard['archivedWidgets']);

        // Ensure data source config exists
        $dashboard['dataSourceConfig'] = $dashboard['dataSourceConfig'] ?? null;

        return $dashboard;
    }

    /**
     * Migrate a single artboard from widget to component structure.
     */
    protected function migrateArtboard(array $artboard): array
    {
        // If artboard has widgets but no components, migrate
        if (isset($artboard['widgets']) && ! isset($artboard['components'])) {
            $artboard['components'] = $this->flattenWidgets($artboard['widgets']);
            unset($artboard['widgets']);
        }

        // Ensure components array exists
        if (! isset($artboard['components'])) {
            $artboard['components'] = [];
        }

        return $artboard;
    }

    /**
     * Flatten all components from legacy widget containers into a single array.
     */
    protected function flattenWidgets(array $widgets): array
    {
        $components = [];

        foreach ($widgets as $widget) {
            if (! isset($widget['components']) || ! is_array($widget['components'])) {
                continue;
            }

            foreach ($widget['components'] as $component) {
                $components[] = [
                    'instanceId' => $component['instanceId'] ?? uniqid('component-'),
                    'componentType' => $component['componentType'] ?? 'unknown',
                    'position' => [
                        'x' => $component['x'] ?? 0,
                        'y' => $component['y'] ?? 0,
                        'width' => $component['width'] ?? 200,
                        'height' => $component['height'] ?? 200,
                        'zIndex' => $component['zIndex'] ?? 0,
                    ],
                    'config' => $component['config'] ?? (object) [],
                    'locked' => $component['locked'] ?? false,
                ];
            }
        }

        return $components;
    }
}
