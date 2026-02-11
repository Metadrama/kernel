/**
 * ArtboardContainer - Refactored to use extracted hooks and components
 */

import { DirectComponent } from '@/modules/Artboard/components/DirectComponent';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '@/modules/DesignSystem/ui/context-menu';
import { useDraggedComponentRef } from '@/modules/Artboard/context/DragDropContext';
import { useArtboardDrag } from '@/modules/Artboard/hooks/useArtboardDrag';
import { useDragDropHandler } from '@/modules/Artboard/hooks/useDragDropHandler';
import { getDefaultSize } from '@/modules/Artboard/lib/component-sizes';
import type { Artboard, ArtboardComponent } from '@/modules/Artboard/types/artboard';
import { Lock, Trash2, Unlock } from 'lucide-react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import AlignmentGuidesOverlay from './AlignmentGuidesOverlay';
import { ArtboardHeader } from './ArtboardHeader';

interface ArtboardContainerProps {
    artboard: Artboard;
    isSelected: boolean;
    canvasScale: number;
    scaleWithZoom: boolean;
    zIndex: number;
    onUpdate: (artboardId: string, updates: Partial<Artboard>) => void;
    onDelete: (artboardId: string) => void;
    onSelect: () => void;
    selectedComponentId?: string;
    onSelectComponent?: (componentId: string) => void;
    onDeselectComponent?: () => void;
    onLivePositionChange?: (data: { componentId: string; position: { x: number; y: number; width: number; height: number } } | null) => void;
    // Context menu clipboard actions (lifted to ArtboardCanvas)
    onCopyComponent?: (componentId: string) => void;
    onPasteComponent?: (artboardId: string) => void;
    hasClipboard?: boolean;
}

function ArtboardContainer({
    artboard,
    isSelected,
    canvasScale,
    scaleWithZoom,
    zIndex,
    onUpdate,
    onDelete,
    onSelect,
    selectedComponentId,
    onSelectComponent,
    onDeselectComponent,
    onLivePositionChange,
    onCopyComponent,
    onPasteComponent,
    hasClipboard,
}: ArtboardContainerProps) {
    const HEADER_HEIGHT_PX = 52;
    const HEADER_GAP_PX = 8;
    const HEADER_OFFSET_PX = HEADER_HEIGHT_PX + HEADER_GAP_PX;

    const containerRef = useRef<HTMLDivElement>(null);
    const getDragged = useDraggedComponentRef();
    const [isHovered, setIsHovered] = useState(false);

    const siblingBounds = useMemo(
        () =>
            artboard.components.map((c) => ({
                id: c.instanceId,
                x: c.position.x,
                y: c.position.y,
                width: c.position.width,
                height: c.position.height,
            })),
        [artboard.components]
    );

    // Artboard dragging
    const { isDragging, displayPosition, handleMouseDown: handleArtboardMouseDown } = useArtboardDrag({
        position: artboard.position,
        canvasScale,
        locked: artboard.locked,
        onPositionChange: (pos) => onUpdate(artboard.id, { position: pos }),
        onSelect,
    });

    // Component operations
    const addComponent = useCallback(
        (componentType: string, position: { x: number; y: number }) => {
            const defaultSize = getDefaultSize(componentType);

            const newComponent: ArtboardComponent = {
                instanceId: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                componentType,
                position: {
                    x: position.x,
                    y: position.y,
                    width: defaultSize.width,
                    height: defaultSize.height,
                    zIndex: artboard.components.length,
                },
                config: {},
            };

            const updatedComponents = [...artboard.components, newComponent];
            onUpdate(artboard.id, { components: updatedComponents });
        },
        [artboard.components, artboard.id, onUpdate]
    );

    const updateComponentPosition = useCallback(
        (instanceId: string, position: { x: number; y: number; width: number; height: number }) => {
            const updatedComponents = artboard.components.map((c) =>
                c.instanceId === instanceId ? { ...c, position: { ...c.position, ...position } } : c
            );
            onUpdate(artboard.id, { components: updatedComponents });
        },
        [artboard.components, artboard.id, onUpdate]
    );

    const updateComponentConfig = useCallback(
        (instanceId: string, config: Record<string, unknown>) => {
            const updatedComponents = artboard.components.map((c) => (c.instanceId === instanceId ? { ...c, config } : c));
            onUpdate(artboard.id, { components: updatedComponents });
        },
        [artboard.components, artboard.id, onUpdate]
    );

    const deleteComponent = useCallback(
        (instanceId: string) => {
            const updatedComponents = artboard.components.filter((c) => c.instanceId !== instanceId);
            onUpdate(artboard.id, { components: updatedComponents });
        },
        [artboard.components, artboard.id, onUpdate]
    );

    const updateComponentZOrder = useCallback(
        (instanceId: string, operation: 'front' | 'forward' | 'back' | 'backward') => {
            const currentComponents = [...artboard.components];
            const sortedComponents = [...currentComponents].sort((a, b) => a.position.zIndex - b.position.zIndex);
            const currentZIndex = sortedComponents.findIndex((c) => c.instanceId === instanceId);

            if (currentZIndex === -1) return;

            let newZIndex = currentZIndex;
            if (operation === 'front') newZIndex = sortedComponents.length - 1;
            else if (operation === 'back') newZIndex = 0;
            else if (operation === 'forward') newZIndex = Math.min(sortedComponents.length - 1, currentZIndex + 1);
            else if (operation === 'backward') newZIndex = Math.max(0, currentZIndex - 1);

            if (newZIndex === currentZIndex) return;

            const [movedComponent] = sortedComponents.splice(currentZIndex, 1);
            sortedComponents.splice(newZIndex, 0, movedComponent);

            const updatedComponents = currentComponents.map((c) => {
                const newIndex = sortedComponents.findIndex((sc) => sc.instanceId === c.instanceId);
                return {
                    ...c,
                    position: { ...c.position, zIndex: newIndex },
                };
            });

            onUpdate(artboard.id, { components: updatedComponents });
        },
        [artboard.components, artboard.id, onUpdate]
    );

    // Toggle component visibility
    const toggleComponentVisibility = useCallback(
        (instanceId: string) => {
            const updatedComponents = artboard.components.map((c) =>
                c.instanceId === instanceId ? { ...c, hidden: !c.hidden } : c
            );
            onUpdate(artboard.id, { components: updatedComponents });
        },
        [artboard.components, artboard.id, onUpdate]
    );

    // Toggle component lock
    const toggleComponentLock = useCallback(
        (instanceId: string) => {
            const updatedComponents = artboard.components.map((c) =>
                c.instanceId === instanceId ? { ...c, locked: !c.locked } : c
            );
            onUpdate(artboard.id, { components: updatedComponents });
        },
        [artboard.components, artboard.id, onUpdate]
    );

    // Flip component
    const flipComponent = useCallback(
        (instanceId: string, axis: 'x' | 'y') => {
            const updatedComponents = artboard.components.map((c) =>
                c.instanceId === instanceId
                    ? { ...c, [axis === 'x' ? 'flipX' : 'flipY']: !(axis === 'x' ? c.flipX : c.flipY) }
                    : c
            );
            onUpdate(artboard.id, { components: updatedComponents });
        },
        [artboard.components, artboard.id, onUpdate]
    );

    // Live position during drag/resize for internal alignment guides
    const [internalGuides, setInternalGuides] = useState<AlignmentGuide[]>([]);

    // Drag & drop from sidebar
    const { dropPreview, activeGuides, handleDragOver, handleDragLeave, handleDrop } = useDragDropHandler({
        canvasScale,
        siblingBounds,
        containerRef,
        getDragged,
        onComponentAdd: addComponent,
    });

    // Click on artboard background to deselect components
    const handleArtboardClick = useCallback(
        (e: React.MouseEvent) => {
            const target = e.target as HTMLElement;
            const isOnComponent = target.closest('[data-component-id]');
            if (!isOnComponent) {
                onDeselectComponent?.();
                onSelect();
            }
        },
        [onSelect, onDeselectComponent]
    );

    if (!artboard.visible) return null;

    return (
        <>
            {/* Artboard Header */}
            <ArtboardHeader
                artboard={artboard}
                canvasScale={canvasScale}
                displayPosition={displayPosition}
                zIndex={zIndex}
                isDragging={isDragging}
                headerOffset={HEADER_OFFSET_PX}
                onMouseDown={handleArtboardMouseDown}
                onUpdate={(updates) => onUpdate(artboard.id, updates)}
                onDelete={() => onDelete(artboard.id)}
            />

            {/* Artboard Container */}
            <ContextMenu>
                <ContextMenuTrigger asChild>
                    <div
                        ref={containerRef}
                        data-artboard-id={artboard.id}
                        className={`absolute transition-shadow duration-200 ease-out ${isDragging ? 'cursor-grabbing' : ''}`}
                        style={{
                            left: displayPosition.x,
                            top: displayPosition.y,
                            width: artboard.dimensions.widthPx,
                            height: artboard.dimensions.heightPx,
                            zIndex: zIndex,
                            transition: isDragging ? 'none' : 'box-shadow 0.2s ease-out',
                        }}
                        onClick={handleArtboardClick}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {/* Background with hover/selection micro-interactions */}
                        <div
                            className={`
                                absolute inset-0 shadow-2xl transition-all duration-200 ease-out
                                ${isSelected ? 'ring-2 ring-primary/40' : isHovered ? 'ring-1 ring-primary/20' : 'ring-1 ring-border'}
                            `}
                            style={{
                                backgroundColor: artboard.backgroundColor,
                                boxShadow: isHovered && !isSelected
                                    ? '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
                                    : undefined,
                            }}
                        />

                        {/* Grid guides */}
                        {artboard.showGrid && (
                            <div
                                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                                style={{
                                    backgroundImage: `
                    linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
                    linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
                  `,
                                    backgroundSize: '8px 8px',
                                }}
                            />
                        )}

                        {/* Components Layer */}
                        <div
                            className="absolute inset-0"
                            style={{
                                pointerEvents: 'auto',
                                overflow: artboard.clipContent ? 'hidden' : 'visible',
                            }}
                        >
                            <AlignmentGuidesOverlay guides={internalGuides.length > 0 ? internalGuides : activeGuides} components={siblingBounds} />

                            {/* Live drop preview */}
                            {dropPreview && (
                                <div
                                    className="pointer-events-none absolute border-2 border-dashed border-primary/60 bg-primary/10"
                                    style={{
                                        left: dropPreview.position.x,
                                        top: dropPreview.position.y,
                                        width: dropPreview.size.width,
                                        height: dropPreview.size.height,
                                        zIndex: 9999,
                                    }}
                                >
                                    <div className="absolute top-1 left-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                        {dropPreview.componentType}
                                        {dropPreview.bypassSnap ? ' (no snap)' : ''}
                                    </div>
                                </div>
                            )}

                            {artboard.components.map((component) => (
                                <DirectComponent
                                    key={component.instanceId}
                                    component={component}
                                    isSelected={selectedComponentId === component.instanceId}
                                    scale={canvasScale}
                                    scaleWithZoom={scaleWithZoom}
                                    siblingBounds={siblingBounds}
                                    onGuidesChange={setInternalGuides}
                                    onSelect={() => {
                                        onSelectComponent?.(component.instanceId);
                                    }}
                                    onPositionChange={(pos) => updateComponentPosition(component.instanceId, pos)}
                                    onLivePositionChange={(pos) => {
                                        if (pos) {
                                            onLivePositionChange?.({ componentId: component.instanceId, position: pos });
                                        } else {
                                            onLivePositionChange?.(null);
                                        }
                                    }}
                                    onConfigChange={(config) => updateComponentConfig(component.instanceId, config)}
                                    onDelete={() => deleteComponent(component.instanceId)}
                                    onZOrderChange={(op) => updateComponentZOrder(component.instanceId, op)}
                                    onCopy={() => onCopyComponent?.(component.instanceId)}
                                    onPaste={() => onPasteComponent?.(artboard.id)}
                                    onToggleVisibility={() => toggleComponentVisibility(component.instanceId)}
                                    onToggleLock={() => toggleComponentLock(component.instanceId)}
                                    onFlipHorizontal={() => flipComponent(component.instanceId, 'x')}
                                    onFlipVertical={() => flipComponent(component.instanceId, 'y')}
                                    hasClipboard={hasClipboard}
                                />
                            ))}
                        </div>
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-48">
                    <ContextMenuItem onClick={() => onUpdate(artboard.id, { locked: !artboard.locked })}>
                        {artboard.locked ? (
                            <>
                                <Unlock className="mr-2 h-4 w-4" />
                                Unlock Artboard
                            </>
                        ) : (
                            <>
                                <Lock className="mr-2 h-4 w-4" />
                                Lock Artboard
                            </>
                        )}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem variant="destructive" onClick={() => onDelete(artboard.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Artboard
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>
        </>
    );
}

export default memo(ArtboardContainer);





