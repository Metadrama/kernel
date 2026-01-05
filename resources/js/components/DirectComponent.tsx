/**
 * DirectComponent - Figma-style component wrapper with drag and resize
 *
 * Wraps individual components with:
 * - Absolute pixel positioning (in artboard space)
 * - 8-handle resize (4 corners + 4 edges)
 * - Selection UI with blue border
 * - Drag-to-move functionality
 * - Context menu for operations
 *
 * Snapping:
 * - Snap to 8px grid by default
 * - Smart alignment snapping to sibling components during drag
 * - Alignment snapping during resize (via centralized resolver)
 * - Hold Alt/Option to temporarily bypass snapping
 *
 * Zoom correctness:
 * - `scale` represents the canvas zoom factor.
 * - The component wrapper is counter-scaled so the DOM content is not double-scaled,
 *   preventing "fit-to-size only at 100%" behavior.
 */

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import ChartComponent from '@/components/widget-components/ChartComponent';
import { type AlignmentGuide, type ComponentBounds } from '@/lib/alignment-helpers';
import { GRID_SIZE_PX, snapToGrid } from '@/lib/canvas-constants';
import { getAspectRatio, getMaxSize, getMinSize } from '@/lib/component-sizes';
import { resolveResizeSnap, resolveSnap } from '@/lib/snap-resolver';
import { cn } from '@/lib/utils';
import type { ArtboardComponent } from '@/types/dashboard';
import { Layers, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface DirectComponentProps {
    component: ArtboardComponent;
    isSelected: boolean;
    scale: number;
    /**
     * Bounds for all components on the same artboard (including this component).
     * Used for smart alignment guides/snapping during drag.
     */
    siblingBounds?: ComponentBounds[];

    /**
     * Notify parent about current alignment guides (so the parent can render a single overlay).
     */
    onGuidesChange?: (guides: AlignmentGuide[]) => void;

    onSelect: () => void;
    onPositionChange: (position: { x: number; y: number; width: number; height: number }) => void;
    onDelete: () => void;
    onZOrderChange?: (operation: 'front' | 'forward' | 'back' | 'backward') => void;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export function DirectComponent({
    component,
    isSelected,
    scale,
    siblingBounds,
    onGuidesChange,
    onSelect,
    onPositionChange,
    onDelete,
    onZOrderChange,
}: DirectComponentProps) {
    const componentRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
    const [localRect, setLocalRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const localRectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
    const interactionStartRectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
    const dragStartRef = useRef<{ x: number; y: number; compX: number; compY: number; width: number; height: number } | null>(null);
    const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number; compX: number; compY: number } | null>(null);

    // Capture changing props in refs so our global event handlers always see the latest values
    // without forcing the effect to re-subscribe on every render.
    const siblingBoundsRef = useRef<ComponentBounds[] | undefined>(siblingBounds);
    const onGuidesChangeRef = useRef<((guides: AlignmentGuide[]) => void) | undefined>(onGuidesChange);
    const componentIdRef = useRef<string>(component.instanceId);

    useEffect(() => {
        siblingBoundsRef.current = siblingBounds;
    }, [siblingBounds]);

    useEffect(() => {
        onGuidesChangeRef.current = onGuidesChange;
    }, [onGuidesChange]);

    useEffect(() => {
        componentIdRef.current = component.instanceId;
    }, [component.instanceId]);

    const { position, componentType, locked } = component;
    const minSize = getMinSize(componentType);
    const maxSize = getMaxSize(componentType);
    const aspectRatio = getAspectRatio(componentType);

    const displayRect = (isDragging || isResizing) && localRect ? localRect : position;

    // Counter-scale the component wrapper so the component content stays at "true" pixel size
    // in artboard space even when the canvas is zoomed.
    const inverseScale = scale === 0 ? 1 : 1 / scale;

    // Mouse down on component (start drag)
    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (locked || isResizing) return;

            // Ignore if clicking on a resize handle
            if ((e.target as HTMLElement).classList.contains('resize-handle')) {
                return;
            }

            e.stopPropagation();
            onSelect();
            setIsDragging(true);

            const startRect = {
                x: position.x,
                y: position.y,
                width: position.width,
                height: position.height,
            };
            interactionStartRectRef.current = startRect;
            localRectRef.current = startRect;
            setLocalRect(startRect);

            dragStartRef.current = {
                x: e.clientX,
                y: e.clientY,
                compX: position.x,
                compY: position.y,
                width: position.width,
                height: position.height,
            };
        },
        [locked, isResizing, onSelect, position.x, position.y, position.width, position.height],
    );

    // Mouse down on resize handle
    const handleResizeStart = useCallback(
        (e: React.MouseEvent, handle: ResizeHandle) => {
            if (locked) return;

            e.stopPropagation();
            onSelect();
            setIsResizing(true);
            setResizeHandle(handle);

            const startRect = {
                x: position.x,
                y: position.y,
                width: position.width,
                height: position.height,
            };
            interactionStartRectRef.current = startRect;
            localRectRef.current = startRect;
            setLocalRect(startRect);

            resizeStartRef.current = {
                x: e.clientX,
                y: e.clientY,
                width: position.width,
                height: position.height,
                compX: position.x,
                compY: position.y,
            };
        },
        [locked, onSelect, position],
    );

    // Global mouse move
    useEffect(() => {
        if (!isDragging && !isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const bypassSnap = e.altKey; // Alt/Option bypasses snapping

            if (isDragging && dragStartRef.current) {
                const dx = (e.clientX - dragStartRef.current.x) / scale;
                const dy = (e.clientY - dragStartRef.current.y) / scale;

                const rawPosition = {
                    x: dragStartRef.current.compX + dx,
                    y: dragStartRef.current.compY + dy,
                };

                const snap = resolveSnap({
                    rawPosition,
                    moving: {
                        id: componentIdRef.current,
                        width: dragStartRef.current.width,
                        height: dragStartRef.current.height,
                    },
                    siblings: siblingBoundsRef.current,
                    modifiers: { bypassAllSnapping: bypassSnap },
                });

                onGuidesChangeRef.current?.(snap.guides);

                const nextRect = {
                    x: snap.position.x,
                    y: snap.position.y,
                    width: dragStartRef.current.width,
                    height: dragStartRef.current.height,
                };
                localRectRef.current = nextRect;
                setLocalRect(nextRect);
            } else if (isResizing && resizeStartRef.current && resizeHandle) {
                const dx = (e.clientX - resizeStartRef.current.x) / scale;
                const dy = (e.clientY - resizeStartRef.current.y) / scale;

                let newX = resizeStartRef.current.compX;
                let newY = resizeStartRef.current.compY;
                let newWidth = resizeStartRef.current.width;
                let newHeight = resizeStartRef.current.height;

                // Calculate new dimensions based on handle (raw, unsnapped)
                if (resizeHandle.includes('e')) {
                    newWidth += dx;
                }
                if (resizeHandle.includes('w')) {
                    newWidth -= dx;
                    newX += dx;
                }
                if (resizeHandle.includes('s')) {
                    newHeight += dy;
                }
                if (resizeHandle.includes('n')) {
                    newHeight -= dy;
                    newY += dy;
                }

                // Apply constraints
                newWidth = Math.max(minSize.width, newWidth);
                newHeight = Math.max(minSize.height, newHeight);

                if (maxSize) {
                    newWidth = Math.min(maxSize.width, newWidth);
                    newHeight = Math.min(maxSize.height, newHeight);
                }

                // Maintain aspect ratio if shift is held or component requires it
                if (e.shiftKey || aspectRatio) {
                    const ratio = aspectRatio || resizeStartRef.current.width / resizeStartRef.current.height;

                    // Prioritize width changes for corner handles
                    if (resizeHandle === 'nw' || resizeHandle === 'ne' || resizeHandle === 'sw' || resizeHandle === 'se') {
                        newHeight = newWidth / ratio;
                    } else if (resizeHandle === 'n' || resizeHandle === 's') {
                        newWidth = newHeight * ratio;
                    } else {
                        newHeight = newWidth / ratio;
                    }
                }

                // Centralized resize snapping (alignment-first, grid fallback). Alt bypasses.
                if (!bypassSnap && siblingBounds && siblingBounds.length > 0) {
                    const startRect = {
                        x: resizeStartRef.current.compX,
                        y: resizeStartRef.current.compY,
                        width: resizeStartRef.current.width,
                        height: resizeStartRef.current.height,
                    };

                    const rawRect = { x: newX, y: newY, width: newWidth, height: newHeight };

                    const snap = resolveResizeSnap({
                        rawRect,
                        startRect,
                        handle: resizeHandle,
                        siblings: siblingBoundsRef.current,
                        modifiers: { bypassAllSnapping: bypassSnap },
                    });

                    onGuidesChangeRef.current?.(snap.guides);

                    newX = snap.rect.x;
                    newY = snap.rect.y;
                    newWidth = snap.rect.width;
                    newHeight = snap.rect.height;
                } else if (!bypassSnap) {
                    // Fallback: grid snapping only (keeps existing behavior even if no siblings are available)
                    const start = resizeStartRef.current;

                    const rawRight = newX + newWidth;
                    const rawBottom = newY + newHeight;

                    // Horizontal snapping
                    if (resizeHandle.includes('e')) {
                        const snappedRight = snapToGrid(rawRight, GRID_SIZE_PX);
                        newWidth = snappedRight - newX;
                    }
                    if (resizeHandle.includes('w')) {
                        const snappedLeft = snapToGrid(newX, GRID_SIZE_PX);
                        const startRight = start.compX + start.width; // keep right edge anchored to start
                        newX = snappedLeft;
                        newWidth = startRight - newX;
                    }

                    // Vertical snapping
                    if (resizeHandle.includes('s')) {
                        const snappedBottom = snapToGrid(rawBottom, GRID_SIZE_PX);
                        newHeight = snappedBottom - newY;
                    }
                    if (resizeHandle.includes('n')) {
                        const snappedTop = snapToGrid(newY, GRID_SIZE_PX);
                        const startBottom = start.compY + start.height; // keep bottom edge anchored to start
                        newY = snappedTop;
                        newHeight = startBottom - newY;
                    }
                }

                // Re-apply constraints after snapping
                newWidth = Math.max(minSize.width, newWidth);
                newHeight = Math.max(minSize.height, newHeight);

                if (maxSize) {
                    newWidth = Math.min(maxSize.width, newWidth);
                    newHeight = Math.min(maxSize.height, newHeight);
                }

                // Adjust position if resizing from top or left (final)
                if (resizeHandle.includes('w')) {
                    newX = resizeStartRef.current.compX + (resizeStartRef.current.width - newWidth);
                }
                if (resizeHandle.includes('n')) {
                    newY = resizeStartRef.current.compY + (resizeStartRef.current.height - newHeight);
                }

                const nextRect = {
                    x: newX,
                    y: newY,
                    width: newWidth,
                    height: newHeight,
                };
                localRectRef.current = nextRect;
                setLocalRect(nextRect);
            }
        };

        const handleMouseUp = () => {
            const startRect = interactionStartRectRef.current;
            const endRect = localRectRef.current;

            if (
                endRect &&
                startRect &&
                (endRect.x !== startRect.x || endRect.y !== startRect.y || endRect.width !== startRect.width || endRect.height !== startRect.height)
            ) {
                onPositionChange(endRect);
            }

            setIsDragging(false);
            setIsResizing(false);
            setResizeHandle(null);
            onGuidesChangeRef.current?.([]);
            dragStartRef.current = null;
            resizeStartRef.current = null;
            interactionStartRectRef.current = null;
            localRectRef.current = null;
            setLocalRect(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [
        isDragging,
        isResizing,
        resizeHandle,
        scale,
        minSize,
        maxSize,
        aspectRatio,
        onPositionChange,
        component.instanceId,
        onGuidesChange,
        siblingBounds,
    ]);

    // Render the actual component content
    const renderComponent = () => {
        switch (componentType) {
            case 'chart-line':
            case 'chart-bar':
            case 'chart-doughnut':
            case 'chart-combo':
            case 'chart':
                return (
                    <ChartComponent
                        config={{ ...component.config, chartType: componentType.replace('chart-', '') as any } as any}
                    />
                );
            default:
                return <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-500">{componentType}</div>;
        }
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild disabled={locked}>
                <div
                    ref={componentRef}
                    data-component-id={component.instanceId}
                    className={cn(
                        'absolute select-none',
                        isDragging && 'cursor-grabbing',
                        !isDragging && !locked && 'cursor-grab',
                        locked && 'cursor-not-allowed opacity-60',
                    )}
                    style={{
                        left: displayRect.x,
                        top: displayRect.y,
                        width: displayRect.width * scale,
                        height: displayRect.height * scale,
                        transform: `scale(${inverseScale})`,
                        transformOrigin: 'top left',
                        zIndex: position.zIndex,
                    }}
                    onMouseDown={handleMouseDown}
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect();
                    }}
                >
                    {/* Selection border */}
                    {isSelected && <div className="pointer-events-none absolute inset-0 border-2 border-blue-500" />}

                    {/* Component content */}
                    <div className="h-full w-full overflow-hidden">{renderComponent()}</div>

                    {/* Resize handles (only when selected and not locked) */}
                    {isSelected && !locked && (
                        <>
                            {/* Corner handles */}
                            <div
                                className="resize-handle absolute -top-1 -left-1 h-3 w-3 cursor-nwse-resize border border-blue-500 bg-white"
                                onMouseDown={(e) => handleResizeStart(e, 'nw')}
                            />
                            <div
                                className="resize-handle absolute -top-1 -right-1 h-3 w-3 cursor-nesw-resize border border-blue-500 bg-white"
                                onMouseDown={(e) => handleResizeStart(e, 'ne')}
                            />
                            <div
                                className="resize-handle absolute -bottom-1 -left-1 h-3 w-3 cursor-nesw-resize border border-blue-500 bg-white"
                                onMouseDown={(e) => handleResizeStart(e, 'sw')}
                            />
                            <div
                                className="resize-handle absolute -right-1 -bottom-1 h-3 w-3 cursor-nwse-resize border border-blue-500 bg-white"
                                onMouseDown={(e) => handleResizeStart(e, 'se')}
                            />

                            {/* Edge handles */}
                            <div
                                className="resize-handle absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 cursor-ns-resize border border-blue-500 bg-white"
                                onMouseDown={(e) => handleResizeStart(e, 'n')}
                            />
                            <div
                                className="resize-handle absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 cursor-ns-resize border border-blue-500 bg-white"
                                onMouseDown={(e) => handleResizeStart(e, 's')}
                            />
                            <div
                                className="resize-handle absolute top-1/2 -left-1 h-3 w-3 -translate-y-1/2 cursor-ew-resize border border-blue-500 bg-white"
                                onMouseDown={(e) => handleResizeStart(e, 'w')}
                            />
                            <div
                                className="resize-handle absolute top-1/2 -right-1 h-3 w-3 -translate-y-1/2 cursor-ew-resize border border-blue-500 bg-white"
                                onMouseDown={(e) => handleResizeStart(e, 'e')}
                            />
                        </>
                    )}
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
                <ContextMenuSub>
                    <ContextMenuSubTrigger>
                        <Layers className="mr-2 h-4 w-4" />
                        Z-Order
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-40">
                        <ContextMenuItem onClick={() => onZOrderChange?.('front')}>Bring to Front</ContextMenuItem>
                        <ContextMenuItem onClick={() => onZOrderChange?.('forward')}>Bring Forward</ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => onZOrderChange?.('backward')}>Send Backward</ContextMenuItem>
                        <ContextMenuItem onClick={() => onZOrderChange?.('back')}>Send to Back</ContextMenuItem>
                    </ContextMenuSubContent>
                </ContextMenuSub>
                <ContextMenuSeparator />
                <ContextMenuItem variant="destructive" onClick={onDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
