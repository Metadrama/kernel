/**
 * useWidgetOperations - Widget CRUD operations for artboards
 * 
 * Extracts widget management logic from ArtboardContainer.
 * Handles:
 * - Adding/deleting widgets
 * - Adding/removing/reordering components within widgets
 * - Updating component layouts
 */

import { useCallback } from 'react';
import type { WidgetSchema, WidgetComponent, ComponentCard } from '@/types/dashboard';
import type { GridPosition } from '@/lib/component-layout';
import type { ArtboardSchema } from '@/types/artboard';

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
    addComponentToWidget: (widgetId: string, component: ComponentCard) => void;
    /** Remove a component from a widget */
    removeComponentFromWidget: (widgetId: string, instanceId: string) => void;
    /** Reorder components within a widget */
    reorderComponents: (widgetId: string, newComponents: WidgetComponent[]) => void;
    /** Update a component's grid layout */
    updateComponentLayout: (widgetId: string, instanceId: string, gridPosition: GridPosition) => void;
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

    const addComponentToWidget = useCallback((widgetId: string, component: ComponentCard) => {
        const newComponent: WidgetComponent = {
            instanceId: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            componentType: component.id,
            config: {
                name: component.name,
                description: component.description,
                icon: component.icon,
            },
        };

        const updatedWidgets = artboard.widgets.map((widget) =>
            widget.id === widgetId
                ? {
                    ...widget,
                    components: [...widget.components, newComponent],
                }
                : widget
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

    const updateComponentLayout = useCallback(
        (widgetId: string, instanceId: string, gridPosition: GridPosition) => {
            const updatedWidgets = artboard.widgets.map((widget) =>
                widget.id === widgetId
                    ? {
                        ...widget,
                        components: widget.components.map((c) =>
                            c.instanceId === instanceId ? { ...c, gridPosition } : c
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
        updateComponentLayout,
    };
}
