/**
 * Component Inspector Panel
 * Figma-style right sidebar for configuring selected components
 */

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/modules/DesignSystem/ui/accordion';
import { Button } from '@/modules/DesignSystem/ui/button';
import PanelHeader from '@/modules/DesignSystem/ui/panel-header';
import { ScrollArea } from '@/modules/DesignSystem/ui/scroll-area';
import { useArtboardContext } from '@/modules/Artboard/context/ArtboardContext';
import { useResizable } from '@/modules/DesignSystem/hooks/useResizable';
import type { ConfigFieldSchema } from '@/modules/DataLayer/types/component-config';
import { CONFIG_GROUPS, getConfigSchema, type ConfigGroupId } from '@/modules/DataLayer/types/config-schemas';
import type { ArtboardComponent, ComponentPosition } from '@/modules/Artboard/types/artboard';
import * as Icons from 'lucide-react';
import { Settings2, X, Move } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { FieldRenderer } from './FieldRenderer';
import { PositionSection } from './PositionSection';

interface ComponentInspectorProps {
    component: ArtboardComponent | null;
    onConfigChange: (instanceId: string, config: Record<string, unknown>) => void;
    onPositionChange?: (instanceId: string, position: Partial<ComponentPosition>) => void;
    onClose: () => void;
    /** Optional title override (e.g., "Artboard Inspector") */
    title?: string;
    /** Optional children to render instead of component inspector (e.g., ArtboardInspectorContent) */
    children?: React.ReactNode;
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
    // Check if field is explicitly hidden
    if (field.hidden) {
        return false;
    }

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

export function ComponentInspector({ component, onConfigChange, onPositionChange, onClose, title, children }: ComponentInspectorProps) {
    const schema = component ? getConfigSchema(component.componentType) : null;

    const config = useMemo(() => (component?.config || {}) as Record<string, unknown>, [component?.config]);
    const position = component?.position;
    const { artboards, dataSourceConfig } = useArtboardContext();

    // Resizable panel
    const { width, isResizing, handleProps } = useResizable({
        defaultWidth: 288,
        minWidth: 240,
        maxWidth: 400,
        storageKey: 'inspector-width',
        direction: 'left',
    });

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

    // Handle position change
    const handlePositionChange = useCallback(
        (updates: Partial<ComponentPosition>) => {
            if (!component || !onPositionChange) return;
            onPositionChange(component.instanceId, updates);
        },
        [component, onPositionChange],
    );

    // Sort groups by CONFIG_GROUPS order
    const sortedGroups = Array.from(groupedFields.entries()).sort((a, b) => {
        const aIndex = CONFIG_GROUPS.findIndex((g) => g.id === a[0]);
        const bIndex = CONFIG_GROUPS.findIndex((g) => g.id === b[0]);
        return aIndex - bIndex;
    });

    // Get default open groups. Always include Position.
    const defaultOpenGroups = ['Position', ...sortedGroups.slice(0, 3).map(([id]) => id)];

    // Determine header title
    const headerTitle = title ?? schema?.label ?? component?.componentType ?? 'Inspector';
    const showCloseButton = !!component || !!children;

    // Content states
    const hasChildren = !!children;
    const isEmpty = !component && !children;
    const hasNoSchema = component && !schema;
    const hasContent = component && schema;

    return (
        <div
            className="relative flex h-full flex-col border-l bg-background"
            style={{ width: `${width}px` }}
        >
            {/* Resize Handle */}
            <div {...handleProps} />

            {/* Header - Always present, content transitions */}
            <PanelHeader
                left={
                    <div className="flex min-w-0 items-center gap-2 transition-opacity duration-200">
                        <Settings2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <h2 className="truncate text-sm font-semibold">{headerTitle}</h2>
                    </div>
                }
                right={
                    showCloseButton ? (
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    ) : null
                }
            />

            {/* Scrollable Content - Shell always present */}
            <ScrollArea className="min-h-0 flex-1">
                {/* Children content (e.g., ArtboardInspectorContent) */}
                {hasChildren && (
                    <div className="animate-in fade-in duration-200">
                        {children}
                    </div>
                )}

                {/* Empty state */}
                {isEmpty && (
                    <div className="flex h-full min-h-48 items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="text-center text-muted-foreground">
                            <Settings2 className="mx-auto mb-2 h-10 w-10 opacity-30" />
                            <p className="text-sm">Select a component to configure</p>
                        </div>
                    </div>
                )}

                {/* No schema state */}
                {hasNoSchema && (
                    <div className="flex h-full min-h-48 items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="text-center text-muted-foreground">
                            <p className="text-sm">No configuration available</p>
                        </div>
                    </div>
                )}

                {/* Full inspector content */}
                {hasContent && (
                    <Accordion type="multiple" defaultValue={defaultOpenGroups} className="w-full animate-in fade-in duration-200">
                        {/* Position Section - First Accordion Item */}
                        {position && onPositionChange && (
                            <AccordionItem value="Position" className="border-b">
                                <AccordionTrigger className="px-3 py-1.5 hover:bg-muted/50 hover:no-underline">
                                    <div className="flex items-center gap-2">
                                        <Move className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Position</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-3 pt-1 pb-2">
                                    <PositionSection
                                        position={position}
                                        onChange={handlePositionChange}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        )}
                        {sortedGroups.map(([groupId, fields]) => {
                            const groupInfo = CONFIG_GROUPS.find((g) => g.id === groupId);
                            if (!groupInfo) return null;

                            const IconComponent = getIcon(groupInfo.icon);
                            const visibleFields = fields.filter((f) => isFieldVisible(f, config, component.componentType));

                            if (visibleFields.length === 0) return null;

                            return (
                                <AccordionItem key={groupId} value={groupId} className="border-b">
                                    <AccordionTrigger className="px-3 py-1.5 hover:bg-muted/50 hover:no-underline">
                                        <div className="flex items-center gap-2">
                                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">{groupInfo.label}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-3 pt-1 pb-2">
                                        <div className="space-y-2.5">
                                            {visibleFields.map((field) => {
                                                // Dynamically populate options for linkedChartId
                                                if (field.key === 'linkedChartId') {
                                                    const charts: { value: string; label: string }[] = [];
                                                    artboards.forEach((a) => {
                                                        a.components.forEach((c: ArtboardComponent) => {
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

                                                return (
                                                    <div
                                                        key={field.key}
                                                        className="animate-in fade-in slide-in-from-right-2 duration-300"
                                                    >
                                                        <FieldRenderer
                                                            field={field}
                                                            value={getNestedValue(config, field.key)}
                                                            onChange={(value) => handleFieldChange(field.key, value)}
                                                            config={config}
                                                            onConfigChange={handleFieldChange}
                                                            globalDataSource={dataSourceConfig}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                )}
            </ScrollArea>

            {/* Footer with component ID - only when component selected (not for artboard inspector) */}
            {component && !children && (
                <div className="shrink-0 border-t p-2 animate-in fade-in duration-200">
                    <p className="truncate font-mono text-xs text-muted-foreground">{component.instanceId}</p>
                </div>
            )}
        </div>
    );
}

export default ComponentInspector;


