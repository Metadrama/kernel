/**
 * useCanvasPan - Hand tool pan interaction
 * 
 * Handles left-click drag panning when in hand mode or spacebar pressed.
 */

import { useEffect, useRef, useState } from 'react';
import type { CanvasPosition } from '@/features/artboard/types/artboard';

export interface UseCanvasPanOptions {
    /** Whether hand tool is active */
    isHandMode: boolean;
    /** Current pan state */
    pan: CanvasPosition;
    /** Set pan state */
    setPan: React.Dispatch<React.SetStateAction<CanvasPosition>>;
}

export interface UseCanvasPanReturn {
    /** Whether currently panning */
    isPanning: boolean;
    /** Handle mouse down on canvas */
    handleCanvasMouseDown: (e: React.MouseEvent) => void;
}

export function useCanvasPan({ isHandMode, pan, setPan }: UseCanvasPanOptions): UseCanvasPanReturn {
    const [isPanning, setIsPanning] = useState(false);
    const lastMousePos = useRef<{ x: number; y: number } | null>(null);

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        const isMiddleClick = e.button === 1;
        const isLeftClick = e.button === 0;

        if (isMiddleClick || (isLeftClick && isHandMode)) {
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

            setPan((prev) => ({
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
    }, [isPanning, setPan]);

    return {
        isPanning,
        handleCanvasMouseDown,
    };
}

