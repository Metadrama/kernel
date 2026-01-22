
import { useGoogleSheetsData } from '@/features/data-sources/hooks/useGoogleSheetsData';
import { ColumnMappingConfig } from './ColumnMappingConfig';
import { Button } from '@/shared/components/ui/button';
import { Loader2, Database } from 'lucide-react';
import type { DataSource, GoogleSheetsDataSource } from '@/features/data-sources/types/component-config';
import { useEffect } from 'react';

interface DataSourceFieldProps {
    globalConfig: DataSource | null;
    localConfig: Partial<GoogleSheetsDataSource>;
    onChange: (updates: Partial<GoogleSheetsDataSource>) => void;
}

export function DataSourceField({ globalConfig, localConfig, onChange }: DataSourceFieldProps) {
    const { columns, loading, fetchColumns, error } = useGoogleSheetsData();

    const isGoogleSheets = globalConfig?.type === 'google-sheets';
    const sheetConfig = globalConfig as GoogleSheetsDataSource | undefined;

    useEffect(() => {
        if (isGoogleSheets && sheetConfig?.spreadsheetId && sheetConfig?.sheetName) {
            fetchColumns(sheetConfig.spreadsheetId, sheetConfig.sheetName, sheetConfig.headerRow || 1);
        }
    }, [isGoogleSheets, sheetConfig?.spreadsheetId, sheetConfig?.sheetName, sheetConfig?.headerRow, fetchColumns]);

    if (!globalConfig || globalConfig.type === 'static') {
        return (
            <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                <p>No global data source configured.</p>
                <p className="text-xs mt-1">Go to Workspace Settings to connect a data source.</p>
            </div>
        );
    }

    if (!isGoogleSheets) {
        return (
            <div className="rounded-md border p-3 text-sm text-muted-foreground">
                <Database className="mb-2 h-4 w-4" />
                <p>Global source type '{globalConfig.type}' is not yet supported for mapping.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="text-sm">Loading columns...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <p>Failed to load columns: {error}</p>
            </div>
        );
    }

    if (!columns || columns.headers.length === 0) {
        return (
            <div className="rounded-md border p-3 text-sm text-muted-foreground">
                <p>No columns found in the connected sheet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md bg-muted/30 p-2 text-xs text-muted-foreground">
                Connected to: <strong>{sheetConfig?.sheetName}</strong>
            </div>

            <ColumnMappingConfig
                columns={columns}
                config={{ ...sheetConfig, ...localConfig } as GoogleSheetsDataSource}
                onUpdate={onChange}
            />
        </div>
    );
}
