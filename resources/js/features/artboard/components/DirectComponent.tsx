/**
 * DirectComponent - Refactored to use extracted hooks
 * 
 * Wraps individual components with:
 * - Drag and resize behavior (via useComponentInteraction hook)
 * - Selection UI
 * - Context menu
 * - Component rendering
 */

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
        onGuidesChange,
    });

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
                    isDragging && 'cursor-grabbing',
                    !isDragging && !locked && 'cursor-move',
                    locked && 'cursor-not-allowed opacity-60'
                )}
                style={{
                    left: displayRect.x,
                    top: displayRect.y,
                    width: displayRect.width,
                    height: displayRect.height,
                    zIndex: position.zIndex,
                    pointerEvents: 'auto',
                    transition: isDragging || isResizing ? 'none' : undefined,
                }}
                onMouseDown={handleMouseDown}
            >
                {/* Selection border */}
                {isSelected && (
                    <div
                        className="pointer-events-none absolute inset-0 border-2 border-primary"
                        style={{
                            transform: `scale(${inverseScale})`,
                            transformOrigin: 'top left',
                            width: `${displayRect.width / inverseScale}px`,
                            height: `${displayRect.height / inverseScale}px`,
                        }}
                    />
                )}

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




