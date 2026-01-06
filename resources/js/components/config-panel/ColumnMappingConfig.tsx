import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GoogleSheetsDataSource } from '@/types/component-config';

interface SheetColumns {
    headers: string[];
    sampleData: string[][];
}

interface ColumnMappingConfigProps {
    columns: SheetColumns;
    config: GoogleSheetsDataSource;
    disabled?: boolean;
    onUpdate: (updates: Partial<GoogleSheetsDataSource>) => void;
}

export function ColumnMappingConfig({ columns, config, disabled, onUpdate }: ColumnMappingConfigProps) {
    return (
        <>
            {/* Label Source Mode */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">Label Source</Label>
                <Select
                    value={config.labelMode || 'column'}
                    onValueChange={(v: any) => onUpdate({ labelMode: v })}
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

            {/* Label Column or Generated Config */}
            {config.labelMode === 'column' || !config.labelMode ? (
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Label Column</Label>
                    <Select
                        value={config.labelColumn || undefined}
                        onValueChange={(v) => onUpdate({ labelColumn: v })}
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
                    {/* Generation Method */}
                    <div className="col-span-2 space-y-2">
                        <Label className="text-xs">Generation Method</Label>
                        <Select
                            value={config.generatedLabels?.mode || 'step'}
                            onValueChange={(v: any) =>
                                onUpdate({
                                    generatedLabels: {
                                        ...config.generatedLabels,
                                        startDate: config.generatedLabels?.startDate || new Date().toISOString().split('T')[0],
                                        mode: v,
                                    },
                                })
                            }
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

                    {/* Start Date */}
                    <div className="space-y-2">
                        <Label className="text-xs">Start Date</Label>
                        <Input
                            type="date"
                            className="h-8 text-xs"
                            value={config.generatedLabels?.startDate || ''}
                            onChange={(e) =>
                                onUpdate({
                                    generatedLabels: {
                                        ...config.generatedLabels!,
                                        startDate: e.target.value,
                                    },
                                })
                            }
                        />
                    </div>

                    {/* End Date (for fit mode) */}
                    {config.generatedLabels?.mode === 'fit' && (
                        <div className="space-y-2">
                            <Label className="text-xs">End Date</Label>
                            <Input
                                type="date"
                                className="h-8 text-xs"
                                value={config.generatedLabels?.endDate || ''}
                                onChange={(e) =>
                                    onUpdate({
                                        generatedLabels: {
                                            ...config.generatedLabels!,
                                            endDate: e.target.value,
                                        },
                                    })
                                }
                            />
                        </div>
                    )}

                    {/* Granularity */}
                    <div className="space-y-2">
                        <Label className="text-xs">Granularity</Label>
                        <Select
                            value={config.generatedLabels?.interval || 'month'}
                            onValueChange={(v: any) =>
                                onUpdate({
                                    generatedLabels: {
                                        ...config.generatedLabels!,
                                        interval: v,
                                    },
                                })
                            }
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

                    {/* Date Column (for fit mode) */}
                    {config.generatedLabels?.mode === 'fit' && (
                        <>
                            <div className="col-span-2 separator h-px bg-border my-1" />
                            <div className="col-span-2 space-y-2">
                                <Label className="text-xs">Date Column</Label>
                                <Select
                                    value={config.generatedLabels?.useDateColumn || undefined}
                                    onValueChange={(v: any) =>
                                        onUpdate({
                                            generatedLabels: {
                                                ...config.generatedLabels!,
                                                useDateColumn: v,
                                            },
                                        })
                                    }
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

            {/* Value Column */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">Value Column</Label>
                <Select value={config.valueColumn || undefined} onValueChange={(v) => onUpdate({ valueColumn: v })} disabled={disabled}>
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
                                    {String.fromCharCode(65 + idx)}: {header || `Column ${idx + 1}`}
                                    {displaySample}
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>
            </div>

            {/* Aggregation */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">Aggregation</Label>
                <Select value={config.aggregation || 'sum'} onValueChange={(v: any) => onUpdate({ aggregation: v })} disabled={disabled}>
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

            {/* Filter */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">Filter (Optional)</Label>
                <div className="grid grid-cols-2 gap-2">
                    <Select
                        value={config.filterColumn || '__none__'}
                        onValueChange={(v) => onUpdate({ filterColumn: v === '__none__' ? undefined : v })}
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
                        value={config.filterValue || ''}
                        onChange={(e) => onUpdate({ filterValue: e.target.value || undefined })}
                        placeholder="Filter value"
                        disabled={disabled || !config.filterColumn}
                        className="h-9 text-sm"
                    />
                </div>
            </div>
        </>
    );
}
