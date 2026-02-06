import { useEffect } from 'react';
import { AlertCircle, Bookmark, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/modules/DesignSystem/ui/button';
import { Input } from '@/modules/DesignSystem/ui/input';
import { Label } from '@/modules/DesignSystem/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/modules/DesignSystem/ui/select';
import type { GoogleSheetsDataSource } from '@/modules/DataLayer/types/component-config';
import { useGoogleSheetsData } from '@/modules/DataLayer/hooks/useGoogleSheetsData';
import { ColumnMappingConfig } from './ColumnMappingConfig';
import { SavedSpreadsheetsSection } from './SavedSpreadsheetsSection';
import { useSavedSpreadsheets, type SavedSpreadsheet } from '@/modules/DataLayer/hooks/use-saved-spreadsheets';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/modules/DesignSystem/ui/dialog';
import { Save } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/modules/DesignSystem/ui/accordion';

interface GoogleSheetsConfigProps {
    value: GoogleSheetsDataSource;
    disabled?: boolean;
    onChange: (updates: Partial<GoogleSheetsDataSource>) => void;
    onSaveComplete?: () => void;
}

export function GoogleSheetsConfig({ value, disabled, onChange, onSaveComplete }: GoogleSheetsConfigProps) {
    const { metadata, columns, loading, error, fetchMetadata, fetchColumns, clearData } = useGoogleSheetsData();
    const { savedSpreadsheets, loading: spreadsheetsLoading, saveSpreadsheet, deleteSpreadsheet } = useSavedSpreadsheets();

    const [saveSpreadsheetDialogOpen, setSaveSpreadsheetDialogOpen] = useState(false);
    const [spreadsheetSaveName, setSpreadsheetSaveName] = useState('');
    const [savingSpreadsheet, setSavingSpreadsheet] = useState(false);

    // Auto-fetch metadata when spreadsheet ID is set
    useEffect(() => {
        if (value.spreadsheetId && !metadata) {
            fetchMetadata(value.spreadsheetId);
        }
    }, [value.spreadsheetId, metadata, fetchMetadata]);

    // Auto-fetch columns when sheet is selected
    useEffect(() => {
        if (value.spreadsheetId && value.sheetName) {
            fetchColumns(value.spreadsheetId, value.sheetName, value.headerRow ?? 1);
        }
    }, [value.spreadsheetId, value.sheetName, value.headerRow, fetchColumns]);

    // Extract spreadsheet ID from URL if pasted
    const handleSpreadsheetInput = (input: string) => {
        let id = input;

        // Try to extract ID from URL
        const urlMatch = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (urlMatch) {
            id = urlMatch[1];
        }

        onChange({ spreadsheetId: id });
        if (id && id !== value.spreadsheetId) {
            clearData();
            fetchMetadata(id);
        }
    };

    // Load a saved spreadsheet
    const handleLoadSavedSpreadsheet = (spreadsheet: SavedSpreadsheet) => {
        onChange({ spreadsheetId: spreadsheet.spreadsheetId });
        clearData();
        fetchMetadata(spreadsheet.spreadsheetId);
    };

    // Save current spreadsheet
    const handleSaveSpreadsheet = async () => {
        if (!spreadsheetSaveName.trim() || !value.spreadsheetId) return;

        setSavingSpreadsheet(true);
        await saveSpreadsheet({
            name: spreadsheetSaveName.trim(),
            spreadsheetId: value.spreadsheetId,
            spreadsheetTitle: metadata?.title,
            url: `https://docs.google.com/spreadsheets/d/${value.spreadsheetId}`,
        });
        setSavingSpreadsheet(false);
        setSaveSpreadsheetDialogOpen(false);
        setSpreadsheetSaveName('');
        onSaveComplete?.();
    };

    // Delete a saved spreadsheet
    const handleDeleteSavedSpreadsheet = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this saved spreadsheet?')) {
            await deleteSpreadsheet(id);
        }
    };

    const canSaveSpreadsheet = value.spreadsheetId && metadata;

    return (
        <>
            {/* Saved Spreadsheets */}
            <SavedSpreadsheetsSection
                savedSpreadsheets={savedSpreadsheets}
                loading={spreadsheetsLoading}
                disabled={disabled}
                onLoad={handleLoadSavedSpreadsheet}
                onDelete={handleDeleteSavedSpreadsheet}
            />

            {/* Spreadsheet ID/URL */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">Spreadsheet</Label>
                <div className="flex gap-2">
                    <Input
                        value={value.spreadsheetId || ''}
                        onChange={(e) => handleSpreadsheetInput(e.target.value)}
                        placeholder="Paste spreadsheet URL or ID"
                        disabled={disabled}
                        className="h-9 text-sm flex-1"
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => value.spreadsheetId && fetchMetadata(value.spreadsheetId)}
                        disabled={disabled || loading || !value.spreadsheetId}
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
                        {canSaveSpreadsheet && !savedSpreadsheets.some((s) => s.spreadsheetId === value.spreadsheetId) && (
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
                        value={value.sheetName || undefined}
                        onValueChange={(v) => onChange({ sheetName: v })}
                        disabled={disabled}
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Select a sheet" />
                        </SelectTrigger>
                        <SelectContent>
                            {metadata.sheets
                                .filter((sheet) => sheet.title && sheet.title.trim() !== '')
                                .map((sheet) => (
                                    <SelectItem key={sheet.sheetId} value={sheet.title}>
                                        {sheet.title} ({sheet.rowCount} rows)
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Advanced Settings - Collapsible */}
            {value.sheetName && (
                <Accordion type="single" collapsible className="border rounded-md px-3">
                    <AccordionItem value="advanced" className="border-0">
                        <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:no-underline">
                            Advanced Settings
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="space-y-2">
                                    <Label className="text-xs">Header Row</Label>
                                    <Input
                                        type="number"
                                        value={value.headerRow ?? 1}
                                        onChange={(e) => onChange({ headerRow: Number(e.target.value) || 1 })}
                                        min={1}
                                        disabled={disabled}
                                        className="h-8 text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs">Data Start Row</Label>
                                    <Input
                                        type="number"
                                        value={value.dataStartRow ?? 2}
                                        onChange={(e) => onChange({ dataStartRow: Number(e.target.value) || 2 })}
                                        min={1}
                                        disabled={disabled}
                                        className="h-8 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 pt-3">
                                <Label className="text-xs">Currency</Label>
                                <Select
                                    value={value.currencyCode || 'MYR'}
                                    onValueChange={(v) => onChange({ currencyCode: v })}
                                    disabled={disabled}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MYR">MYR (RM)</SelectItem>
                                        <SelectItem value="USD">USD ($)</SelectItem>
                                        <SelectItem value="EUR">EUR (EUR)</SelectItem>
                                        <SelectItem value="GBP">GBP (GBP)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            )}

            {/* Column Mappings */}
            {columns && columns.headers.length > 0 && (
                <>
                    <ColumnMappingConfig columns={columns} config={value} disabled={disabled} onUpdate={onChange} />

                    {/* Save Data Source Button */}
                    {onSaveComplete && (
                        <div className="pt-2 border-t">
                            <Button variant="outline" size="sm" className="w-full" onClick={onSaveComplete} disabled={disabled}>
                                <Save className="h-4 w-4 mr-2" />
                                Save as Presets
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Save Spreadsheet Dialog */}
            <Dialog open={saveSpreadsheetDialogOpen} onOpenChange={setSaveSpreadsheetDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Save Spreadsheet</DialogTitle>
                        <DialogDescription>Save this spreadsheet for quick reuse in other components.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="spreadsheet-name">Name</Label>
                            <Input
                                id="spreadsheet-name"
                                value={spreadsheetSaveName}
                                onChange={(e) => setSpreadsheetSaveName(e.target.value)}
                                placeholder="e.g., Sales Data Q4 2024"
                                autoFocus
                            />
                        </div>
                        {metadata && (
                            <div className="text-xs text-muted-foreground space-y-1">
                                <p>
                                    <strong>Spreadsheet:</strong> {metadata.title}
                                </p>
                                <p>
                                    <strong>ID:</strong> {value.spreadsheetId}
                                </p>
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
        </>
    );
}


