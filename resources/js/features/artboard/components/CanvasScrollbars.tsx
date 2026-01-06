/**
 * CanvasScrollbars - Custom scrollbars for the infinite canvas
 * 
 * Renders Figma-style thin scrollbars that show the view position
 * within the scrollable universe.
 */

import { useEffect, useRef, useState } from 'react';
import type { CanvasPosition } from '@/features/artboard/types/artboard';

const SCROLLBAR_THICKNESS = 6;
const MIN_THUMB_SIZE = 24;

export interface Universe {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
    viewMinX: number;
    viewMinY: number;
    viewWidth: number;
    viewHeight: number;
}

interface CanvasScrollbarsProps {
    universe: Universe;
    viewportSize: { width: number; height: number };
    scale: number;
    pan: CanvasPosition;
    setPan: React.Dispatch<React.SetStateAction<CanvasPosition>>;
}

export default function CanvasScrollbars({
    universe,
    viewportSize,
    scale,
    pan,
    setPan,
}: CanvasScrollbarsProps) {
    const [isDragging, setIsDragging] = useState<'horizontal' | 'vertical' | null>(null);
    const dragStartRef = useRef<{
        mouseStart: number;
        panStart: number;
        universeSize: number;
        trackSize: number;
    } | null>(null);

    const handleMouseDown = (axis: 'horizontal' | 'vertical', e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(axis);

        const trackSize = axis === 'horizontal' ? viewportSize.width : viewportSize.height;
        const universeSize = axis === 'horizontal' ? universe.width : universe.height;

        dragStartRef.current = {
            mouseStart: axis === 'horizontal' ? e.clientX : e.clientY,
            panStart: axis === 'horizontal' ? pan.x : pan.y,
            universeSize,
            trackSize,
        };
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!dragStartRef.current) return;
            const { mouseStart, panStart, universeSize, trackSize } = dragStartRef.current;

            const currentMouse = isDragging === 'horizontal' ? e.clientX : e.clientY;
            const deltaPx = currentMouse - mouseStart;

            const worldDelta = deltaPx * (universeSize / trackSize);
            const newPan = panStart - (worldDelta * scale);

            setPan((prev) => ({
                ...prev,
                [isDragging === 'horizontal' ? 'x' : 'y']: newPan,
            }));
        };

        const handleMouseUp = () => {
            setIsDragging(null);
            dragStartRef.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, scale, setPan]);

    const showHorizontal = universe.width > universe.viewWidth + 1 || isDragging === 'horizontal';
    const showVertical = universe.height > universe.viewHeight + 1 || isDragging === 'vertical';

    return (
        <>
            {/* Horizontal Scrollbar */}
            <div
                className={`absolute bottom-0 left-0 right-0 z-50 flex items-center transition-opacity duration-150 ease-out ${showHorizontal ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                style={{ height: SCROLLBAR_THICKNESS }}
            >
                <div
                    className="relative h-full w-full bg-transparent hover:bg-black/5 transition-colors"
                    style={{ height: SCROLLBAR_THICKNESS }}
                >
                    <div
                        className="absolute top-0 bottom-0 rounded-full bg-black/20 hover:bg-black/40 active:bg-black/60 transition-colors cursor-default"
                        style={{
                            left: ((universe.viewMinX - universe.minX) / universe.width) * viewportSize.width,
                            width: Math.max(MIN_THUMB_SIZE, (universe.viewWidth / universe.width) * viewportSize.width),
                        }}
                        onMouseDown={(e) => handleMouseDown('horizontal', e)}
                    />
                </div>
            </div>

            {/* Vertical Scrollbar */}
            <div
                className={`absolute top-0 bottom-0 right-0 z-50 flex flex-col justify-center transition-opacity duration-150 ease-out ${showVertical ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                style={{ width: SCROLLBAR_THICKNESS }}
            >
                <div
                    className="relative h-full w-full bg-transparent hover:bg-black/5 transition-colors"
                    style={{ width: SCROLLBAR_THICKNESS }}
                >
                    <div
                        className="absolute left-0 right-0 rounded-full bg-black/20 hover:bg-black/40 active:bg-black/60 transition-colors cursor-default"
                        style={{
                            top: ((universe.viewMinY - universe.minY) / universe.height) * viewportSize.height,
                            height: Math.max(MIN_THUMB_SIZE, (universe.viewHeight / universe.height) * viewportSize.height),
                        }}
                        onMouseDown={(e) => handleMouseDown('vertical', e)}
                    />
                </div>
            </div>
        </>
    );
}

