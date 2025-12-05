/**
 * useComponentDragResize - Grid-based drag and resize for widget components
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { WidgetComponent } from '@/types/dashboard';
import type { GridPosition, WidgetGridConfig, LayoutResult } from '@/lib/component-layout';
import { getComponentIntrinsicSize } from '@/lib/component-layout';

export interface UseComponentDragResizeOptions {
    components: WidgetComponent[];
    layoutMap: Map<string, LayoutResult>;
    gridConfig: WidgetGridConfig;
    gridCellWidth: number;
    containerRef: React.RefObject<HTMLDivElement | null>;
    gridPaddingRef: React.RefObject<{ top: number; bottom: number }>;
    onUpdateComponentLayout?: (instanceId: string, gridPosition: GridPosition) => void;
}

export interface UseComponentDragResizeReturn {
    draggingId: string | null;
    resizingId: string | null;
    isActive: boolean;
    startDrag: (e: React.MouseEvent, component: WidgetComponent) => void;
    startResize: (e: React.MouseEvent, component: WidgetComponent, direction: 'e' | 's' | 'se') => void;
}

export function useComponentDragResize({
    components,
    layoutMap,
    gridConfig,
    gridCellWidth,
    containerRef,
    gridPaddingRef,
    onUpdateComponentLayout,
}: UseComponentDragResizeOptions): UseComponentDragResizeReturn {
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [resizingId, setResizingId] = useState<string | null>(null);
    const [resizeDirection, setResizeDirection] = useState<'e' | 's' | 'se' | null>(null);

    const dragStartRef = useRef<{
        mouseX: number;
        mouseY: number;
        startCol: number;
        startRow: number;
        startColSpan: number;
        startRowSpan: number;
    } | null>(null);

    // Handle mouse move for dragging/resizing
    useEffect(() => {
        if (!draggingId && !resizingId) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current || !dragStartRef.current) return;

            const deltaX = e.clientX - dragStartRef.current.mouseX;
            const deltaY = e.clientY - dragStartRef.current.mouseY;

            const cellWidth = gridCellWidth + gridConfig.gap;
            const cellHeight = gridConfig.rowHeight + gridConfig.gap;

            const viewportHeight = containerRef.current?.clientHeight ?? 0;
            const paddingY = gridPaddingRef.current.top + gridPaddingRef.current.bottom;
            const availableHeight = Math.max(0, viewportHeight - paddingY);
            const visibleRows = availableHeight > 0
                ? Math.max(1, Math.floor((availableHeight + gridConfig.gap) / cellHeight))
                : 0;

            const clampRowToViewport = (row: number, rowSpan: number) => {
                if (visibleRows === 0) return Math.max(0, row);
                const maxRow = Math.max(0, visibleRows - rowSpan);
                return Math.min(Math.max(0, row), maxRow);
            };

            const clampRowSpanToViewport = (rowSpan: number, startRow: number) => {
                if (visibleRows === 0) return rowSpan;
                const maxSpan = Math.max(1, visibleRows - startRow);
                return Math.min(rowSpan, maxSpan);
            };

            const deltaCols = Math.round(deltaX / cellWidth);
            const deltaRows = Math.round(deltaY / cellHeight);

            if (draggingId) {
                const component = components.find(c => c.instanceId === draggingId);
                if (component) {
                    const newCol = Math.max(0, Math.min(
                        gridConfig.columns - dragStartRef.current.startColSpan,
                        dragStartRef.current.startCol + deltaCols
                    ));
                    const unclampedRow = Math.max(0, dragStartRef.current.startRow + deltaRows);
                    const newRow = clampRowToViewport(unclampedRow, dragStartRef.current.startRowSpan);

                    onUpdateComponentLayout?.(draggingId, {
                        col: newCol,
                        row: newRow,
                        colSpan: dragStartRef.current.startColSpan,
                        rowSpan: dragStartRef.current.startRowSpan,
                    });
                }
            } else if (resizingId && resizeDirection) {
                const component = components.find(c => c.instanceId === resizingId);
                if (component) {
                    const intrinsic = getComponentIntrinsicSize(component.componentType);
                    let newColSpan = dragStartRef.current.startColSpan;
                    let newRowSpan = dragStartRef.current.startRowSpan;

                    if (resizeDirection.includes('e')) {
                        newColSpan = Math.max(
                            intrinsic.minCols,
                            Math.min(
                                Math.min(intrinsic.maxCols, gridConfig.columns - dragStartRef.current.startCol),
                                dragStartRef.current.startColSpan + deltaCols
                            )
                        );
                    }

                    if (resizeDirection.includes('s')) {
                        newRowSpan = Math.max(
                            intrinsic.minRows,
                            Math.min(intrinsic.maxRows, dragStartRef.current.startRowSpan + deltaRows)
                        );
                    }

                    // Maintain aspect ratio if required
                    if (intrinsic.aspectRatio && intrinsic.sizeMode === 'fixed-ratio') {
                        if (resizeDirection === 'e') {
                            const targetHeight = (newColSpan * gridCellWidth) / intrinsic.aspectRatio;
                            newRowSpan = Math.max(
                                intrinsic.minRows,
                                Math.min(intrinsic.maxRows, Math.round(targetHeight / gridConfig.rowHeight))
                            );
                        } else if (resizeDirection === 's') {
                            const targetWidth = (newRowSpan * gridConfig.rowHeight) * intrinsic.aspectRatio;
                            newColSpan = Math.max(
                                intrinsic.minCols,
                                Math.min(
                                    Math.min(intrinsic.maxCols, gridConfig.columns - dragStartRef.current.startCol),
                                    Math.round(targetWidth / gridCellWidth)
                                )
                            );
                        }
                    }

                    newRowSpan = clampRowSpanToViewport(newRowSpan, dragStartRef.current.startRow);

                    onUpdateComponentLayout?.(resizingId, {
                        col: dragStartRef.current.startCol,
                        row: dragStartRef.current.startRow,
                        colSpan: newColSpan,
                        rowSpan: newRowSpan,
                    });
                }
            }
        };

        const handleMouseUp = () => {
            setDraggingId(null);
            setResizingId(null);
            setResizeDirection(null);
            dragStartRef.current = null;
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingId, resizingId, resizeDirection, components, gridCellWidth, gridConfig, containerRef, gridPaddingRef, onUpdateComponentLayout]);

    const startDrag = useCallback((e: React.MouseEvent, component: WidgetComponent) => {
        e.preventDefault();
        e.stopPropagation();

        const layout = layoutMap.get(component.instanceId);
        if (!layout) return;

        dragStartRef.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            startCol: layout.gridPosition.col,
            startRow: layout.gridPosition.row,
            startColSpan: layout.gridPosition.colSpan,
            startRowSpan: layout.gridPosition.rowSpan,
        };
        setDraggingId(component.instanceId);
    }, [layoutMap]);

    const startResize = useCallback((e: React.MouseEvent, component: WidgetComponent, direction: 'e' | 's' | 'se') => {
        e.preventDefault();
        e.stopPropagation();

        const layout = layoutMap.get(component.instanceId);
        if (!layout) return;

        dragStartRef.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            startCol: layout.gridPosition.col,
            startRow: layout.gridPosition.row,
            startColSpan: layout.gridPosition.colSpan,
            startRowSpan: layout.gridPosition.rowSpan,
        };
        setResizingId(component.instanceId);
        setResizeDirection(direction);
    }, [layoutMap]);

    return {
        draggingId,
        resizingId,
        isActive: draggingId !== null || resizingId !== null,
        startDrag,
        startResize,
    };
}
