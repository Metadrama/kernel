/**
 * useGridStack - GridStack initialization and management
 * 
 * Centralizes GridStack integration logic used in ArtboardContainer and DashboardCanvas.
 * Handles:
 * - Grid initialization with fine-grain columns
 * - Widget change events
 * - Grid cleanup on unmount
 */

import { useEffect, useRef, useCallback } from 'react';
import { GridStack, GridStackNode } from 'gridstack';
import { GRID_FINE_GRAIN, downscaleGridUnits, upscaleGridUnits } from '@/lib/component-layout';

export interface GridStackConfig {
    /** Number of base columns (will be multiplied by GRID_FINE_GRAIN) */
    columns: number;
    /** Cell height in pixels (will be divided by GRID_FINE_GRAIN) */
    cellHeight: number;
    /** Margin between widgets */
    margin: number;
}

export interface GridStackWidget {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface UseGridStackOptions {
    /** Grid configuration */
    config: GridStackConfig;
    /** Callback when widgets change position/size */
    onWidgetsChange: (widgets: GridStackWidget[]) => void;
    /** Whether the grid is disabled/readonly */
    disabled?: boolean;
}

export interface UseGridStackReturn {
    /** Ref to attach to the grid container */
    gridRef: React.RefObject<HTMLDivElement | null>;
    /** The GridStack instance (null until mounted) */
    gridInstance: GridStack | null;
    /** Add a widget element to the grid */
    makeWidget: (element: HTMLElement) => void;
    /** Remove a widget element from the grid */
    removeWidget: (element: HTMLElement) => void;
    /** Update widget constraints */
    updateWidget: (element: HTMLElement, opts: Partial<GridStackNode>) => void;
    /** Get upscaled grid units (for gs-* attributes) */
    upscale: typeof upscaleGridUnits;
    /** Get max columns (fine-grain) */
    maxColumns: number;
}

export function useGridStack({
    config,
    onWidgetsChange,
    disabled = false,
}: UseGridStackOptions): UseGridStackReturn {
    const gridRef = useRef<HTMLDivElement>(null);
    const gridInstanceRef = useRef<GridStack | null>(null);

    // Calculate fine-grain settings
    const fineColumns = config.columns * GRID_FINE_GRAIN;
    const fineCellHeight = Math.max(16, Math.round(config.cellHeight / GRID_FINE_GRAIN));

    // Initialize GridStack
    useEffect(() => {
        if (!gridRef.current) return;

        const grid = GridStack.init(
            {
                column: fineColumns,
                cellHeight: fineCellHeight,
                margin: config.margin,
                float: false,
                animate: true,
                minRow: 1,
                draggable: {
                    handle: '.widget-drag-handle',
                },
                resizable: {
                    handles: 'e, se, s, sw, w',
                    autoHide: false,
                },
                staticGrid: disabled,
            },
            gridRef.current
        );

        gridInstanceRef.current = grid;

        // Listen for widget changes
        grid.on('change', (_event, items) => {
            if (!items || items.length === 0) return;

            const scaledWidgets: GridStackWidget[] = items.map((item) => ({
                id: String(item.id ?? item.el?.id ?? ''),
                x: downscaleGridUnits(item.x ?? 0),
                y: downscaleGridUnits(item.y ?? 0),
                w: Math.max(1, downscaleGridUnits(item.w ?? 1)),
                h: Math.max(1, downscaleGridUnits(item.h ?? 1)),
            }));

            onWidgetsChange(scaledWidgets);
        });

        return () => {
            grid.destroy(false);
            gridInstanceRef.current = null;
        };
    }, [fineColumns, fineCellHeight, config.margin, disabled, onWidgetsChange]);

    const makeWidget = useCallback((element: HTMLElement) => {
        if (gridInstanceRef.current) {
            gridInstanceRef.current.makeWidget(element);
        }
    }, []);

    const removeWidget = useCallback((element: HTMLElement) => {
        if (gridInstanceRef.current) {
            try {
                gridInstanceRef.current.removeWidget(element, false);
            } catch (e) {
                console.debug('Widget already removed from grid');
            }
        }
    }, []);

    const updateWidget = useCallback((element: HTMLElement, opts: Partial<GridStackNode>) => {
        if (gridInstanceRef.current) {
            gridInstanceRef.current.update(element, opts);
        }
    }, []);

    return {
        gridRef,
        gridInstance: gridInstanceRef.current,
        makeWidget,
        removeWidget,
        updateWidget,
        upscale: upscaleGridUnits,
        maxColumns: fineColumns,
    };
}
