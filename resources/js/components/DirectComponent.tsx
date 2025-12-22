/**
 * DirectComponent - Figma-style component wrapper with drag and resize
 * 
 * Wraps individual components with:
 * - Absolute pixel positioning
 * - 8-handle resize (4 corners + 4 edges)
 * - Selection UI with blue border
 * - Drag-to-move functionality
 * - Context menu for operations
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import type { ArtboardComponent } from '@/types/dashboard';
import { getMinSize, getMaxSize, getAspectRatio } from '@/lib/component-sizes';
import ChartComponent from '@/components/widget-components/ChartComponent';
import { cn } from '@/lib/utils';

interface DirectComponentProps {
    component: ArtboardComponent;
    isSelected: boolean;
    scale: number;
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
    onSelect,
    onPositionChange,
    onDelete,
    onZOrderChange,
}: DirectComponentProps) {
    const componentRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
    const dragStartRef = useRef<{ x: number; y: number; compX: number; compY: number } | null>(null);
    const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number; compX: number; compY: number } | null>(null);

    const { position, componentType, locked } = component;
    const minSize = getMinSize(componentType);
    const maxSize = getMaxSize(componentType);
    const aspectRatio = getAspectRatio(componentType);

    // Mouse down on component (start drag)
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (locked || isResizing) return;

        // Ignore if clicking on a resize handle
        if ((e.target as HTMLElement).classList.contains('resize-handle')) {
            return;
        }

        e.stopPropagation();
        onSelect();
        setIsDragging(true);

        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            compX: position.x,
            compY: position.y,
        };
    }, [locked, isResizing, onSelect, position.x, position.y]);

    // Mouse down on resize handle
    const handleResizeStart = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
        if (locked) return;

        e.stopPropagation();
        onSelect();
        setIsResizing(true);
        setResizeHandle(handle);

        resizeStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            width: position.width,
            height: position.height,
            compX: position.x,
            compY: position.y,
        };
    }, [locked, onSelect, position]);

    // Global mouse move
    useEffect(() => {
        if (!isDragging && !isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging && dragStartRef.current) {
                const dx = (e.clientX - dragStartRef.current.x) / scale;
                const dy = (e.clientY - dragStartRef.current.y) / scale;

                onPositionChange({
                    x: dragStartRef.current.compX + dx,
                    y: dragStartRef.current.compY + dy,
                    width: position.width,
                    height: position.height,
                });
            } else if (isResizing && resizeStartRef.current && resizeHandle) {
                const dx = (e.clientX - resizeStartRef.current.x) / scale;
                const dy = (e.clientY - resizeStartRef.current.y) / scale;

                let newX = resizeStartRef.current.compX;
                let newY = resizeStartRef.current.compY;
                let newWidth = resizeStartRef.current.width;
                let newHeight = resizeStartRef.current.height;

                // Calculate new dimensions based on handle
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

                // Adjust position if resizing from top or left
                if (resizeHandle.includes('w')) {
                    newX = resizeStartRef.current.compX + (resizeStartRef.current.width - newWidth);
                }
                if (resizeHandle.includes('n')) {
                    newY = resizeStartRef.current.compY + (resizeStartRef.current.height - newHeight);
                }

                onPositionChange({
                    x: newX,
                    y: newY,
                    width: newWidth,
                    height: newHeight,
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
            setResizeHandle(null);
            dragStartRef.current = null;
            resizeStartRef.current = null;
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, resizeHandle, scale, position, minSize, maxSize, aspectRatio, onPositionChange]);

    // Render the actual component content
    const renderComponent = () => {
        switch (componentType) {
            case 'chart-line':
            case 'chart-bar':
            case 'chart-doughnut':
            case 'chart':
                return <ChartComponent config={component.config} />;
            default:
                return (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-500">
                        {componentType}
                    </div>
                );
        }
    };

    return (
        <div
            ref={componentRef}
            className={cn(
                'absolute select-none',
                isDragging && 'cursor-grabbing',
                !isDragging && !locked && 'cursor-grab',
                locked && 'cursor-not-allowed opacity-60'
            )}
            style={{
                left: position.x,
                top: position.y,
                width: position.width,
                height: position.height,
                zIndex: position.zIndex,
            }}
            onMouseDown={handleMouseDown}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
        >
            {/* Selection border */}
            {isSelected && (
                <div className="pointer-events-none absolute inset-0 border-2 border-blue-500" />
            )}

            {/* Component content */}
            <div className="h-full w-full overflow-hidden">
                {renderComponent()}
            </div>

            {/* Resize handles (only when selected and not locked) */}
            {isSelected && !locked && (
                <>
                    {/* Corner handles */}
                    <div
                        className="resize-handle absolute -left-1 -top-1 h-3 w-3 cursor-nwse-resize border border-blue-500 bg-white"
                        onMouseDown={(e) => handleResizeStart(e, 'nw')}
                    />
                    <div
                        className="resize-handle absolute -right-1 -top-1 h-3 w-3 cursor-nesw-resize border border-blue-500 bg-white"
                        onMouseDown={(e) => handleResizeStart(e, 'ne')}
                    />
                    <div
                        className="resize-handle absolute -bottom-1 -left-1 h-3 w-3 cursor-nesw-resize border border-blue-500 bg-white"
                        onMouseDown={(e) => handleResizeStart(e, 'sw')}
                    />
                    <div
                        className="resize-handle absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize border border-blue-500 bg-white"
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
                        className="resize-handle absolute -left-1 top-1/2 h-3 w-3 -translate-y-1/2 cursor-ew-resize border border-blue-500 bg-white"
                        onMouseDown={(e) => handleResizeStart(e, 'w')}
                    />
                    <div
                        className="resize-handle absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 cursor-ew-resize border border-blue-500 bg-white"
                        onMouseDown={(e) => handleResizeStart(e, 'e')}
                    />
                </>
            )}
        </div>
    );
}
