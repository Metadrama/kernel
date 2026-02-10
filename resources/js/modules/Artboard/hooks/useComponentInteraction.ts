import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { ComponentBounds, AlignmentGuide } from '@/modules/Artboard/lib/alignment-helpers';
import { resolveSnap, resolveResizeSnap } from '@/modules/Artboard/lib/snap-resolver';
import { getMinSize, getMaxSize, getAspectRatio } from '@/modules/Artboard/lib/component-sizes';

/**
 * Creates a throttled version of a callback that fires at most once per animation frame.
 * Ensures the LAST value is always delivered (trailing call).
 */
function useRafThrottle<T>(callback: ((value: T) => void) | undefined) {
    const rafIdRef = useRef<number | null>(null);
    const latestValueRef = useRef<T | null>(null);
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    const throttled = useCallback((value: T) => {
        latestValueRef.current = value;
        if (rafIdRef.current === null) {
            rafIdRef.current = requestAnimationFrame(() => {
                rafIdRef.current = null;
                if (latestValueRef.current !== null) {
                    callbackRef.current?.(latestValueRef.current);
                }
            });
        }
    }, []);

    const cancel = useCallback(() => {
        if (rafIdRef.current !== null) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }
        latestValueRef.current = null;
    }, []);

    useEffect(() => cancel, [cancel]);

    return useMemo(() => ({ throttled, cancel }), [throttled, cancel]);
}

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface Position {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface UseComponentInteractionOptions {
    position: Position;
    componentType: string;
    componentId: string;
    locked: boolean;
    scale: number;
    siblingBounds?: ComponentBounds[];
    onSelect: () => void;
    onPositionChange: (position: Position) => void;
    onLivePositionChange?: (position: Position | null) => void;
    onGuidesChange?: (guides: AlignmentGuide[]) => void;
}

interface UseComponentInteractionReturn {
    isDragging: boolean;
    isResizing: boolean;
    displayRect: Position;
    handleMouseDown: (e: React.MouseEvent) => void;
    handleResizeStart: (e: React.MouseEvent, handle: ResizeHandle) => void;
}

/**
 * Hook for handling component drag and resize interactions
 * Manages local state during interaction and applies snapping
 */
export function useComponentInteraction({
    position,
    componentType,
    componentId,
    locked,
    scale,
    siblingBounds,
    onSelect,
    onPositionChange,
    onLivePositionChange,
    onGuidesChange,
}: UseComponentInteractionOptions): UseComponentInteractionReturn {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
    const [localRect, setLocalRect] = useState<Position | null>(null);

    const localRectRef = useRef<Position | null>(null);
    const interactionStartRectRef = useRef<Position | null>(null);
    const dragStartRef = useRef<{ x: number; y: number; compX: number; compY: number; width: number; height: number } | null>(null);
    const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number; compX: number; compY: number } | null>(null);

    // Refs for latest props (avoid stale closures in event handlers)
    const siblingBoundsRef = useRef<ComponentBounds[] | undefined>(siblingBounds);
    const onGuidesChangeRef = useRef<((guides: AlignmentGuide[]) => void) | undefined>(onGuidesChange);
    const onLivePositionChangeRef = useRef<((position: Position | null) => void) | undefined>(onLivePositionChange);
    const componentIdRef = useRef<string>(componentId);

    // Throttle live position updates to one per animation frame
    const livePositionThrottle = useRafThrottle<Position>(onLivePositionChange);

    useEffect(() => {
        siblingBoundsRef.current = siblingBounds;
    }, [siblingBounds]);

    useEffect(() => {
        onGuidesChangeRef.current = onGuidesChange;
    }, [onGuidesChange]);

    useEffect(() => {
        onLivePositionChangeRef.current = onLivePositionChange;
    }, [onLivePositionChange]);

    useEffect(() => {
        componentIdRef.current = componentId;
    }, [componentId]);

    const minSize = getMinSize(componentType);
    const maxSize = getMaxSize(componentType);
    const aspectRatio = getAspectRatio(componentType);

    const displayRect = (isDragging || isResizing) && localRect ? localRect : position;

    // Start drag
    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (locked || isResizing) return;

            // Ignore if clicking on a resize handle
            if ((e.target as HTMLElement).classList.contains('resize-handle')) {
                return;
            }

            e.stopPropagation();
            onSelect();
            setIsDragging(true);

            const startRect = {
                x: position.x,
                y: position.y,
                width: position.width,
                height: position.height,
            };
            interactionStartRectRef.current = startRect;
            localRectRef.current = startRect;
            setLocalRect(startRect);

            dragStartRef.current = {
                x: e.clientX,
                y: e.clientY,
                compX: position.x,
                compY: position.y,
                width: position.width,
                height: position.height,
            };
        },
        [locked, isResizing, onSelect, position]
    );

    // Start resize
    const handleResizeStart = useCallback(
        (e: React.MouseEvent, handle: ResizeHandle) => {
            if (locked) return;

            e.stopPropagation();
            onSelect();
            setIsResizing(true);
            setResizeHandle(handle);

            const startRect = {
                x: position.x,
                y: position.y,
                width: position.width,
                height: position.height,
            };
            interactionStartRectRef.current = startRect;
            localRectRef.current = startRect;
            setLocalRect(startRect);

            resizeStartRef.current = {
                x: e.clientX,
                y: e.clientY,
                width: position.width,
                height: position.height,
                compX: position.x,
                compY: position.y,
            };
        },
        [locked, onSelect, position]
    );

    // Global mouse move and mouse up handlers
    useEffect(() => {
        if (!isDragging && !isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const bypassSnap = e.altKey;

            if (isDragging && dragStartRef.current) {
                const dx = (e.clientX - dragStartRef.current.x) / scale;
                const dy = (e.clientY - dragStartRef.current.y) / scale;

                const rawX = dragStartRef.current.compX + dx;
                const rawY = dragStartRef.current.compY + dy;

                const snapResult = resolveSnap({
                    rawPosition: { x: rawX, y: rawY },
                    moving: {
                        id: componentIdRef.current,
                        width: dragStartRef.current.width,
                        height: dragStartRef.current.height,
                    },
                    siblings: siblingBoundsRef.current,
                    modifiers: { bypassAllSnapping: bypassSnap },
                });

                const newRect = {
                    x: snapResult.position.x,
                    y: snapResult.position.y,
                    width: dragStartRef.current.width,
                    height: dragStartRef.current.height,
                };

                localRectRef.current = newRect;
                setLocalRect(newRect);
                livePositionThrottle.throttled(newRect);
                onGuidesChangeRef.current?.(snapResult.guides);
            } else if (isResizing && resizeStartRef.current && resizeHandle && interactionStartRectRef.current) {
                const dx = (e.clientX - resizeStartRef.current.x) / scale;
                const dy = (e.clientY - resizeStartRef.current.y) / scale;

                const rawRect = { ...interactionStartRectRef.current };

                // Calculate raw resize based on handle
                const h = resizeHandle;
                if (h.includes('e')) rawRect.width = Math.max(minSize.width, resizeStartRef.current.width + dx);
                if (h.includes('w')) {
                    const newWidth = Math.max(minSize.width, resizeStartRef.current.width - dx);
                    rawRect.x = resizeStartRef.current.compX + (resizeStartRef.current.width - newWidth);
                    rawRect.width = newWidth;
                }
                if (h.includes('s')) rawRect.height = Math.max(minSize.height, resizeStartRef.current.height + dy);
                if (h.includes('n')) {
                    const newHeight = Math.max(minSize.height, resizeStartRef.current.height - dy);
                    rawRect.y = resizeStartRef.current.compY + (resizeStartRef.current.height - newHeight);
                    rawRect.height = newHeight;
                }

                // Apply aspect ratio constraint if needed
                if (aspectRatio && e.shiftKey) {
                    const targetRatio = aspectRatio;
                    const currentRatio = rawRect.width / rawRect.height;

                    if (h.includes('e') || h.includes('w')) {
                        rawRect.height = rawRect.width / targetRatio;
                        if (h.includes('n')) {
                            rawRect.y = interactionStartRectRef.current.y + interactionStartRectRef.current.height - rawRect.height;
                        }
                    } else if (h.includes('n') || h.includes('s')) {
                        rawRect.width = rawRect.height * targetRatio;
                        if (h.includes('w')) {
                            rawRect.x = interactionStartRectRef.current.x + interactionStartRectRef.current.width - rawRect.width;
                        }
                    }
                }

                // Apply snap
                const snapResult = resolveResizeSnap({
                    rawRect,
                    startRect: interactionStartRectRef.current,
                    handle: h,
                    siblings: siblingBoundsRef.current,
                    modifiers: { bypassAllSnapping: bypassSnap },
                });

                // Apply size constraints
                const finalRect = { ...snapResult.rect };
                const maxW = maxSize?.width ?? Infinity;
                const maxH = maxSize?.height ?? Infinity;
                finalRect.width = Math.max(minSize.width, Math.min(maxW, finalRect.width));
                finalRect.height = Math.max(minSize.height, Math.min(maxH, finalRect.height));

                localRectRef.current = finalRect;
                setLocalRect(finalRect);
                livePositionThrottle.throttled(finalRect);
                onGuidesChangeRef.current?.(snapResult.guides);
            }
        };

        const handleMouseUp = () => {
            if (localRectRef.current) {
                onPositionChange(localRectRef.current);
            }

            setIsDragging(false);
            setIsResizing(false);
            setResizeHandle(null);
            setLocalRect(null);
            localRectRef.current = null;
            interactionStartRectRef.current = null;
            dragStartRef.current = null;
            resizeStartRef.current = null;
            livePositionThrottle.cancel();
            onLivePositionChangeRef.current?.(null);
            onGuidesChangeRef.current?.([]);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, resizeHandle, scale, minSize, maxSize, aspectRatio, onPositionChange, livePositionThrottle]);

    return {
        isDragging,
        isResizing,
        displayRect,
        handleMouseDown,
        handleResizeStart,
    };
}


