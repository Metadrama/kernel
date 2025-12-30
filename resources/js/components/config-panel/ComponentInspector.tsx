/**
 * Component Inspector Panel
 * Right sidebar for configuring selected components
 */

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import PanelHeader from '@/components/ui/panel-header';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useArtboardContext } from '@/context/ArtboardContext';
import type { ConfigFieldSchema, DataSource } from '@/types/component-config';
import { CONFIG_GROUPS, getConfigSchema, type ConfigGroupId } from '@/types/config-schemas';
import type { ArtboardComponent } from '@/types/dashboard';
import * as Icons from 'lucide-react';
import { Settings2, X } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { ConfigField } from './ConfigField';
import { DataSourceConfig } from './DataSourceConfig';

interface ComponentInspectorProps {
    component: ArtboardComponent | null;
    onConfigChange: (instanceId: string, config: Record<string, unknown>) => void;
    onClose: () => void;
}

// Get nested value from object using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((acc: unknown, key) => {
        if (acc && typeof acc === 'object' && key in acc) {
            return (acc as Record<string, unknown>)[key];
        }
        return undefined;
    }, obj);
}

// Set nested value in object using dot notation
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
    const result = { ...obj };
    const keys = path.split('.');
    let current: Record<string, unknown> = result;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object') {
            current[key] = {};
        } else {
            current[key] = { ...(current[key] as Record<string, unknown>) };
        }
        current = current[key] as Record<string, unknown>;
    }

    current[keys[keys.length - 1]] = value;
    return result;
}

// Check if field should be visible based on showWhen condition and appliesTo constraint
function isFieldVisible(field: ConfigFieldSchema, config: Record<string, unknown>, componentType: string): boolean {
    // Check appliesTo constraint first
    if (field.appliesTo && !field.appliesTo.includes(componentType)) {
        return false;
    }

    // Check showWhen condition
    if (!field.showWhen) return true;

    const { field: targetField, operator, value: targetValue } = field.showWhen;
    const currentValue = getNestedValue(config, targetField);

    switch (operator) {
        case 'equals':
            return currentValue === targetValue;
        case 'not-equals':
            return currentValue !== targetValue;
        case 'exists':
            return currentValue !== undefined && currentValue !== null && currentValue !== '';
        case 'not-exists':
            return currentValue === undefined || currentValue === null || currentValue === '';
        default:
            return true;
    }
}

// Get icon component by name
function getIcon(iconName: string) {
    const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[iconName];
    return IconComponent || Icons.Settings;
}

export function ComponentInspector({ component, onConfigChange, onClose }: ComponentInspectorProps) {
    const schema = component ? getConfigSchema(component.componentType) : null;

    const config = useMemo(() => (component?.config || {}) as Record<string, unknown>, [component?.config]);
    const { artboards } = useArtboardContext();

    // Group fields by their group property
    const groupedFields = useMemo(() => {
        if (!schema) return new Map<ConfigGroupId, ConfigFieldSchema[]>();

        const groups = new Map<ConfigGroupId, ConfigFieldSchema[]>();

        for (const field of schema.fields) {
            const groupId = (field.group || 'Display') as ConfigGroupId;
            if (!groups.has(groupId)) {
                groups.set(groupId, []);
            }
            groups.get(groupId)!.push(field);
        }

        return groups;
    }, [schema]);

    // Handle config field change
    const handleFieldChange = useCallback(
        (fieldKey: string, value: unknown) => {
            if (!component) return;

            const newConfig = setNestedValue(config, fieldKey, value);
            onConfigChange(component.instanceId, newConfig);
        },
        [component, config, onConfigChange],
    );

    // Handle data source change
    const handleDataSourceChange = useCallback(
        (dataSource: DataSource) => {
            if (!component) return;

            const newConfig = { ...config, dataSource };
            onConfigChange(component.instanceId, newConfig);
        },
        [component, config, onConfigChange],
    );

    // No component selected
    if (!component) {
        return (
            <div className="flex h-full flex-col border-l bg-background">
                <PanelHeader title="Inspector" />
                <div className="flex flex-1 items-center justify-center p-4">
                    <div className="text-center text-muted-foreground">
                        <Settings2 className="mx-auto mb-2 h-10 w-10 opacity-30" />
                        <p className="text-sm">Select a component to configure</p>
                    </div>
                </div>
            </div>
        );
    }

    // No schema for this component type
    if (!schema) {
        return (
            <div className="flex h-full flex-col border-l bg-background">
                <PanelHeader
                    left={
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-semibold">{component.componentType}</h2>
                        </div>
                    }
                    right={
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    }
                />
                <div className="flex flex-1 items-center justify-center p-4">
                    <div className="text-center text-muted-foreground">
                        <p className="text-sm">No configuration available</p>
                    </div>
                </div>
            </div>
        );
    }

    // Sort groups by CONFIG_GROUPS order
    const sortedGroups = Array.from(groupedFields.entries()).sort((a, b) => {
        const aIndex = CONFIG_GROUPS.findIndex((g) => g.id === a[0]);
        const bIndex = CONFIG_GROUPS.findIndex((g) => g.id === b[0]);
        return aIndex - bIndex;
    });

    // Get default open groups
    const defaultOpenGroups = sortedGroups.slice(0, 2).map(([id]) => id);

    return (
        <div className="flex h-full w-80 flex-col border-l bg-background">
            {/* Header */}
            <PanelHeader
                left={
                    <div className="flex min-w-0 items-center gap-2">
                        <Settings2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <h2 className="truncate text-sm font-semibold">{schema.label}</h2>
                    </div>
                }
                right={
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                }
            />

            {/* Config Fields */}
            <ScrollArea className="min-h-0 flex-1">
                <Accordion type="multiple" defaultValue={defaultOpenGroups} className="w-full">
                    {sortedGroups.map(([groupId, fields]) => {
                        const groupInfo = CONFIG_GROUPS.find((g) => g.id === groupId);
                        if (!groupInfo) return null;

                        const IconComponent = getIcon(groupInfo.icon);
                        const visibleFields = fields.filter((f) => isFieldVisible(f, config, component.componentType));

                        if (visibleFields.length === 0) return null;

                        return (
                            <AccordionItem key={groupId} value={groupId} className="border-b">
                                <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">{groupInfo.label}</span>
                                        <span className="text-xs text-muted-foreground">({visibleFields.length})</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pt-1 pb-4">
                                    <div className="space-y-4">
                                        {visibleFields.map((field) => {
                                            // Dynamically populate options for linkedChartId
                                            if (field.key === 'linkedChartId') {
                                                const charts: { value: string; label: string }[] = [];
                                                artboards.forEach((a) => {
                                                    a.components.forEach((c) => {
                                                        if (c.componentType.startsWith('chart-') && c.componentType !== 'chart-legend') {
                                                            const name = (c.config?.name as string) || c.componentType;
                                                            charts.push({
                                                                value: c.instanceId,
                                                                label: `${name} (${a.name})`,
                                                            });
                                                        }
                                                    });
                                                });
                                                // Use a shallow copy to avoid mutating strict schema if reused, though here we just pass prop
                                                field = { ...field, options: charts };
                                            }

                                            // Special handling for data source field
                                            if (field.type === 'data-source') {
                                                return (
                                                    <DataSourceConfig
                                                        key={field.key}
                                                        value={(config.dataSource as DataSource) || { type: 'static' }}
                                                        onChange={handleDataSourceChange}
                                                    />
                                                );
                                            }

                                            // Skip column-picker fields (handled by DataSourceConfig)
                                            if (field.type === 'column-picker') {
                                                return null;
                                            }

                                            return (
                                                <ConfigField
                                                    key={field.key}
                                                    field={field}
                                                    value={getNestedValue(config, field.key)}
                                                    onChange={(value) => handleFieldChange(field.key, value)}
                                                />
                                            );
                                        })}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </ScrollArea>

            {/* Footer with component ID */}
            <div className="shrink-0 border-t p-3">
                <p className="truncate font-mono text-xs text-muted-foreground">{component.instanceId}</p>
            </div>
        </div>
    );
}

export default ComponentInspector;
