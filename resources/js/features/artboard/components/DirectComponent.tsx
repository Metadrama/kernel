/**
 * DirectComponent - Refactored to use extracted hooks
 * 
 * Wraps individual components with:
 * - Drag and resize behavior (via useComponentInteraction hook)
 * - Selection UI
 * - Context menu
 * - Component rendering
 */

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import type { ArtboardComponent } from '@/features/dashboard/types/dashboard';
import type { ComponentBounds, AlignmentGuide } from '@/features/artboard/lib/alignment-helpers';
import { useComponentInteraction } from '@/features/artboard/hooks/useComponentInteraction';
import { ResizeHandles } from '@/shared/components/ResizeHandles';
import { ComponentContextMenu } from '@/shared/components/ComponentContextMenu';
import { COMPONENT_REGISTRY } from '@/features/widgets';

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
}: DirectComponentProps) {
    const { position, componentType, locked } = component;

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

    // Render the component content
    const renderComponent = () => {
        try {
            const Component = COMPONENT_REGISTRY[componentType];
            if (!Component) {
                return (
                    <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-xs">
                        Unknown: {componentType}
                    </div>
                );
            }
            return <Component config={component.config} onConfigChange={onConfigChange} />;
        } catch (error) {
            console.error(`Failed to render component ${componentType}:`, error);
            return (
                <div className="flex h-full w-full items-center justify-center bg-destructive/10 text-destructive text-xs">
                    Error: {componentType}
                </div>
            );
        }
    };

    return (
        <ComponentContextMenu onZOrderChange={onZOrderChange} onDelete={onDelete}>
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
                    width: displayRect.width,
                    height: displayRect.height,
                    zIndex: position.zIndex,
                    pointerEvents: 'auto',
                    // Micro-interaction: shadow lift on drag
                    boxShadow: isDragging
                        ? '0 20px 40px -10px rgba(0,0,0,0.15), 0 8px 16px -8px rgba(0,0,0,0.1)'
                        : isHovered && !isSelected
                            ? '0 4px 12px -2px rgba(0,0,0,0.08)'
                            : undefined,
                    // Micro-interaction: scale on drag pickup + rotation
                    transform: [
                        position.rotation ? `rotate(${position.rotation}deg)` : '',
                        isDragging ? 'scale(1.02)' : '',
                    ].filter(Boolean).join(' ') || undefined,
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
                        width: `${displayRect.width / inverseScale}px`,
                        height: `${displayRect.height / inverseScale}px`,
                    }}
                />

                {/* Resize handles */}
                <ResizeHandles isSelected={isSelected} inverseScale={inverseScale} onResizeStart={handleResizeStart} />

                {/* Component content (counter-scaled) */}
                <div
                    className="absolute inset-0 overflow-hidden"
                    style={{
                        transform: `scale(${inverseScale})`,
                        transformOrigin: 'top left',
                        width: `${displayRect.width / inverseScale}px`,
                        height: `${displayRect.height / inverseScale}px`,
                        pointerEvents: locked ? 'none' : 'auto',
                    }}
                >
                    {renderComponent()}
                </div>
            </div>
        </ComponentContextMenu>
    );
}




