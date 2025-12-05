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

const clampScale = (value: number) => Math.min(Math.max(value, MIN_SCALE), MAX_SCALE);

export interface UseCanvasZoomOptions {
    /** Initial scale (default: 1) */
    initialScale?: number;
    /** Initial pan position (default: { x: 0, y: 0 }) */
    initialPan?: CanvasPosition;
    /** Min scale (default: 0.1) */
    minScale?: number;
    /** Max scale (default: 5) */
    maxScale?: number;
}

export interface UseCanvasZoomReturn {
    /** Current zoom scale */
    scale: number;
    /** Current pan offset */
    pan: CanvasPosition;
    /** Viewport dimensions */
    viewportSize: { width: number; height: number };
    /** Set pan directly */
    setPan: React.Dispatch<React.SetStateAction<CanvasPosition>>;
    /** Adjust scale with optional focus point */
    adjustScale: (scaleUpdater: (prev: number) => number, focusPoint?: CanvasPosition) => void;
    /** Ref to attach to canvas element */
    canvasRef: React.RefObject<HTMLDivElement | null>;
}

export function useCanvasZoom(options: UseCanvasZoomOptions = {}): UseCanvasZoomReturn {
    const {
        initialScale = 1,
        initialPan = { x: 0, y: 0 },
        minScale = MIN_SCALE,
        maxScale = MAX_SCALE,
    } = options;

    const canvasRef = useRef<HTMLDivElement>(null);
    const lastWheelTime = useRef<number>(0);
    const [scale, setScale] = useState(initialScale);
    const [pan, setPan] = useState<CanvasPosition>(initialPan);
    const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

    const clamp = useCallback(
        (value: number) => Math.min(Math.max(value, minScale), maxScale),
        [minScale, maxScale]
    );

    const adjustScale = useCallback(
        (scaleUpdater: (prev: number) => number, focusPoint?: CanvasPosition) => {
            setScale((prevScale) => {
                const nextScale = clamp(scaleUpdater(prevScale));
                const canvasElement = canvasRef.current;

                if (!canvasElement || prevScale === nextScale) {
                    return nextScale;
                }

                const rect = canvasElement.getBoundingClientRect();
                const fallbackFocus = { x: rect.width / 2, y: rect.height / 2 };
                const targetFocus = focusPoint ?? fallbackFocus;

                setPan((prevPan) => {
                    const worldPoint = {
                        x: (targetFocus.x - prevPan.x) / prevScale,
                        y: (targetFocus.y - prevPan.y) / prevScale,
                    };
                    return {
                        x: targetFocus.x - worldPoint.x * nextScale,
                        y: targetFocus.y - worldPoint.y * nextScale,
                    };
                });

                return nextScale;
            });
        },
        [clamp]
    );

    // Handle wheel events for zoom and pan
    useEffect(() => {
        const element = canvasRef.current;
        if (!element) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey) {
                // Zoom
                e.preventDefault();
                const rect = element.getBoundingClientRect();
                const focusPoint = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                };
                const delta = e.deltaY > 0 ? 0.9 : 1.1;
                adjustScale((prev) => prev * delta, focusPoint);
            } else {
                // Pan
                e.preventDefault();

                let deltaX = e.deltaX;
                let deltaY = e.deltaY;

                // Shift + Scroll = Horizontal Scroll
                if (e.shiftKey && deltaY !== 0 && deltaX === 0) {
                    deltaX = deltaY;
                    deltaY = 0;
                }

                // Scroll acceleration logic
                const now = Date.now();
                const dt = now - lastWheelTime.current;
                lastWheelTime.current = now;

                const isMouseWheel = Math.abs(deltaX) >= 50 || Math.abs(deltaY) >= 50;
                let effectiveDeltaX = deltaX;
                let effectiveDeltaY = deltaY;

                if (isMouseWheel) {
                    const NOTCH_SIZE = 5;
                    effectiveDeltaX = Math.sign(deltaX) * NOTCH_SIZE * (Math.abs(deltaX) > 0 ? 1 : 0);
                    effectiveDeltaY = Math.sign(deltaY) * NOTCH_SIZE * (Math.abs(deltaY) > 0 ? 1 : 0);
                }

                let velocityFactor = 1;
                if (dt < 20) {
                    velocityFactor = 25;
                } else if (dt < 40) {
                    velocityFactor = 10;
                } else if (dt < 80) {
                    velocityFactor = 3;
                }

                if (!isMouseWheel) {
                    const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    if (magnitude > 100) {
                        velocityFactor = Math.max(velocityFactor, 2.5);
                    } else if (magnitude > 50) {
                        velocityFactor = Math.max(velocityFactor, 1.5);
                    }
                }

                setPan((prev) => ({
                    x: prev.x - effectiveDeltaX * velocityFactor,
                    y: prev.y - effectiveDeltaY * velocityFactor,
                }));
            }
        };

        element.addEventListener('wheel', handleWheel, { passive: false });
        return () => element.removeEventListener('wheel', handleWheel);
    }, [adjustScale]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey) {
                if (e.key === '=' || e.key === '+') {
                    e.preventDefault();
                    adjustScale((prev) => prev * 1.1);
                } else if (e.key === '-') {
                    e.preventDefault();
                    adjustScale((prev) => prev * 0.9);
                } else if (e.key === '0') {
                    e.preventDefault();
                    adjustScale(() => 1);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [adjustScale]);

    // Track viewport size
    useLayoutEffect(() => {
        if (!canvasRef.current) return;
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                const { width, height } = entry.contentRect;
                setViewportSize({ width, height });
            }
        });
        observer.observe(canvasRef.current);
        return () => observer.disconnect();
    }, []);

    return {
        scale,
        pan,
        viewportSize,
        setPan,
        adjustScale,
        canvasRef,
    };
}
