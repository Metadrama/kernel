/**
 * useComponentResize - Freeform component resizing with 8 directional handles
 * 
 * Provides smooth resize with instant visual feedback.
 * Supports aspect ratio locking and min/max size constraints.
 * Smart snapping to nearby components and container edges.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { constrainToBounds, type ComponentRect } from '@/lib/collision-detection';
import {
    snapToGuides,
    getAllSnapLines,
    DEFAULT_SNAP_THRESHOLD,
    type SnapLine
} from '@/lib/snap-utils';

export type ResizeDirection = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

export interface UseComponentResizeOptions {
    /** Current bounds of the component */
    bounds: { x: number; y: number; width: number; height: number };
    /** Unique ID of this component */
    componentId: string;
    /** Minimum size constraints */
    minSize: { width: number; height: number };
    /** Maximum size constraints (optional) */
    maxSize?: { width: number; height: number } | null;
    /** Aspect ratio to maintain (null = freeform) */
    aspectRatio?: number | null;
    /** Reference to the container element */
    containerRef: React.RefObject<HTMLElement | null>;
    /** Other components in the container (for snapping) */
    siblings: ComponentRect[];
    /** Canvas scale factor (for zoom compensation) */
    scale?: number;
    /** Enable smart snapping (default: true) */
    enableSnapping?: boolean;
    /** Snap threshold in pixels (default: 8) */
    snapThreshold?: number;
    /** Called when bounds change (on release) */
    onBoundsChange: (bounds: { x: number; y: number; width: number; height: number }) => void;
    /** Whether resizing is disabled */
    disabled?: boolean;
}

export interface UseComponentResizeReturn {
    /** Whether the component is currently being resized */
    isResizing: boolean;
    /** Current resize direction (null if not resizing) */
    resizeDirection: ResizeDirection | null;
    /** Bounds to display (local during resize, prop otherwise) */
    displayBounds: { x: number; y: number; width: number; height: number };
    /** Active alignment guides to display */
    activeGuides: SnapLine[];
    /** Start resize from a specific handle */
    startResize: (e: React.MouseEvent, direction: ResizeDirection) => void;
}

export function useComponentResize({
    bounds,
    componentId,
    minSize,
    maxSize,
    aspectRatio,
    containerRef,
    siblings,
    scale = 1,
    enableSnapping = true,
    snapThreshold = DEFAULT_SNAP_THRESHOLD,
    onBoundsChange,
    disabled = false,
}: UseComponentResizeOptions): UseComponentResizeReturn {
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);
    const [localBounds, setLocalBounds] = useState<typeof bounds | null>(null);
    const [activeGuides, setActiveGuides] = useState<SnapLine[]>([]);
    const [shiftPressed, setShiftPressed] = useState(false);

    const resizeStartRef = useRef<{
        mouseX: number;
        mouseY: number;
        startBounds: typeof bounds;
        direction: ResizeDirection;
    } | null>(null);

    // Track shift key state
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setShiftPressed(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setShiftPressed(false);
        };

        if (isResizing) {
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keyup', handleKeyUp);
            };
        }
    }, [isResizing]);

    const startResize = useCallback((e: React.MouseEvent, direction: ResizeDirection) => {
        if (disabled) return;

        e.stopPropagation();
        e.preventDefault();
        // Stop GridStack from capturing this event
        e.nativeEvent.stopImmediatePropagation();

        resizeStartRef.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            startBounds: { ...bounds },
            direction,
        };

        setIsResizing(true);
        setResizeDirection(direction);
        setLocalBounds(bounds);
        setActiveGuides([]);
    }, [disabled, bounds]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing || !resizeStartRef.current || !containerRef.current) return;

        const { mouseX, mouseY, startBounds, direction } = resizeStartRef.current;
        // Apply scale compensation for canvas zoom
        const deltaX = (e.clientX - mouseX) / scale;
        const deltaY = (e.clientY - mouseY) / scale;

        let newX = startBounds.x;
        let newY = startBounds.y;
        let newWidth = startBounds.width;
        let newHeight = startBounds.height;

        // Apply delta based on direction
        if (direction.includes('e')) {
            newWidth = startBounds.width + deltaX;
        }
        if (direction.includes('w')) {
            newWidth = startBounds.width - deltaX;
            newX = startBounds.x + deltaX;
        }
        if (direction.includes('s')) {
            newHeight = startBounds.height + deltaY;
        }
        if (direction.includes('n')) {
            newHeight = startBounds.height - deltaY;
            newY = startBounds.y + deltaY;
        }

        // Apply min/max constraints
        newWidth = Math.max(minSize.width, newWidth);
        newHeight = Math.max(minSize.height, newHeight);

        if (maxSize) {
            newWidth = Math.min(maxSize.width, newWidth);
            newHeight = Math.min(maxSize.height, newHeight);
        }

        // Apply aspect ratio if set
        if (aspectRatio) {
            if (direction.includes('e') || direction.includes('w')) {
                newHeight = newWidth / aspectRatio;
            } else if (direction.includes('n') || direction.includes('s')) {
                newWidth = newHeight * aspectRatio;
            } else {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    newHeight = newWidth / aspectRatio;
                } else {
                    newWidth = newHeight * aspectRatio;
                }
            }

            if (newWidth < minSize.width) {
                newWidth = minSize.width;
                newHeight = newWidth / aspectRatio;
            }
            if (newHeight < minSize.height) {
                newHeight = minSize.height;
                newWidth = newHeight * aspectRatio;
            }
        }

        // Correct position if resizing from left/top
        if (direction.includes('w')) {
            newX = startBounds.x + startBounds.width - newWidth;
        }
        if (direction.includes('n')) {
            newY = startBounds.y + startBounds.height - newHeight;
        }

        const container = containerRef.current.getBoundingClientRect();
        const containerSize = {
            width: container.width / scale,
            height: container.height / scale
        };

        // Apply snapping if enabled and shift not pressed
        let guides: SnapLine[] = [];
        if (enableSnapping && !shiftPressed) {
            const snapLines = getAllSnapLines(siblings, containerSize);
            const snapResult = snapToGuides(
                { x: newX, y: newY, width: newWidth, height: newHeight },
                snapLines,
                snapThreshold
            );
            newX = snapResult.x;
            newY = snapResult.y;
            guides = snapResult.activeGuides;
        }

        // Constrain to container
        const constrained = constrainToBounds(
            { x: newX, y: newY, width: newWidth, height: newHeight },
            containerSize
        );

        setLocalBounds(constrained);
        setActiveGuides(guides);
    }, [isResizing, containerRef, minSize, maxSize, aspectRatio, scale, siblings, enableSnapping, shiftPressed, snapThreshold]);

    const handleMouseUp = useCallback(() => {
        if (isResizing && localBounds) {
            // Simply commit the snapped bounds (no collision detection)
            onBoundsChange(localBounds);
        }

        setIsResizing(false);
        setResizeDirection(null);
        setLocalBounds(null);
        setActiveGuides([]);
        resizeStartRef.current = null;
    }, [isResizing, localBounds, onBoundsChange]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isResizing, handleMouseMove, handleMouseUp]);

    return {
        isResizing,
        resizeDirection,
        displayBounds: isResizing && localBounds ? localBounds : bounds,
        activeGuides: isResizing ? activeGuides : [],
        startResize,
    };
}
