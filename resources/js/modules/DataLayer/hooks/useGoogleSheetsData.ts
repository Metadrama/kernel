import { useState, useCallback } from 'react';

interface SheetMetadata {
    spreadsheetId: string;
    title: string;
    sheets: Array<{
        sheetId: number;
        title: string;
        rowCount: number;
        columnCount: number;
    }>;
}

interface SheetColumns {
    headers: string[];
    sampleData: string[][];
}

interface UseGoogleSheetsDataReturn {
    metadata: SheetMetadata | null;
    setMetadata: React.Dispatch<React.SetStateAction<SheetMetadata | null>>;
    columns: SheetColumns | null;
    setColumns: React.Dispatch<React.SetStateAction<SheetColumns | null>>;
    loading: boolean;
    error: string | null;
    fetchMetadata: (spreadsheetId: string) => Promise<void>;
    fetchColumns: (spreadsheetId: string, sheetName: string, headerRow?: number) => Promise<void>;
    clearData: () => void;
}

/**
 * Hook for fetching Google Sheets metadata and column data
 * Handles API calls, loading states, and error management
 */
export function useGoogleSheetsData(): UseGoogleSheetsDataReturn {
    const [metadata, setMetadata] = useState<SheetMetadata | null>(null);
    const [columns, setColumns] = useState<SheetColumns | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMetadata = useCallback(async (spreadsheetId: string) => {
        if (!spreadsheetId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/sheets/metadata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ spreadsheet_id: spreadsheetId }),
            });

            const data = await response.json();

            if (data.success) {
                setMetadata(data.metadata);
            } else {
                setError(data.error || 'Failed to fetch spreadsheet');
            }
        } catch (err) {
            setError('Failed to connect to API');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchColumns = useCallback(async (spreadsheetId: string, sheetName: string, headerRow: number = 1) => {
        if (!spreadsheetId || !sheetName) return;

        setLoading(true);
        setError(null);

        try {
            // Escape sheet name for Google Sheets API (wrap in single quotes if it contains special characters)
            const escapedSheetName = /[^\w]/.test(sheetName) ? `'${sheetName.replace(/'/g, "''")}'` : sheetName;

            // Fetch header row and a few sample rows
            const range = `${escapedSheetName}!A${headerRow}:Z${headerRow + 3}`;
            const response = await fetch('/api/sheets/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    spreadsheet_id: spreadsheetId,
                    range,
                }),
            });

            const data = await response.json();

            if (data.success && data.data?.length > 0) {
                setColumns({
                    headers: (data.data[0] || []).map((h: unknown) => String(h || '')),
                    sampleData: (data.data.slice(1) || []).map((row: unknown[]) =>
                        (row || []).map((cell: unknown) => String(cell || ''))
                    ),
                });
            } else {
                setColumns({ headers: [], sampleData: [] });
                if (!data.success) {
                    setError(data.error || 'Failed to fetch columns');
                }
            }
        } catch (err) {
            console.error('Failed to fetch columns:', err);
            setError('Failed to fetch column data');
            setColumns({ headers: [], sampleData: [] });
        } finally {
            setLoading(false);
        }
    }, []);

    const clearData = useCallback(() => {
        setMetadata(null);
        setColumns(null);
        setError(null);
    }, []);

    return {
        metadata,
        setMetadata,
        columns,
        setColumns,
        loading,
        error,
        fetchMetadata,
        fetchColumns,
        clearData,
    };
}
