/**
 * useArtboardDrag - Artboard position dragging with zoom-aware movement
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseArtboardDragOptions {
    position: { x: number; y: number };
    canvasScale: number;
    locked: boolean;
    onPositionChange: (position: { x: number; y: number }) => void;
    onSelect: () => void;
}

export interface UseArtboardDragReturn {
    isDragging: boolean;
    displayPosition: { x: number; y: number };
    handleMouseDown: (e: React.MouseEvent) => void;
}

export function useArtboardDrag({
    position,
    canvasScale,
    locked,
    onPositionChange,
    onSelect,
}: UseArtboardDragOptions): UseArtboardDragReturn {
    const [isDragging, setIsDragging] = useState(false);
    const [localPosition, setLocalPosition] = useState<{ x: number; y: number } | null>(null);
    const dragStartRef = useRef<{
        mouseX: number;
        mouseY: number;
        artboardX: number;
        artboardY: number;
    } | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (locked) return;

        // Only drag from header/title area
        if (
            e.target instanceof HTMLElement &&
            (e.target.classList.contains('artboard-header') ||
                e.target.closest('.artboard-header'))
        ) {
            e.stopPropagation();
            e.preventDefault();

            dragStartRef.current = {
                mouseX: e.clientX,
                mouseY: e.clientY,
                artboardX: position.x,
                artboardY: position.y,
            };

            setIsDragging(true);
            setLocalPosition(position);
            onSelect();
        }
    };

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging || !dragStartRef.current || locked) return;

            const deltaX = e.clientX - dragStartRef.current.mouseX;
            const deltaY = e.clientY - dragStartRef.current.mouseY;

            const canvasDeltaX = deltaX / canvasScale;
            const canvasDeltaY = deltaY / canvasScale;

            setLocalPosition({
                x: dragStartRef.current.artboardX + canvasDeltaX,
                y: dragStartRef.current.artboardY + canvasDeltaY,
            });
        },
        [isDragging, locked, canvasScale]
    );

    const handleMouseUp = useCallback(() => {
        if (isDragging && localPosition) {
            onPositionChange(localPosition);
        }
        setIsDragging(false);
        setLocalPosition(null);
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
        handleMouseDown,
    };
}
