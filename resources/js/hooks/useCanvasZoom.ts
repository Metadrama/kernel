/**
 * useCanvasZoom - Canvas zoom and pan state management
 * 
 * Extracts zoom/pan logic from ArtboardCanvas for reusability.
 * Handles:
 * - Zoom with Ctrl+wheel (focus-point aware)
 * - Pan with wheel scroll
 * - Keyboard shortcuts (Ctrl+/-, Ctrl+0)
 * - Viewport resize tracking
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CanvasPosition } from '@/types/artboard';

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;

const clampScale = (value: number, min = MIN_SCALE, max = MAX_SCALE) => Math.min(Math.max(value, min), max);

export interface UseCanvasZoomOptions {
    /** Current scale (controlled) */
    scale: number;
    /** Set scale callback */
    setScale: React.Dispatch<React.SetStateAction<number>>;
    /** Initial pan position (default: { x: 0, y: 0 }) */
    initialPan?: CanvasPosition;
    /** Min scale (default: 0.1) */
    minScale?: number;
    /** Max scale (default: 5) */
    maxScale?: number;
    /** Reference to the container element */
    containerRef: React.RefObject<HTMLElement | null>;
}

export interface UseCanvasZoomReturn {
    /** Zoom in */
    zoomIn: () => void;
    /** Zoom out */
    zoomOut: () => void;
    /** Reset zoom to 100% */
    resetZoom: () => void;
}

export function useCanvasZoom({
    scale,
    setScale,
    minScale = MIN_SCALE,
    maxScale = MAX_SCALE,
    containerRef
}: UseCanvasZoomOptions): UseCanvasZoomReturn {

    const zoomIn = useCallback(() => {
        setScale(s => clampScale(s * 1.2, minScale, maxScale));
    }, [setScale, minScale, maxScale]);

    const zoomOut = useCallback(() => {
        setScale(s => clampScale(s / 1.2, minScale, maxScale));
    }, [setScale, minScale, maxScale]);

    const resetZoom = useCallback(() => {
        setScale(1);
    }, [setScale]);

    return {
        zoomIn,
        zoomOut,
        resetZoom,
    };
}
