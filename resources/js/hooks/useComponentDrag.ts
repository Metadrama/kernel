/**
 * useComponentDrag - Freeform component dragging within a widget container
 * 
 * Mirrors the useArtboardDrag pattern for consistent, smooth movement.
 * Provides instant visual feedback via local state during drag.
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

export interface UseComponentDragOptions {
    /** Current position of the component */
    position: { x: number; y: number };
    /** Size of the component */
    size: { width: number; height: number };
    /** Unique ID of this component */
    componentId: string;
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
    /** Called when position changes (on drop) */
    onPositionChange: (position: { x: number; y: number }) => void;
    /** Called when drag starts */
    onSelect?: () => void;
    /** Whether dragging is disabled */
    disabled?: boolean;
}

export interface UseComponentDragReturn {
    /** Whether the component is currently being dragged */
    isDragging: boolean;
    /** Position to display (local during drag, prop otherwise) */
    displayPosition: { x: number; y: number };
    /** Active alignment guides to display */
    activeGuides: SnapLine[];
    /** Mouse down handler for the drag handle */
    handleMouseDown: (e: React.MouseEvent) => void;
}

export function useComponentDrag({
    position,
    size,
    componentId,
    containerRef,
    siblings,
    scale = 1,
    enableSnapping = true,
    snapThreshold = DEFAULT_SNAP_THRESHOLD,
    onPositionChange,
    onSelect,
    disabled = false,
}: UseComponentDragOptions): UseComponentDragReturn {
    const [isDragging, setIsDragging] = useState(false);
    const [localPosition, setLocalPosition] = useState<{ x: number; y: number } | null>(null);
    const [activeGuides, setActiveGuides] = useState<SnapLine[]>([]);
    const [shiftPressed, setShiftPressed] = useState(false);

    const dragStartRef = useRef<{
        mouseX: number;
        mouseY: number;
        startX: number;
        startY: number;
    } | null>(null);

    // Track shift key state
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setShiftPressed(true);
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Shift') setShiftPressed(false);
        };

        if (isDragging) {
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keyup', handleKeyUp);
            };
        }
    }, [isDragging]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (disabled) return;

        e.stopPropagation();
        e.preventDefault();
        // Stop GridStack from capturing this event
        e.nativeEvent.stopImmediatePropagation();

        dragStartRef.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            startX: position.x,
            startY: position.y,
        };

        setIsDragging(true);
        setLocalPosition(position);
        setActiveGuides([]);
        onSelect?.();
    }, [disabled, position, onSelect]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !dragStartRef.current || !containerRef.current) return;

        // Apply scale compensation for canvas zoom
        const deltaX = (e.clientX - dragStartRef.current.mouseX) / scale;
        const deltaY = (e.clientY - dragStartRef.current.mouseY) / scale;

        const container = containerRef.current.getBoundingClientRect();
        const containerSize = {
            width: container.width / scale,
            height: container.height / scale
        };

        // Calculate raw position
        let newX = dragStartRef.current.startX + deltaX;
        let newY = dragStartRef.current.startY + deltaY;

        // Apply snapping if enabled and shift not pressed
        let guides: SnapLine[] = [];
        if (enableSnapping && !shiftPressed) {
            const snapLines = getAllSnapLines(siblings, containerSize);
            const snapResult = snapToGuides(
                { x: newX, y: newY, ...size },
                snapLines,
                snapThreshold
            );
            newX = snapResult.x;
            newY = snapResult.y;
            guides = snapResult.activeGuides;
        }

        // Constrain to bounds
        const constrained = constrainToBounds(
            { x: newX, y: newY, ...size },
            containerSize
        );

        setLocalPosition({ x: constrained.x, y: constrained.y });
        setActiveGuides(guides);
    }, [isDragging, containerRef, size, scale, siblings, enableSnapping, shiftPressed, snapThreshold]);

    const handleMouseUp = useCallback(() => {
        if (isDragging && localPosition) {
            // Simply commit the snapped position (no collision detection)
            onPositionChange(localPosition);
        }

        setIsDragging(false);
        setLocalPosition(null);
        setActiveGuides([]);
        dragStartRef.current = null;
    }, [isDragging, localPosition, onPositionChange]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return {
        isDragging,
        displayPosition: isDragging && localPosition ? localPosition : position,
        activeGuides: isDragging ? activeGuides : [],
        handleMouseDown,
    };
}
