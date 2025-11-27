/**
 * Data Source Configuration Component
 * Handles configuration for different data source types (static, Google Sheets, API)
 */

import { useState, useEffect, useCallback } from 'react';
import { Database, Table, FileSpreadsheet, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DataSource, GoogleSheetsDataSource } from '@/types/component-config';

interface DataSourceConfigProps {
  value: DataSource;
  onChange: (value: DataSource) => void;
  disabled?: boolean;
}

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

export function DataSourceConfig({ value, onChange, disabled }: DataSourceConfigProps) {
  const [metadata, setMetadata] = useState<SheetMetadata | null>(null);
  const [columns, setColumns] = useState<SheetColumns | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sourceType = value.type;
  const gsConfig = value.type === 'google-sheets' ? value : null;

  // Fetch spreadsheet metadata when ID changes
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

  // Fetch columns when sheet changes
  const fetchColumns = useCallback(async (spreadsheetId: string, sheetName: string, headerRow: number = 2) => {
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

  // Auto-fetch metadata when spreadsheet ID is set
  useEffect(() => {
    if (gsConfig?.spreadsheetId && !metadata) {
      fetchMetadata(gsConfig.spreadsheetId);
    }
  }, [gsConfig?.spreadsheetId, metadata, fetchMetadata]);

  // Auto-fetch columns when sheet is selected
  useEffect(() => {
    if (gsConfig?.spreadsheetId && gsConfig?.sheetName) {
      fetchColumns(gsConfig.spreadsheetId, gsConfig.sheetName, gsConfig.headerRow || 2);
    }
  }, [gsConfig?.spreadsheetId, gsConfig?.sheetName, gsConfig?.headerRow, fetchColumns]);

  const handleTypeChange = (newType: DataSource['type']) => {
    if (newType === 'static') {
      onChange({ type: 'static' });
    } else if (newType === 'google-sheets') {
      onChange({
        type: 'google-sheets',
        spreadsheetId: '',
        sheetName: '',
        range: '',
        headerRow: 2,
        dataStartRow: 3,
      });
    } else {
      onChange({
        type: 'api',
        endpoint: '',
      });
    }
    setMetadata(null);
    setColumns(null);
  };

  const updateGoogleSheets = (updates: Partial<GoogleSheetsDataSource>) => {
    if (value.type !== 'google-sheets') return;
    onChange({ ...value, ...updates });
  };

  // Extract spreadsheet ID from URL if pasted
  const handleSpreadsheetInput = (input: string) => {
    let id = input;
    
    // Try to extract ID from URL
    const urlMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch) {
      id = urlMatch[1];
    }
    
    updateGoogleSheets({ spreadsheetId: id });
    if (id && id !== gsConfig?.spreadsheetId) {
      setMetadata(null);
      setColumns(null);
      fetchMetadata(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Data Source Type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Source Type</Label>
        <Select value={sourceType} onValueChange={handleTypeChange} disabled={disabled}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="static">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>Static (Mock Data)</span>
              </div>
            </SelectItem>
            <SelectItem value="google-sheets">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Google Sheets</span>
              </div>
            </SelectItem>
            <SelectItem value="api" disabled>
              <div className="flex items-center gap-2">
                <Table className="h-4 w-4" />
                <span>API (Coming Soon)</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Google Sheets Configuration */}
      {sourceType === 'google-sheets' && (
        <>
          {/* Spreadsheet ID/URL */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Spreadsheet</Label>
            <div className="flex gap-2">
              <Input
                value={gsConfig?.spreadsheetId || ''}
                onChange={(e) => handleSpreadsheetInput(e.target.value)}
                placeholder="Paste spreadsheet URL or ID"
                disabled={disabled}
                className="h-9 text-sm flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => gsConfig?.spreadsheetId && fetchMetadata(gsConfig.spreadsheetId)}
                disabled={disabled || loading || !gsConfig?.spreadsheetId}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            {metadata && (
              <div className="flex items-center gap-1.5 text-xs text-green-600">
                <Check className="h-3 w-3" />
                <span className="truncate">{metadata.title}</span>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Sheet Selection */}
          {metadata && metadata.sheets.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sheet</Label>
              <Select 
                value={gsConfig?.sheetName || undefined} 
                onValueChange={(v) => updateGoogleSheets({ sheetName: v })}
                disabled={disabled}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select a sheet" />
                </SelectTrigger>
                <SelectContent>
                  {metadata.sheets
                    .filter(sheet => sheet.title && sheet.title.trim() !== '')
                    .map((sheet) => (
                      <SelectItem key={sheet.sheetId} value={sheet.title}>
                        {sheet.title} ({sheet.rowCount} rows)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Header Row Config */}
          {gsConfig?.sheetName && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Header Row</Label>
                <Input
                  type="number"
                  value={gsConfig?.headerRow || 2}
                  onChange={(e) => updateGoogleSheets({ headerRow: Number(e.target.value) || 2 })}
                  min={1}
                  disabled={disabled}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Data Start Row</Label>
                <Input
                  type="number"
                  value={gsConfig?.dataStartRow || 3}
                  onChange={(e) => updateGoogleSheets({ dataStartRow: Number(e.target.value) || 3 })}
                  min={1}
                  disabled={disabled}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}

          {/* Column Mappings */}
          {columns && columns.headers.length > 0 && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Label Column</Label>
                <Select 
                  value={gsConfig?.labelColumn || undefined} 
                  onValueChange={(v) => updateGoogleSheets({ labelColumn: v })}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select column for labels" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.headers.map((header, idx) => (
                      <SelectItem key={idx} value={header || `Column ${idx + 1}`}>
                        {String.fromCharCode(65 + idx)}: {header || `Column ${idx + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Value Column</Label>
                <Select 
                  value={gsConfig?.valueColumn || undefined} 
                  onValueChange={(v) => updateGoogleSheets({ valueColumn: v })}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select column for values" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.headers.map((header, idx) => {
                      const sampleValue = columns.sampleData?.[0]?.[idx];
                      const displaySample = sampleValue 
                        ? ` (e.g., ${String(sampleValue).substring(0, 15)}${String(sampleValue).length > 15 ? '...' : ''})` 
                        : '';
                      return (
                        <SelectItem key={idx} value={header || `Column ${idx + 1}`}>
                          {String.fromCharCode(65 + idx)}: {header || `Column ${idx + 1}`}{displaySample}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Configuration */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Filter (Optional)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select 
                    value={gsConfig?.filterColumn || '__none__'} 
                    onValueChange={(v) => updateGoogleSheets({ filterColumn: v === '__none__' ? undefined : v })}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Filter by column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No filter</SelectItem>
                      {columns.headers.map((header, idx) => (
                        <SelectItem key={idx} value={header || `Column ${idx + 1}`}>
                          {header || `Column ${idx + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={gsConfig?.filterValue || ''}
                    onChange={(e) => updateGoogleSheets({ filterValue: e.target.value || undefined })}
                    placeholder="Filter value"
                    disabled={disabled || !gsConfig?.filterColumn}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Static Data Info */}
      {sourceType === 'static' && (
        <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
          Using built-in sample data. Select "Google Sheets" to connect to real data.
        </div>
      )}
    </div>
  );
}

export default DataSourceConfig;
