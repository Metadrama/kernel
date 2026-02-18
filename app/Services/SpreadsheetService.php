<?php

namespace App\Services;

class SpreadsheetService extends JsonFileRepository
{
    protected function getDirectory(): string
    {
        return 'spreadsheets';
    }

    protected function getIdPrefix(): string
    {
        return 'ss-';
    }

    protected function mapToListItem(array $data, string $filename): array
    {
        return [
            'id' => $data['id'] ?? $filename,
            'name' => $data['name'] ?? 'Untitled',
            'spreadsheetId' => $data['spreadsheetId'] ?? '',
            'spreadsheetTitle' => $data['spreadsheetTitle'] ?? null,
            'url' => $data['url'] ?? null,
            'createdAt' => $data['createdAt'] ?? null,
            'updatedAt' => $data['updatedAt'] ?? null,
        ];
    }

    protected function buildNewRecord(array $data): array
    {
        return [
            'name' => $data['name'] ?? 'Untitled Spreadsheet',
            'spreadsheetId' => $data['spreadsheetId'] ?? '',
            'spreadsheetTitle' => $data['spreadsheetTitle'] ?? null,
            'url' => $data['url'] ?? null,
        ];
    }

    protected function mergeForUpdate(array $existing, array $data): array
    {
        return [
            'name' => $data['name'] ?? $existing['name'],
            'spreadsheetId' => $data['spreadsheetId'] ?? $existing['spreadsheetId'],
            'spreadsheetTitle' => $data['spreadsheetTitle'] ?? $existing['spreadsheetTitle'],
            'url' => $data['url'] ?? $existing['url'],
        ];
    }
}
