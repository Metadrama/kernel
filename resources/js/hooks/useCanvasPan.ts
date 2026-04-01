/**
 * useCanvasPan - Hand tool pan interaction
 * 
 * Handles left-click drag panning when in hand mode or spacebar pressed.
 */

import { useEffect, useRef, useState } from 'react';
import type { CanvasPosition } from '@/types/artboard';

export interface UseCanvasPanOptions {
    /** Reference to the container element */
    containerRef: React.RefObject<HTMLElement | null>;
    /** Reference to the content element */
    contentRef?: React.RefObject<HTMLElement | null>;
    /** Initial pan position */
    initialPosition?: CanvasPosition;
    /** Current scale */
    scale?: number;
    /** Whether panning is enabled (e.g., spacebar or tool active) */
    enabled?: boolean;
}

export interface UseCanvasPanReturn {
    /** Whether currently panning */
    isPanning: boolean;
    /** Handle mouse down on canvas */
    handleMouseDown: (e: React.MouseEvent) => void;
    /** Current pan position */
    panPosition: CanvasPosition;
}

export function useCanvasPan({
    containerRef,
    initialPosition = { x: 0, y: 0 },
    enabled = false
}: UseCanvasPanOptions): UseCanvasPanReturn {
    const [isPanning, setIsPanning] = useState(false);
    const [panPosition, setPanPosition] = useState<CanvasPosition>(initialPosition);
    const lastMousePos = useRef<{ x: number; y: number } | null>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!enabled) return;
        const isMiddleClick = e.button === 1;
        const isLeftClick = e.button === 0;

        if (isMiddleClick || isLeftClick) {
            e.preventDefault();
            setIsPanning(true);
            lastMousePos.current = { x: e.clientX, y: e.clientY };
        }
    };

    useEffect(() => {
        if (!isPanning) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!lastMousePos.current) return;

            const deltaX = e.clientX - lastMousePos.current.x;
            const deltaY = e.clientY - lastMousePos.current.y;

            lastMousePos.current = { x: e.clientX, y: e.clientY };

            setPanPosition((prev) => ({
                x: prev.x + deltaX,
                y: prev.y + deltaY,
            }));
        };

        const handleMouseUp = () => {
            setIsPanning(false);
            lastMousePos.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isPanning]);

    return {
        isPanning,
        handleMouseDown,
        panPosition
    };
}
