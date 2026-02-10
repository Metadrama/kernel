/**
 * DirectComponent - Refactored to use extracted hooks
 * 
 * Wraps individual components with:
 * - Drag and resize behavior (via useComponentInteraction hook)
 * - Selection UI
 * - Context menu
 * - Component rendering
 */

import { memo, useState } from 'react';
import { cn } from '@/modules/DesignSystem/lib/utils';
import type { ArtboardComponent } from '@/modules/Artboard/types/artboard';
import type { ComponentBounds, AlignmentGuide } from '@/modules/Artboard/lib/alignment-helpers';
import { useComponentInteraction } from '@/modules/Artboard/hooks/useComponentInteraction';
import { ResizeHandles } from './ResizeHandles';
import { ComponentContextMenu, type ComponentContextMenuActions } from '@/modules/Dashboard/components/ComponentContextMenu';
import { COMPONENT_REGISTRY } from '@/modules/Widgets';

/**
 * Memoized component content — prevents chart/widget re-renders during drag/resize.
 * Only re-renders when config or componentType actually change.
 */
const MemoizedComponentContent = memo(function MemoizedComponentContent({
    componentType,
    config,
    onConfigChange,
    onDimensionsChange,
}: {
    componentType: string;
    config: Record<string, unknown>;
    onConfigChange?: (config: Record<string, unknown>) => void;
    onDimensionsChange?: (dims: { width?: number; height?: number }) => void;
}) {
    const Component = COMPONENT_REGISTRY[componentType];
    if (!Component) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-xs">
                Unknown: {componentType}
            </div>
        );
    }
    return <Component config={config} onConfigChange={onConfigChange} onDimensionsChange={onDimensionsChange} />;
});

interface DirectComponentProps {
    component: ArtboardComponent;
    isSelected: boolean;
    scale: number;
    scaleWithZoom: boolean;
    siblingBounds?: ComponentBounds[];
    onGuidesChange?: (guides: AlignmentGuide[]) => void;
    onSelect: () => void;
    onPositionChange: (position: { x: number; y: number; width: number; height: number }) => void;
    onLivePositionChange?: (position: { x: number; y: number; width: number; height: number } | null) => void;
    onConfigChange?: (config: Record<string, unknown>) => void;
    onDelete: () => void;
    onZOrderChange?: (operation: 'front' | 'forward' | 'back' | 'backward') => void;
    // Context menu actions passed from parent
    onCopy?: () => void;
    onPaste?: () => void;
    onToggleVisibility?: () => void;
    onToggleLock?: () => void;
    onFlipHorizontal?: () => void;
    onFlipVertical?: () => void;
    hasClipboard?: boolean;
}

export function DirectComponent({
    component,
    isSelected,
    scale,
    scaleWithZoom,
    siblingBounds,
    onGuidesChange,
    onSelect,
    onPositionChange,
    onLivePositionChange,
    onConfigChange,
    onDelete,
    onZOrderChange,
    onCopy,
    onPaste,
    onToggleVisibility,
    onToggleLock,
    onFlipHorizontal,
    onFlipVertical,
    hasClipboard,
}: DirectComponentProps) {
    const { position, componentType, locked, hidden, flipX, flipY } = component;

    // Hidden components are invisible but still occupy space in the DOM
    if (hidden && !isSelected) return null;

    // Use extracted interaction hook for drag & resize
    const { isDragging, isResizing, displayRect, handleMouseDown, handleResizeStart } = useComponentInteraction({
        position,
        componentType,
        componentId: component.instanceId,
        locked: !!locked,
        scale,
        siblingBounds,
        onSelect,
        onPositionChange,
        onLivePositionChange,
        onGuidesChange,
    });

    // Hover state for micro-interactions
    const [isHovered, setIsHovered] = useState(false);

    // Counter-scale to keep components at true pixel size when scaleWithZoom is false
    const inverseScale = scaleWithZoom ? 1 : (scale === 0 ? 1 : 1 / scale);

    // Handle auto-resize requests from components (like text)
    const handleDimensionsChange = (dims: { width?: number; height?: number }) => {
        onPositionChange({
            ...position,
            ...dims,
        });
    };

    // Build the flip transform for the content
    const flipTransform = [
        flipX ? 'scaleX(-1)' : '',
        flipY ? 'scaleY(-1)' : '',
    ].filter(Boolean).join(' ');

    const safeWidth = Math.max(1, displayRect.width);
    const safeHeight = Math.max(1, displayRect.height);

    return (
        <ComponentContextMenu
            onZOrderChange={onZOrderChange}
            onDelete={onDelete}
            onCopy={onCopy}
            onPaste={onPaste}
            onToggleVisibility={onToggleVisibility}
            onToggleLock={onToggleLock}
            onFlipHorizontal={onFlipHorizontal}
            onFlipVertical={onFlipVertical}
            isLocked={!!locked}
            isHidden={!!hidden}
            hasClipboard={hasClipboard}
        >
            <div
                data-component-id={component.instanceId}
                className={cn(
                    'absolute select-none',
                    'transition-all duration-150 ease-out',
                    isDragging && 'cursor-grabbing',
                    !isDragging && !locked && 'cursor-move',
                    locked && 'cursor-not-allowed opacity-60',
                    // Micro-interaction: subtle lift on hover (non-selected)
                    !isSelected && isHovered && !isDragging && !isResizing && 'ring-1 ring-primary/20'
                )}
                style={{
                    left: displayRect.x,
                    top: displayRect.y,
                    width: safeWidth,
                    height: safeHeight,
                    zIndex: position.zIndex,
                    pointerEvents: 'auto',
                    // Micro-interaction: shadow lift on drag
                    boxShadow: isDragging
                        ? '0 20px 40px -10px rgba(0,0,0,0.15), 0 8px 16px -8px rgba(0,0,0,0.1)'
                        : isHovered && !isSelected
                            ? '0 4px 12px -2px rgba(0,0,0,0.08)'
                            : undefined,
                    // Micro-interaction: rotation + flip (removed scale on drag to assist alignment)
                    transform: position.rotation ? `rotate(${position.rotation}deg)` : undefined,
                    transformOrigin: 'center center',
                    transition: isDragging || isResizing
                        ? 'box-shadow 0.15s ease-out'
                        : 'box-shadow 0.2s ease-out, ring 0.15s ease-out, transform 0.15s ease-out',
                }}
                onMouseDown={handleMouseDown}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Selection border with micro-interaction */}
                <div
                    className={cn(
                        'pointer-events-none absolute inset-0 border-2 border-primary',
                        'transition-all duration-150 ease-out',
                        isSelected ? 'opacity-100' : 'opacity-0 scale-[0.98]'
                    )}
                    style={{
                        transform: `scale(${inverseScale})`,
                        transformOrigin: 'top left',
                        width: `${safeWidth / inverseScale}px`,
                        height: `${safeHeight / inverseScale}px`,
                    }}
                />

                {/* Resize handles */}
                <ResizeHandles isSelected={isSelected} inverseScale={inverseScale} onResizeStart={handleResizeStart} />

                {/* Component content (counter-scaled + flip) */}
                <div
                    className={cn('absolute inset-0 overflow-hidden', hidden && 'opacity-30')}
                    style={{
                        transform: `scale(${inverseScale}) ${flipTransform}`.trim(),
                        transformOrigin: 'top left',
                        width: `${safeWidth / inverseScale}px`,
                        height: `${safeHeight / inverseScale}px`,
                        pointerEvents: locked ? 'none' : 'auto',
                    }}
                >
                    <MemoizedComponentContent
                        componentType={componentType}
                        config={component.config as Record<string, unknown>}
                        onConfigChange={onConfigChange}
                        onDimensionsChange={handleDimensionsChange}
                    />
                </div>
            </div>
        </ComponentContextMenu>
    );
}




