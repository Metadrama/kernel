/**
 * Data Source Configuration Component
 * Handles configuration for different data source types (static, Google Sheets, API)
 */

import { useState, useEffect, useCallback } from 'react';
import { Database, Table, FileSpreadsheet, RefreshCw, Check, AlertCircle, Save, FolderOpen, Trash2, Link, Bookmark } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { DataSource, GoogleSheetsDataSource, SavedDataSource } from '@/types/component-config';
import { useSavedDataSources } from '@/lib/use-saved-data-sources';
import { useSavedSpreadsheets, type SavedSpreadsheet } from '@/lib/use-saved-spreadsheets';

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

  // Saved data sources
  const { savedSources, loading: savedLoading, saveDataSource, deleteDataSource } = useSavedDataSources();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);

  // Saved spreadsheets
  const { savedSpreadsheets, loading: spreadsheetsLoading, saveSpreadsheet, deleteSpreadsheet } = useSavedSpreadsheets();
  const [saveSpreadsheetDialogOpen, setSaveSpreadsheetDialogOpen] = useState(false);
  const [spreadsheetSaveName, setSpreadsheetSaveName] = useState('');
  const [savingSpreadsheet, setSavingSpreadsheet] = useState(false);

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
    // Clear label column if switching to generated
    if (updates.labelMode === 'generated') {
      updates.labelColumn = undefined;
      updates.generatedLabels = updates.generatedLabels || { startDate: new Date().toISOString().split('T')[0], interval: 'month' };
    }
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

  // Load a saved data source
  const handleLoadSavedSource = (savedSource: SavedDataSource) => {
    if (savedSource.type === 'google-sheets') {
      const config = savedSource.config as Omit<GoogleSheetsDataSource, 'type'>;
      onChange({
        type: 'google-sheets',
        ...config,
      });
      // Reset metadata/columns to trigger refetch
      setMetadata(null);
      setColumns(null);
      if (config.spreadsheetId) {
        fetchMetadata(config.spreadsheetId);
      }
    } else if (savedSource.type === 'api') {
      onChange({
        type: 'api',
        ...savedSource.config,
      } as DataSource);
    }
  };

  // Save current data source
  const handleSaveDataSource = async () => {
    if (!saveName.trim() || value.type === 'static') return;

    setSaving(true);
    const { type, ...config } = value;
    await saveDataSource(saveName.trim(), type as 'google-sheets' | 'api', config);
    setSaving(false);
    setSaveDialogOpen(false);
    setSaveName('');
  };

  // Delete a saved data source
  const handleDeleteSavedSource = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this saved data source?')) {
      await deleteDataSource(id);
    }
  };

  // Load a saved spreadsheet
  const handleLoadSavedSpreadsheet = (spreadsheet: SavedSpreadsheet) => {
    updateGoogleSheets({ spreadsheetId: spreadsheet.spreadsheetId });
    setMetadata(null);
    setColumns(null);
    fetchMetadata(spreadsheet.spreadsheetId);
  };

  // Save current spreadsheet
  const handleSaveSpreadsheet = async () => {
    if (!spreadsheetSaveName.trim() || !gsConfig?.spreadsheetId) return;

    setSavingSpreadsheet(true);
    await saveSpreadsheet({
      name: spreadsheetSaveName.trim(),
      spreadsheetId: gsConfig.spreadsheetId,
      spreadsheetTitle: metadata?.title,
      url: `https://docs.google.com/spreadsheets/d/${gsConfig.spreadsheetId}`,
    });
    setSavingSpreadsheet(false);
    setSaveSpreadsheetDialogOpen(false);
    setSpreadsheetSaveName('');
  };

  // Delete a saved spreadsheet
  const handleDeleteSavedSpreadsheet = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this saved spreadsheet?')) {
      await deleteSpreadsheet(id);
    }
  };

  // Check if current config can be saved (has enough data)
  const canSave = value.type === 'google-sheets' && gsConfig?.spreadsheetId && gsConfig?.sheetName;
  const canSaveSpreadsheet = value.type === 'google-sheets' && gsConfig?.spreadsheetId && metadata;

  return (
    <div className="space-y-4">
      {/* Saved Data Sources */}
      {savedSources.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Saved Sources
          </Label>
          <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
            {savedSources.map((source) => (
              <div
                key={source.id}
                className={`flex items-center justify-between text-xs p-2 rounded-md bg-muted/30 group ${disabled || savedLoading
                  ? 'opacity-50 cursor-not-allowed pointer-events-none'
                  : 'hover:bg-muted/50 cursor-pointer'
                  }`}
                onClick={() => !disabled && !savedLoading && handleLoadSavedSource(source)}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileSpreadsheet className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="truncate">{source.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDeleteSavedSource(source.id, e)}
                  disabled={disabled || savedLoading}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

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
          {/* Saved Spreadsheets */}
          {savedSpreadsheets.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Saved Spreadsheets
              </Label>
              <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                {savedSpreadsheets.map((spreadsheet) => (
                  <div
                    key={spreadsheet.id}
                    className={`flex items-center justify-between text-xs p-2 rounded-md bg-muted/30 group ${disabled || spreadsheetsLoading
                        ? 'opacity-50 cursor-not-allowed pointer-events-none'
                        : 'hover:bg-muted/50 cursor-pointer'
                      }`}
                    onClick={() => !disabled && !spreadsheetsLoading && handleLoadSavedSpreadsheet(spreadsheet)}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Link className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate font-medium">{spreadsheet.name}</span>
                      {spreadsheet.spreadsheetTitle && (
                        <span className="text-muted-foreground truncate">({spreadsheet.spreadsheetTitle})</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteSavedSpreadsheet(spreadsheet.id, e)}
                      disabled={disabled || spreadsheetsLoading}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-green-600">
                  <Check className="h-3 w-3" />
                  <span className="truncate">{metadata.title}</span>
                </div>
                {canSaveSpreadsheet && !savedSpreadsheets.some(s => s.spreadsheetId === gsConfig?.spreadsheetId) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={() => {
                      setSpreadsheetSaveName(metadata.title || '');
                      setSaveSpreadsheetDialogOpen(true);
                    }}
                  >
                    <Bookmark className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                )}
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
              {/* Label configuration mode */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Label Source</Label>
                <Select
                  value={gsConfig?.labelMode || 'column'}
                  onValueChange={(v: any) => updateGoogleSheets({ labelMode: v })}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="column">From Column</SelectItem>
                    <SelectItem value="generated">Generated Time Series</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {gsConfig?.labelMode === 'column' || !gsConfig?.labelMode ? (
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
              ) : (
                <div className="grid grid-cols-2 gap-3 rounded-md border p-3 bg-muted/20">
                  <div className="col-span-2 space-y-2">
                    <Label className="text-xs">Generation Method</Label>
                    <Select
                      value={gsConfig?.generatedLabels?.mode || 'step'}
                      onValueChange={(v: any) => updateGoogleSheets({
                        generatedLabels: {
                          ...gsConfig?.generatedLabels,
                          startDate: gsConfig?.generatedLabels?.startDate || new Date().toISOString().split('T')[0],
                          mode: v
                        }
                      })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="step">Fixed Interval (e.g. Daily)</SelectItem>
                        <SelectItem value="fit">Fit to Date Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      type="date"
                      className="h-8 text-xs"
                      value={gsConfig?.generatedLabels?.startDate || ''}
                      onChange={(e) => updateGoogleSheets({
                        generatedLabels: {
                          ...gsConfig?.generatedLabels!,
                          startDate: e.target.value
                        }
                      })}
                    />
                  </div>

                  {gsConfig?.generatedLabels?.mode === 'fit' && (
                    <div className="space-y-2">
                      <Label className="text-xs">End Date</Label>
                      <Input
                        type="date"
                        className="h-8 text-xs"
                        value={gsConfig?.generatedLabels?.endDate || ''}
                        onChange={(e) => updateGoogleSheets({
                          generatedLabels: {
                            ...gsConfig?.generatedLabels!,
                            endDate: e.target.value
                          }
                        })}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-xs">Granularity</Label>
                    <Select
                      value={gsConfig?.generatedLabels?.interval || 'month'}
                      onValueChange={(v: any) => updateGoogleSheets({
                        generatedLabels: {
                          ...gsConfig?.generatedLabels!,
                          interval: v
                        }
                      })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Daily</SelectItem>
                        <SelectItem value="week">Weekly</SelectItem>
                        <SelectItem value="month">Monthly</SelectItem>
                        <SelectItem value="quarter">Quarterly</SelectItem>
                        <SelectItem value="year">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {gsConfig?.generatedLabels?.mode === 'fit' && (
                    <>
                      <div className="col-span-2 separator h-px bg-border my-1" />
                      <div className="col-span-2 space-y-2">
                        <Label className="text-xs">Date Column</Label>
                        <Select
                          value={gsConfig?.generatedLabels?.useDateColumn || undefined}
                          onValueChange={(v: any) => updateGoogleSheets({
                            generatedLabels: {
                              ...gsConfig?.generatedLabels!,
                              useDateColumn: v
                            }
                          })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select date column" />
                          </SelectTrigger>
                          <SelectContent>
                            {columns.headers.map((header, idx) => (
                              <SelectItem key={idx} value={header || `Column ${idx + 1}`}>
                                {String.fromCharCode(65 + idx)}: {header || `Column ${idx + 1}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">Rows calculate date from this column.</p>
                      </div>
                    </>
                  )}
                </div>
              )}

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

              {/* Aggregation Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Aggregation</Label>
                <Select
                  value={gsConfig?.aggregation || 'sum'}
                  onValueChange={(v: any) => updateGoogleSheets({ aggregation: v })}
                  disabled={disabled}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sum">Sum (Total)</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="count">Count</SelectItem>
                    <SelectItem value="min">Minimum</SelectItem>
                    <SelectItem value="max">Maximum</SelectItem>
                    <SelectItem value="none">None (Raw Data)</SelectItem>
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

              {/* Save Data Source Button */}
              {canSave && (
                <div className="pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setSaveDialogOpen(true)}
                    disabled={disabled}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save as Reusable Source
                  </Button>
                </div>
              )}
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

      {/* Save Data Source Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Data Source</DialogTitle>
            <DialogDescription>
              Save this data source configuration for quick reuse in other components.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="source-name">Name</Label>
              <Input
                id="source-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g., Sales Data Q4 2024"
                autoFocus
              />
            </div>
            {metadata && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Spreadsheet:</strong> {metadata.title}</p>
                <p><strong>Sheet:</strong> {gsConfig?.sheetName}</p>
                {gsConfig?.valueColumn && <p><strong>Value Column:</strong> {gsConfig.valueColumn}</p>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDataSource} disabled={!saveName.trim() || saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Spreadsheet Dialog */}
      <Dialog open={saveSpreadsheetDialogOpen} onOpenChange={setSaveSpreadsheetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Spreadsheet</DialogTitle>
            <DialogDescription>
              Save this spreadsheet link for quick access when creating new components.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="spreadsheet-name">Name</Label>
              <Input
                id="spreadsheet-name"
                value={spreadsheetSaveName}
                onChange={(e) => setSpreadsheetSaveName(e.target.value)}
                placeholder="e.g., Q4 Sales Report"
                autoFocus
              />
            </div>
            {metadata && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Spreadsheet:</strong> {metadata.title}</p>
                <p><strong>Sheets:</strong> {metadata.sheets.length}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveSpreadsheetDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSpreadsheet} disabled={!spreadsheetSaveName.trim() || savingSpreadsheet}>
              {savingSpreadsheet ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DataSourceConfig;
