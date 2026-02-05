/**
 * Data Source Configuration Component (Refactored)
 * Orchestrates data source type selection and delegates to specialized components
 */

import { useState } from 'react';
import { Database, FileSpreadsheet, Table } from 'lucide-react';
import { Input } from '@/modules/DesignSystem/ui/input';
import { Label } from '@/modules/DesignSystem/ui/label';
import { Button } from '@/modules/DesignSystem/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/DesignSystem/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/modules/DesignSystem/ui/dialog';
import type { DataSource, GoogleSheetsDataSource, SavedDataSource } from '@/modules/DataLayer/types/component-config';
import { useSavedDataSources } from '@/modules/DataLayer/hooks/use-saved-data-sources';
import { Save } from 'lucide-react';
import { GoogleSheetsConfig } from './GoogleSheetsConfig';
import { SavedSourcesSection } from './SavedSourcesSection';

interface DataSourceConfigProps {
  value: DataSource;
  onChange: (value: DataSource) => void;
  disabled?: boolean;
  /** The component type this data source is being configured for */
  componentType?: string;
}

export function DataSourceConfig({ value, onChange, disabled, componentType }: DataSourceConfigProps) {
  const { savedSources, loading: savedLoading, saveDataSource, deleteDataSource } = useSavedDataSources();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedSourceType, setSelectedSourceType] = useState<DataSource['type'] | 'saved' | ''>(value.type ?? '');

  const sourceType = selectedSourceType;
  const gsConfig = value.type === 'google-sheets' ? value : null;

  const handleTypeChange = (newType: DataSource['type'] | 'saved') => {
    setSelectedSourceType(newType);
    if (newType === 'saved') return;
    if (newType === 'static') {
      onChange({ type: 'static' });
    } else if (newType === 'google-sheets') {
      onChange({
        type: 'google-sheets',
        spreadsheetId: '',
        sheetName: '',
        range: '',
        headerRow: 1,
        dataStartRow: 2,
      });
    } else {
      onChange({
        type: 'api',
        endpoint: '',
      });
    }
  };

  const updateGoogleSheets = (updates: Partial<GoogleSheetsDataSource>) => {
    if (value.type !== 'google-sheets') return;
    // Clear label column if switching to generated
    if (updates.labelMode === 'generated') {
      updates.labelColumn = undefined;
      updates.generatedLabels = updates.generatedLabels || {
        startDate: new Date().toISOString().split('T')[0],
        interval: 'month',
      };
    }
    onChange({ ...value, ...updates });
  };

  // Load a saved data source
  const handleLoadSavedSource = (savedSource: SavedDataSource) => {
    if (savedSource.type === 'google-sheets') {
      const config = savedSource.config as Omit<GoogleSheetsDataSource, 'type'>;
      onChange({
        type: 'google-sheets',
        ...config,
      });
      setSelectedSourceType('google-sheets');
    } else if (savedSource.type === 'api') {
      onChange({
        type: 'api',
        ...savedSource.config,
      } as DataSource);
      setSelectedSourceType('api');
    }
  };

  // Save current data source
  const handleSaveDataSource = async () => {
    if (!saveName.trim() || value.type === 'static') return;

    setSaving(true);
    const { type, ...config } = value;
    await saveDataSource(saveName.trim(), type as 'google-sheets' | 'api', config, componentType);
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

  const canSave = value.type === 'google-sheets' && gsConfig?.spreadsheetId && gsConfig?.sheetName;
  const showSavedSources = sourceType === 'saved';
  const showGoogleSheets = sourceType === 'google-sheets' && gsConfig;
  const showStaticInfo = sourceType === 'static';
  const hasDetails = showSavedSources || showGoogleSheets || showStaticInfo;

  return (
    <div className="space-y-4">
      {/* Data Source Group */}
      <div className="space-y-3 rounded-md border bg-muted/10 p-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Source Type</Label>
          <Select value={sourceType || undefined} onValueChange={handleTypeChange} disabled={disabled}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select source type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="saved">
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  <span>Presets</span>
                </div>
              </SelectItem>
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

        {/* Source Type Details */}
        {hasDetails && (
          <div className="space-y-4 border-t pt-3">
            {/* Saved Data Sources */}
            {showSavedSources && (
              <SavedSourcesSection
                savedSources={savedSources}
                loading={savedLoading}
                disabled={disabled}
                onLoad={handleLoadSavedSource}
                onDelete={handleDeleteSavedSource}
              />
            )}

            {/* Google Sheets Configuration */}
            {showGoogleSheets && (
              <GoogleSheetsConfig
                value={gsConfig}
                disabled={disabled}
                onChange={updateGoogleSheets}
                onSaveComplete={canSave ? () => setSaveDialogOpen(true) : undefined}
              />
            )}

            {/* Static Data Info */}
            {showStaticInfo && (
              <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                Using built-in sample data. Select "Google Sheets" to connect to real data.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Data Source Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Data Source</DialogTitle>
            <DialogDescription>Save this data source configuration for quick reuse in other components.</DialogDescription>
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
            {gsConfig && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  <strong>Spreadsheet ID:</strong> {gsConfig.spreadsheetId}
                </p>
                <p>
                  <strong>Sheet:</strong> {gsConfig.sheetName}
                </p>
                {gsConfig.valueColumn && (
                  <p>
                    <strong>Value Column:</strong> {gsConfig.valueColumn}
                  </p>
                )}
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
    </div>
  );
}

export default DataSourceConfig;


