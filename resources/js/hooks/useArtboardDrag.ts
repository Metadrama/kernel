/**
 * useArtboardDrag - Artboard position dragging with zoom-aware movement
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ArtboardSchema } from '@/types/artboard';

export interface UseArtboardDragOptions {
    artboardId: string;
    initialPosition: { x: number; y: number };
    scale: number;
    isSelected: boolean;
    onUpdatePosition: (position: { x: number; y: number }) => void;
}

export interface UseArtboardDragReturn {
    isDragging: boolean;
    position: { x: number; y: number };
    handleMouseDown: (e: React.MouseEvent) => void;
    zIndex: number;
}

export function useArtboardDrag({
    artboardId,
    initialPosition,
    scale,
    isSelected,
    onUpdatePosition
}: UseArtboardDragOptions): UseArtboardDragReturn {
    const [isDragging, setIsDragging] = useState(false);
    const [localPosition, setLocalPosition] = useState<{ x: number; y: number } | null>(null);
    const dragStartRef = useRef<{
        mouseX: number;
        mouseY: number;
        startX: number;
        startY: number;
    } | null>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Prevent drag if clicking on interactive elements or context menu triggers
        // Typically handled by caller (ArtboardContainer header) passing the event
        e.stopPropagation();

        dragStartRef.current = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            startX: initialPosition.x,
            startY: initialPosition.y,
        };

        setIsDragging(true);
        setLocalPosition(initialPosition);
    }, [initialPosition]);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!dragStartRef.current) return;

            const deltaX = (e.clientX - dragStartRef.current.mouseX) / scale;
            const deltaY = (e.clientY - dragStartRef.current.mouseY) / scale;

            setLocalPosition({
                x: dragStartRef.current.startX + deltaX,
                y: dragStartRef.current.startY + deltaY,
            });
        };

        const handleMouseUp = () => {
            if (localPosition) {
                onUpdatePosition(localPosition);
            }
            setIsDragging(false);
            setLocalPosition(null);
            dragStartRef.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, scale, onUpdatePosition, localPosition]);

    return {
        isDragging,
        position: isDragging && localPosition ? localPosition : initialPosition,
        handleMouseDown,
        zIndex: isSelected || isDragging ? 10 : 1,
    };
}
