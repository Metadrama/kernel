import { useState, useCallback, useRef } from 'react';
import type { ComponentCard } from '@/types/dashboard';
import { getDefaultSize } from '@/lib/component-sizes';
import { resolveSnap } from '@/lib/snap-resolver';
import type { AlignmentGuide, ComponentBounds } from '@/lib/alignment-helpers';

interface DropPreview {
    componentType: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    bypassSnap: boolean;
}

interface UseDragDropHandlerOptions {
    canvasScale: number;
    siblingBounds: ComponentBounds[];
    containerRef: React.RefObject<HTMLDivElement | null>;
    getDragged?: () => { component?: ComponentCard } | null;
    onComponentAdd: (componentType: string, position: { x: number; y: number }) => void;
}

interface UseDragDropHandlerReturn {
    dropPreview: DropPreview | null;
    activeGuides: AlignmentGuide[];
    handleDragOver: (e: React.DragEvent) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
}

/**
 * Hook for handling component drag & drop from sidebar to artboard
 * Manages drop preview, snapping, and alignment guides
 */
export function useDragDropHandler({
    canvasScale,
    siblingBounds,
    containerRef,
    getDragged,
    onComponentAdd,
}: UseDragDropHandlerOptions): UseDragDropHandlerReturn {
    const [dropPreview, setDropPreview] = useState<DropPreview | null>(null);
    const [activeGuides, setActiveGuides] = useState<AlignmentGuide[]>([]);

    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'copy';

            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;

            // Prefer in-memory drag payload (reliable), fall back to DataTransfer when available.
            let componentData: ComponentCard | null = null;

            const dragged = getDragged?.();
            if (dragged?.component?.id) {
                componentData = dragged.component;
            } else {
                const payload = e.dataTransfer.getData('application/json');
                if (payload) {
                    try {
                        componentData = JSON.parse(payload) as ComponentCard;
                    } catch {
                        componentData = null;
                    }
                }
            }

            if (!componentData?.id) {
                // No payload available during dragover in some browsers; just clear preview/guides.
                setDropPreview(null);
                setActiveGuides([]);
                return;
            }

            const defaultSize = getDefaultSize(componentData.id);

            const rawX = (e.clientX - rect.left) / canvasScale;
            const rawY = (e.clientY - rect.top) / canvasScale;

            const bypassSnap = e.altKey;

            const snap = resolveSnap({
                rawPosition: { x: rawX, y: rawY },
                moving: {
                    id: '__drop-preview__',
                    width: defaultSize.width,
                    height: defaultSize.height,
                },
                siblings: siblingBounds,
                modifiers: { bypassAllSnapping: bypassSnap },
            });

            setDropPreview({
                componentType: componentData.id,
                position: snap.position,
                size: { width: defaultSize.width, height: defaultSize.height },
                bypassSnap,
            });

            setActiveGuides(snap.guides);
        },
        [canvasScale, siblingBounds, containerRef, getDragged]
    );

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDropPreview(null);
        setActiveGuides([]);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();

            try {
                // Prefer in-memory drag payload, fall back to DataTransfer for safety.
                let componentData: ComponentCard | null = null;

                const dragged = getDragged?.();
                if (dragged?.component?.id) {
                    componentData = dragged.component;
                } else {
                    const payload = e.dataTransfer.getData('application/json');
                    if (payload) {
                        componentData = JSON.parse(payload) as ComponentCard;
                    }
                }

                if (!componentData?.id) return;

                // Calculate drop position relative to artboard
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) return;

                const rawX = (e.clientX - rect.left) / canvasScale;
                const rawY = (e.clientY - rect.top) / canvasScale;

                // Snap dropped component using the centralized resolver (alignment-first, grid fallback).
                const defaultSize = getDefaultSize(componentData.id);

                const snap = resolveSnap({
                    rawPosition: { x: rawX, y: rawY },
                    moving: {
                        id: '__drop-preview__',
                        width: defaultSize.width,
                        height: defaultSize.height,
                    },
                    siblings: siblingBounds,
                    modifiers: { bypassAllSnapping: e.altKey },
                });

                onComponentAdd(componentData.id, { x: snap.position.x, y: snap.position.y });
            } catch (error) {
                console.error('Failed to parse dropped component:', error);
            } finally {
                setDropPreview(null);
                setActiveGuides([]);
            }
        },
        [canvasScale, siblingBounds, containerRef, getDragged, onComponentAdd]
    );

    return {
        dropPreview,
        activeGuides,
        handleDragOver,
        handleDragLeave,
        handleDrop,
    };
}
