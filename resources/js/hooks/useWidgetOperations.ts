/**
 * useWidgetOperations - Widget CRUD operations for artboards
 * 
 * Extracts widget management logic from ArtboardContainer.
 * Handles:
 * - Adding/deleting widgets
 * - Adding/removing/reordering components within widgets
 * - Updating component bounds (freeform pixel positioning)
 */

import { useCallback } from 'react';
import type { WidgetSchema, WidgetComponent, ComponentCard } from '@/types/dashboard';
import type { ArtboardSchema } from '@/types/artboard';
import { getDefaultSize } from '@/lib/component-sizes';
import { findInitialPosition, type ComponentRect } from '@/lib/collision-detection';

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
    /** Add a component to a widget */
    addComponentToWidget: (widgetId: string, component: ComponentCard, containerSize?: { width: number; height: number }) => void;
    /** Remove a component from a widget */
    removeComponentFromWidget: (widgetId: string, instanceId: string) => void;
    /** Reorder components within a widget */
    reorderComponents: (widgetId: string, newComponents: WidgetComponent[]) => void;
    /** Update a component's bounds (position and size) */
    updateComponentBounds: (widgetId: string, instanceId: string, bounds: { x: number; y: number; width: number; height: number }) => void;
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

    return {
        addWidget,
        deleteWidget,
        addComponentToWidget,
        removeComponentFromWidget,
        reorderComponents,
        updateComponentBounds,
    };
}

