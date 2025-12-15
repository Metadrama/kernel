/**
 * useWidgetOperations - Widget CRUD operations for artboards
 * 
 * Extracts widget management logic from ArtboardContainer.
 * Handles:
 * - Adding/deleting widgets
 * - Adding/removing/reordering components within widgets
 * - Updating component bounds (freeform pixel positioning)
 */

import { useCallback, useMemo } from 'react';
import type { WidgetSchema, WidgetComponent, ComponentCard } from '@/types/dashboard';
import type { ArtboardSchema } from '@/types/artboard';
import { getDefaultSize } from '@/lib/component-sizes';
import { findInitialPosition, type ComponentRect } from '@/lib/collision-detection';
import { calculateArtboardGridConfig, calculateEffectiveGridConfig, findNextAvailablePosition } from '@/lib/artboard-utils';

export interface UseWidgetOperationsOptions {
    /** Current artboard */
    artboard: ArtboardSchema;
    /** Callback to update artboard */
    onUpdate: (artboardId: string, updates: Partial<ArtboardSchema>) => void;
}

export interface UseWidgetOperationsReturn {
    /** Add a new empty widget */
    addWidget: () => WidgetSchema;
    /** Delete a widget by ID */
    deleteWidget: (widgetId: string) => void;
    /** Duplicate a widget with optional count and options */
    duplicateWidget: (widgetId: string, count?: number, options?: { fill?: boolean }) => void;
    /** Paste a widget from clipboard data */
    pasteWidget: (widgetData: WidgetSchema) => void;
    /** Update widget lock state */
    updateWidgetLock: (widgetId: string, locked: boolean) => void;
    /** Add a component to a widget */
    addComponentToWidget: (widgetId: string, component: ComponentCard, containerSize?: { width: number; height: number }) => void;
    /** Remove a component from a widget */
    removeComponentFromWidget: (widgetId: string, instanceId: string) => void;
    /** Reorder components within a widget */
    reorderComponents: (widgetId: string, newComponents: WidgetComponent[]) => void;
    /** Update a component's bounds (position and size) */
    updateComponentBounds: (widgetId: string, instanceId: string, bounds: { x: number; y: number; width: number; height: number }) => void;
    /** Update a component's z-order */
    updateComponentZOrder: (widgetId: string, instanceId: string, operation: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward') => void;
    /** Update a widget's z-order */
    updateWidgetZOrder: (widgetId: string, operation: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward') => void;
}

export function useWidgetOperations({
    artboard,
    onUpdate,
}: UseWidgetOperationsOptions): UseWidgetOperationsReturn {

    const addWidget = useCallback((): WidgetSchema => {
        const newWidget: WidgetSchema = {
            id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            x: 0,
            y: 0,
            w: 6,
            h: 5,
            components: [],
        };

        const updatedWidgets = [...artboard.widgets, newWidget];
        onUpdate(artboard.id, { widgets: updatedWidgets });

        return newWidget;
    }, [artboard.id, artboard.widgets, onUpdate]);

    const deleteWidget = useCallback((widgetId: string) => {
        const updatedWidgets = artboard.widgets.filter((w) => w.id !== widgetId);
        onUpdate(artboard.id, { widgets: updatedWidgets });
    }, [artboard.id, artboard.widgets, onUpdate]);

    const addComponentToWidget = useCallback((
        widgetId: string,
        component: ComponentCard,
        containerSize: { width: number; height: number } = { width: 400, height: 300 }
    ) => {
        const widget = artboard.widgets.find(w => w.id === widgetId);
        if (!widget) return;

        // Get default size for this component type
        const defaultSize = getDefaultSize(component.id);

        // Convert existing components to ComponentRect for collision detection
        const existingRects: ComponentRect[] = widget.components.map(c => ({
            id: c.instanceId,
            x: c.x,
            y: c.y,
            width: c.width,
            height: c.height,
        }));

        // Find initial position that doesn't overlap
        const position = findInitialPosition(defaultSize, existingRects, containerSize);

        const newComponent: WidgetComponent = {
            instanceId: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            componentType: component.id,
            x: position.x,
            y: position.y,
            width: defaultSize.width,
            height: defaultSize.height,
            config: {
                name: component.name,
                description: component.description,
                icon: component.icon,
            },
        };

        const updatedWidgets = artboard.widgets.map((w) =>
            w.id === widgetId
                ? {
                    ...w,
                    components: [...w.components, newComponent],
                }
                : w
        );

        onUpdate(artboard.id, { widgets: updatedWidgets });
    }, [artboard.id, artboard.widgets, onUpdate]);

    const removeComponentFromWidget = useCallback((widgetId: string, instanceId: string) => {
        const updatedWidgets = artboard.widgets.map((widget) =>
            widget.id === widgetId
                ? {
                    ...widget,
                    components: widget.components.filter((c) => c.instanceId !== instanceId),
                }
                : widget
        );

        onUpdate(artboard.id, { widgets: updatedWidgets });
    }, [artboard.id, artboard.widgets, onUpdate]);

    const reorderComponents = useCallback((widgetId: string, newComponents: WidgetComponent[]) => {
        const updatedWidgets = artboard.widgets.map((widget) =>
            widget.id === widgetId
                ? {
                    ...widget,
                    components: newComponents,
                }
                : widget
        );

        onUpdate(artboard.id, { widgets: updatedWidgets });
    }, [artboard.id, artboard.widgets, onUpdate]);

    const updateComponentBounds = useCallback(
        (widgetId: string, instanceId: string, bounds: { x: number; y: number; width: number; height: number }) => {
            const updatedWidgets = artboard.widgets.map((widget) =>
                widget.id === widgetId
                    ? {
                        ...widget,
                        components: widget.components.map((c) =>
                            c.instanceId === instanceId
                                ? { ...c, x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height }
                                : c
                        ),
                    }
                    : widget
            );

            onUpdate(artboard.id, { widgets: updatedWidgets });
        },
        [artboard.id, artboard.widgets, onUpdate]
    );

    const updateComponentZOrder = useCallback(
        (widgetId: string, instanceId: string, operation: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward') => {
            const widget = artboard.widgets.find(w => w.id === widgetId);
            if (!widget) return;

            // Sort components by current zIndex
            const sorted = [...widget.components].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
            const targetIndex = sorted.findIndex(c => c.instanceId === instanceId);
            if (targetIndex === -1) return;

            const newOrder = [...sorted];
            const target = newOrder[targetIndex];

            switch (operation) {
                case 'bringToFront':
                    newOrder.splice(targetIndex, 1);
                    newOrder.push(target);
                    break;
                case 'sendToBack':
                    newOrder.splice(targetIndex, 1);
                    newOrder.unshift(target);
                    break;
                case 'bringForward':
                    if (targetIndex < newOrder.length - 1) {
                        newOrder.splice(targetIndex, 1);
                        newOrder.splice(targetIndex + 1, 0, target);
                    }
                    break;
                case 'sendBackward':
                    if (targetIndex > 0) {
                        newOrder.splice(targetIndex, 1);
                        newOrder.splice(targetIndex - 1, 0, target);
                    }
                    break;
            }

            // Assign new zIndex values
            const updatedComponents = newOrder.map((c, i) => ({ ...c, zIndex: i }));

            const updatedWidgets = artboard.widgets.map((w) =>
                w.id === widgetId ? { ...w, components: updatedComponents } : w
            );

            onUpdate(artboard.id, { widgets: updatedWidgets });
        },
        [artboard.id, artboard.widgets, onUpdate]
    );

    const updateWidgetZOrder = useCallback(
        (widgetId: string, operation: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward') => {
            // Sort widgets by current zIndex
            const sorted = [...artboard.widgets].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
            const targetIndex = sorted.findIndex(w => w.id === widgetId);
            if (targetIndex === -1) return;

            const newOrder = [...sorted];
            const target = newOrder[targetIndex];

            switch (operation) {
                case 'bringToFront':
                    newOrder.splice(targetIndex, 1);
                    newOrder.push(target);
                    break;
                case 'sendToBack':
                    newOrder.splice(targetIndex, 1);
                    newOrder.unshift(target);
                    break;
                case 'bringForward':
                    if (targetIndex < newOrder.length - 1) {
                        newOrder.splice(targetIndex, 1);
                        newOrder.splice(targetIndex + 1, 0, target);
                    }
                    break;
                case 'sendBackward':
                    if (targetIndex > 0) {
                        newOrder.splice(targetIndex, 1);
                        newOrder.splice(targetIndex - 1, 0, target);
                    }
                    break;
            }

            // Assign new zIndex values
            const updatedWidgets = newOrder.map((w, i) => ({ ...w, zIndex: i }));
            onUpdate(artboard.id, { widgets: updatedWidgets });
        },
        [artboard.id, artboard.widgets, onUpdate]
    );

    const duplicateWidget = useCallback(
        (widgetId: string, count: number = 1, options: { fill?: boolean } = {}) => {
            const widget = artboard.widgets.find(w => w.id === widgetId);
            if (!widget) return;

            // Calculate effective grid bounds (accounting for container padding)
            const padding = artboard.gridPadding ?? 16;
            const effectiveGridConfig = calculateEffectiveGridConfig(artboard.dimensions, padding);

            // Calculate adaptive offset (proportional to artboard width) instead of fixed +2
            // Use 2% of columns, min 2 units, max 5 units
            const offsetUnits = Math.max(2, Math.min(5, Math.floor(effectiveGridConfig.columns * 0.02)));

            // Helper to check overlap with specific widget list
            const checkOverlap = (rect: { x: number, y: number, w: number, h: number }, widgets: WidgetSchema[]) => {
                return widgets.some(w =>
                    w.id !== widgetId && // Ignore self (source)
                    rect.x < w.x + w.w &&
                    rect.x + rect.w > w.x &&
                    rect.y < w.y + w.h &&
                    rect.y + rect.h > w.y
                );
            };

            const newWidgets: WidgetSchema[] = [];
            // Track potential positions to avoid stepping on own toes during multi-duplicate
            const allWidgetsForCollision = [...artboard.widgets];

            for (let i = 0; i < count; i++) {
                let newX = 0, newY = 0, newW = widget.w, newH = widget.h;

                if (options.fill) {
                    // Fill Mode: Cover entire artboard
                    newX = 0;
                    newY = 0;
                    newW = effectiveGridConfig.columns;
                    newH = effectiveGridConfig.maxRows;
                } else {
                    // Standard Mode: Smart Placement
                    newW = widget.w;
                    newH = widget.h;

                    // define candidate strategies
                    const candidates = [
                        // 1. Right side
                        { x: widget.x + widget.w, y: widget.y },
                        // 2. Bottom side
                        { x: widget.x, y: widget.y + widget.h },
                        // 3. Right-Bottom
                        { x: widget.x + widget.w, y: widget.y + widget.h }
                    ];

                    let foundSpot = false;
                    for (const candidate of candidates) {
                        // Check bounds
                        if (candidate.x + newW <= effectiveGridConfig.columns &&
                            candidate.y + newH <= effectiveGridConfig.maxRows) {

                            // Check collisions
                            if (!checkOverlap({ x: candidate.x, y: candidate.y, w: newW, h: newH }, allWidgetsForCollision)) {
                                newX = candidate.x;
                                newY = candidate.y;
                                foundSpot = true;
                                break;
                            }
                        }
                    }

                    if (!foundSpot) {
                        // Fallback: Diagonal adaptive offset (standard behavior)
                        // If multiple duplicates, offset each one further from the ORIGINAL
                        const totalOffset = (i + 1) * offsetUnits;
                        newX = widget.x + totalOffset;
                        newY = widget.y + totalOffset;

                        // Clamp to stay within artboard bounds
                        const maxX = effectiveGridConfig.columns - newW;
                        newX = Math.max(0, Math.min(newX, maxX));
                        newY = Math.max(0, newY);

                        // If x would overflow, wrap to next row at x=0
                        if (newX + newW > effectiveGridConfig.columns) {
                            newX = 0;
                            newY = widget.y + widget.h + (i * offsetUnits);
                        }
                    }
                }

                const newWidget: WidgetSchema = {
                    ...widget,
                    id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${i}`,
                    x: newX,
                    y: newY,
                    w: newW,
                    h: newH,
                    // Deep clone components with new IDs when filling? 
                    // Usually we keep components, but their positions might need adjustment if using % based
                    // but for now we just clone them as is. GridStack inside components (if any) or freeform 
                    // layout might need specific handling, but we leave that to the component layer for now.
                    components: widget.components.map(c => ({
                        ...c,
                        instanceId: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    })),
                };
                newWidgets.push(newWidget);
                allWidgetsForCollision.push(newWidget);
            }

            const updatedWidgets = [...artboard.widgets, ...newWidgets];
            onUpdate(artboard.id, { widgets: updatedWidgets });
        },
        [artboard.id, artboard.widgets, artboard.dimensions, onUpdate]
    );

    const updateWidgetLock = useCallback(
        (widgetId: string, locked: boolean) => {
            const updatedWidgets = artboard.widgets.map((w) =>
                w.id === widgetId ? { ...w, locked } : w
            );
            onUpdate(artboard.id, { widgets: updatedWidgets });
        },
        [artboard.id, artboard.widgets, onUpdate]
    );

    const pasteWidget = useCallback(
        (widgetData: WidgetSchema) => {
            // Calculate effective grid bounds (accounting for container padding)
            const padding = artboard.gridPadding ?? 16;
            const effectiveGridConfig = calculateEffectiveGridConfig(artboard.dimensions, padding);
            const maxX = effectiveGridConfig.columns - widgetData.w;

            // Calculate offset position, clamped within bounds
            let newX = widgetData.x + 2;
            let newY = widgetData.y + 2;

            // Clamp to stay within artboard bounds
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, newY);

            // If x would still overflow (widget too wide), place at x=0
            if (newX + widgetData.w > effectiveGridConfig.columns) {
                newX = 0;
            }

            // Create a new widget with fresh IDs based on the pasted data
            const newWidget: WidgetSchema = {
                ...widgetData,
                id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                x: newX,
                y: newY,
                // Clamp width if widget is too wide for artboard
                w: Math.min(widgetData.w, effectiveGridConfig.columns),
                // Deep clone components with new IDs
                components: widgetData.components.map(c => ({
                    ...c,
                    instanceId: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                })),
            };

            const updatedWidgets = [...artboard.widgets, newWidget];
            onUpdate(artboard.id, { widgets: updatedWidgets });
        },
        [artboard.id, artboard.widgets, artboard.dimensions, onUpdate]
    );

    return {
        addWidget,
        deleteWidget,
        duplicateWidget,
        pasteWidget,
        updateWidgetLock,
        addComponentToWidget,
        removeComponentFromWidget,
        reorderComponents,
        updateComponentBounds,
        updateComponentZOrder,
        updateWidgetZOrder,
    };
}
