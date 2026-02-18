<?php

namespace App\Services;

class DataSourceService extends JsonFileRepository
{
    protected function getDirectory(): string
    {
        return 'data-sources';
    }

    protected function getIdPrefix(): string
    {
        return 'ds-';
    }

    protected function mapToListItem(array $data, string $filename): array
    {
        return [
            'id' => $data['id'] ?? $filename,
            'name' => $data['name'] ?? 'Untitled',
            'type' => $data['type'] ?? 'unknown',
            'config' => $data['config'] ?? [],
            'createdAt' => $data['createdAt'] ?? null,
            'updatedAt' => $data['updatedAt'] ?? null,
        ];
    }

    protected function buildNewRecord(array $data): array
    {
        return [
            'name' => $data['name'] ?? 'Untitled Data Source',
            'type' => $data['type'] ?? 'google-sheets',
            'config' => $data['config'] ?? [],
        ];
    }

    protected function mergeForUpdate(array $existing, array $data): array
    {
        return [
            'name' => $data['name'] ?? $existing['name'],
            'type' => $data['type'] ?? $existing['type'],
            'config' => $data['config'] ?? $existing['config'],
        ];
    }
}
