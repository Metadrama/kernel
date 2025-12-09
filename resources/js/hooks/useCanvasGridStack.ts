/**
 * useCanvasGridStack - Root GridStack for the entire canvas
 * 
 * Creates a root grid that:
 * - Accepts widgets from subGrids (artboards)
 * - Manages archived widgets (canvas-level)
 * - Provides makeSubGrid for artboard integration
 * 
 * The root grid operates within the CSS-transformed canvas container,
 * preserving infinite canvas pan/zoom behavior.
 */

import { useEffect, useRef, useCallback } from 'react';
import { GridStack, GridStackOptions, GridStackNode } from 'gridstack';
import type { WidgetSchema } from '@/types/dashboard';

export interface UseCanvasGridStackOptions {
    /** Callback when archived widgets change (added/removed/moved on canvas) */
    onArchivedWidgetChange?: (widgets: WidgetSchema[]) => void;
    /** Current archived widgets for initial sync */
    archivedWidgets?: WidgetSchema[];
}

export interface UseCanvasGridStackReturn {
    /** Ref to attach to the root grid container */
    gridRef: React.RefObject<HTMLDivElement | null>;
    /** The root GridStack instance (null until mounted) */
    gridInstance: GridStack | null;
    /** Register an artboard as a subGrid */
    makeSubGrid: (element: HTMLElement, options: Partial<GridStackOptions>) => GridStack | null;
    /** Remove a subGrid (when artboard is deleted) */
    removeSubGrid: (element: HTMLElement) => void;
}

// Grid configuration for canvas-level positioning
const CANVAS_GRID_CONFIG = {
    columns: 48,        // Fine-grain for precise free positioning
    cellHeight: 20,     // Small cells for precision
    margin: 0,          // No margin for seamless positioning
};

export function useCanvasGridStack({
    onArchivedWidgetChange,
    archivedWidgets = [],
}: UseCanvasGridStackOptions = {}): UseCanvasGridStackReturn {
    const gridRef = useRef<HTMLDivElement>(null);
    const gridInstanceRef = useRef<GridStack | null>(null);
    const subGridsRef = useRef<Map<HTMLElement, GridStack>>(new Map());

    // Initialize root GridStack
    useEffect(() => {
        if (!gridRef.current) return;

        const grid = GridStack.init(
            {
                column: CANVAS_GRID_CONFIG.columns,
                cellHeight: CANVAS_GRID_CONFIG.cellHeight,
                margin: CANVAS_GRID_CONFIG.margin,
                float: true,              // Free placement (Figma-like)
                acceptWidgets: true,      // Accept widgets from subGrids
                staticGrid: false,        // Allow dragging
                animate: true,
            },
            gridRef.current
        );

        gridInstanceRef.current = grid;

        // Handle widgets added to root grid (archived from artboards)
        grid.on('added', (_event: Event, items: GridStackNode[]) => {
            if (!items || items.length === 0) return;

            // Check if these are new items from a subGrid
            items.forEach(item => {
                const widgetId = String(item.id ?? item.el?.id ?? '');
                if (widgetId && item.el) {
                    console.debug('[CanvasGrid] Widget added to canvas:', widgetId);
                }
            });
        });

        // Handle widget position/size changes on canvas
        grid.on('change', (_event: Event, items: GridStackNode[]) => {
            if (!items || items.length === 0 || !onArchivedWidgetChange) return;

            // Update archived widget positions
            // This is called when widgets on the root grid are moved
        });

        // Handle widgets removed from root grid (moved to artboard)
        grid.on('removed', (_event: Event, items: GridStackNode[]) => {
            if (!items || items.length === 0) return;

            items.forEach(item => {
                const widgetId = String(item.id ?? item.el?.id ?? '');
                if (widgetId) {
                    console.debug('[CanvasGrid] Widget removed from canvas:', widgetId);
                }
            });
        });

        return () => {
            // Clean up subGrids first
            subGridsRef.current.forEach((subGrid) => {
                try {
                    subGrid.destroy(false);
                } catch (e) {
                    console.debug('SubGrid already destroyed');
                }
            });
            subGridsRef.current.clear();

            grid.destroy(false);
            gridInstanceRef.current = null;
        };
    }, [onArchivedWidgetChange]);

    // Register an artboard element as a subGrid
    const makeSubGrid = useCallback((
        element: HTMLElement,
        options: Partial<GridStackOptions>
    ): GridStack | null => {
        if (!gridInstanceRef.current) {
            console.warn('[CanvasGrid] Cannot make subGrid: root grid not initialized');
            return null;
        }

        // Check if already a subGrid
        if (subGridsRef.current.has(element)) {
            return subGridsRef.current.get(element) || null;
        }

        try {
            const subGrid = gridInstanceRef.current.makeSubGrid(element, {
                ...options,
                acceptWidgets: true,  // Accept from parent and sibling grids
                float: true,          // Free positioning within artboard
            });

            if (subGrid) {
                subGridsRef.current.set(element, subGrid);
                console.debug('[CanvasGrid] SubGrid created for artboard');
            }

            return subGrid;
        } catch (error) {
            console.error('[CanvasGrid] Failed to create subGrid:', error);
            return null;
        }
    }, []);

    // Remove a subGrid (when artboard is deleted)
    const removeSubGrid = useCallback((element: HTMLElement) => {
        const subGrid = subGridsRef.current.get(element);
        if (subGrid) {
            try {
                subGrid.destroy(false);
            } catch (e) {
                console.debug('SubGrid already destroyed');
            }
            subGridsRef.current.delete(element);
        }
    }, []);

    return {
        gridRef,
        gridInstance: gridInstanceRef.current,
        makeSubGrid,
        removeSubGrid,
    };
}
