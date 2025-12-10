/**
 * useComponentDrag - Freeform component dragging within a widget container
 * 
 * Mirrors the useArtboardDrag pattern for consistent, smooth movement.
 * Provides instant visual feedback via local state during drag.
 * Collision detection is applied on drop, not during drag (for smoothness).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    findNonOverlappingPosition,
    constrainToBounds,
    type ComponentRect
} from '@/lib/collision-detection';

export interface UseComponentDragOptions {
    /** Current position of the component */
    position: { x: number; y: number };
    /** Size of the component */
    size: { width: number; height: number };
    /** Unique ID of this component */
    componentId: string;
    /** Reference to the container element */
    containerRef: React.RefObject<HTMLElement | null>;
    /** Other components in the container (for collision detection) */
    siblings: ComponentRect[];
    /** Canvas scale factor (for zoom compensation) */
    scale?: number;
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
    onPositionChange,
    onSelect,
    disabled = false,
}: UseComponentDragOptions): UseComponentDragReturn {
    const [isDragging, setIsDragging] = useState(false);
    const [localPosition, setLocalPosition] = useState<{ x: number; y: number } | null>(null);

    const dragStartRef = useRef<{
        mouseX: number;
        mouseY: number;
        startX: number;
        startY: number;
    } | null>(null);

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
        onSelect?.();
    }, [disabled, position, onSelect]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !dragStartRef.current || !containerRef.current) return;

        // Apply scale compensation for canvas zoom
        const deltaX = (e.clientX - dragStartRef.current.mouseX) / scale;
        const deltaY = (e.clientY - dragStartRef.current.mouseY) / scale;

        const container = containerRef.current.getBoundingClientRect();
        // Container size also needs scale compensation
        const containerSize = {
            width: container.width / scale,
            height: container.height / scale
        };

        // Calculate new position (constrained to bounds during drag for UX)
        const newRect = constrainToBounds(
            {
                x: dragStartRef.current.startX + deltaX,
                y: dragStartRef.current.startY + deltaY,
                ...size,
            },
            containerSize
        );

        setLocalPosition({ x: newRect.x, y: newRect.y });
    }, [isDragging, containerRef, size, scale]);

    const handleMouseUp = useCallback(() => {
        if (isDragging && localPosition && containerRef.current) {
            const container = containerRef.current.getBoundingClientRect();
            // Container size with scale compensation
            const containerSize = {
                width: container.width / scale,
                height: container.height / scale
            };

            // Apply collision detection on drop
            const finalPosition = findNonOverlappingPosition(
                { ...localPosition, ...size },
                siblings,
                containerSize,
                componentId
            );

            onPositionChange(finalPosition);
        }

        setIsDragging(false);
        setLocalPosition(null);
        dragStartRef.current = null;
    }, [isDragging, localPosition, containerRef, size, siblings, componentId, onPositionChange, scale]);

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
        handleMouseDown,
    };
}

