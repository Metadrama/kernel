import type { ResizeHandle } from '@/features/artboard/hooks/useComponentInteraction';

interface ResizeHandlesProps {
    isSelected: boolean;
    inverseScale: number;
    onResizeStart: (e: React.MouseEvent, handle: ResizeHandle) => void;
}

export function ResizeHandles({ isSelected, inverseScale, onResizeStart }: ResizeHandlesProps) {
    if (!isSelected) return null;

    const handles: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

    const getHandleStyle = (handle: ResizeHandle): React.CSSProperties => {
        const handleSize = 8 * inverseScale;
        const offset = -handleSize / 2;

        const positions: Record<ResizeHandle, React.CSSProperties> = {
            nw: { top: offset, left: offset, cursor: 'nwse-resize' },
            n: { top: offset, left: '50%', marginLeft: offset, cursor: 'ns-resize' },
            ne: { top: offset, right: offset, cursor: 'nesw-resize' },
            e: { top: '50%', right: offset, marginTop: offset, cursor: 'ew-resize' },
            se: { bottom: offset, right: offset, cursor: 'nwse-resize' },
            s: { bottom: offset, left: '50%', marginLeft: offset, cursor: 'ns-resize' },
            sw: { bottom: offset, left: offset, cursor: 'nesw-resize' },
            w: { top: '50%', left: offset, marginTop: offset, cursor: 'ew-resize' },
        };

        return {
            ...positions[handle],
            width: handleSize,
            height: handleSize,
        };
    };

    // Corner handles are more prominent
    const isCorner = (handle: ResizeHandle) => ['nw', 'ne', 'se', 'sw'].includes(handle);

    return (
        <>
            {handles.map((handle) => (
                <div
                    key={handle}
                    className={`
                        resize-handle absolute z-20 rounded-full border-2 border-primary bg-background
                        transition-all duration-150 ease-out
                        hover:scale-125 hover:border-primary hover:bg-primary hover:shadow-md
                        active:scale-110 active:bg-primary/80
                        ${isCorner(handle) ? 'opacity-100' : 'opacity-70 hover:opacity-100'}
                    `}
                    style={getHandleStyle(handle)}
                    onMouseDown={(e) => onResizeStart(e, handle)}
                />
            ))}
        </>
    );
}

