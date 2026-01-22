import type { DataSource, GoogleSheetsDataSource } from '@/features/data-sources/types/component-config';
import { useMemo } from 'react';
import { DataSourceConfig } from './DataSourceConfig';

interface DataSourceFieldProps {
    globalConfig: DataSource | null;
    localConfig: Partial<DataSource>;
    onChange: (updates: Partial<DataSource>) => void;
}

export function DataSourceField({ globalConfig, localConfig, onChange }: DataSourceFieldProps) {
    const effectiveConfig = useMemo(() => {
        // 1. If global is not set, just use local (defaulting to static if empty)
        if (!globalConfig) {
            return (localConfig as DataSource) || { type: 'static' };
        }

        // 2. If local explicitly sets a type, and it matches global, we merge.
        // If local has no type, we assume it inherits global's type.
        const effectiveType = localConfig.type || globalConfig.type;

        // 3. If types differ, Local overrides completely (no inheritance of fields)
        if (effectiveType !== globalConfig.type) {
            return (localConfig as DataSource) || { type: effectiveType };
        }

        // 4. Same Value Merging: Global defaults -> Local overrides
        // We use a smart merge where "Empty String" in local does NOT override Global value.
        // This allows "Reset to Global" behavior by clearing the field.
        const merged = { ...globalConfig, ...localConfig };

        // Explicitly handle relevant fields for Google Sheets to implement "Empty means Inherit"
        if (effectiveType === 'google-sheets') {
            const g = globalConfig as GoogleSheetsDataSource;
            const l = localConfig as Partial<GoogleSheetsDataSource>;
            return {
                ...merged,
                spreadsheetId: l.spreadsheetId || g.spreadsheetId,
                sheetName: l.sheetName || g.sheetName,
            } as GoogleSheetsDataSource;
        }

        return merged as DataSource;

    }, [globalConfig, localConfig]);

    return (
        <div className="space-y-4">
            {/* Hint about inheritance */}
            {globalConfig && (!localConfig.type || localConfig.type === globalConfig.type) && (
                <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                    <p>Inheriting from Workspace Settings.</p>
                    <p>Edit below to override for this widget.</p>
                </div>
            )}

            <DataSourceConfig
                value={effectiveConfig}
                onChange={onChange}
                componentType="widget"
            />
        </div>
    );
}
