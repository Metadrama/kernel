/**
 * ArtboardContainer - Simplified Figma-style artboard
 * 
 * Clean rebuild without GridStack:
 * - Renders components directly with absolute positioning
 * - Uses DirectComponent for drag/resize
 * - Supports component drops from sidebar
 * - Artboard drag with header
 */

import { useRef, useState, useCallback } from 'react';
import { Trash2, Lock, Unlock, MoreVertical, Copy, Settings, FileJson, FileType } from 'lucide-react';
import { DirectComponent } from '@/components/DirectComponent';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useArtboardDrag } from '@/hooks';
import type { ArtboardSchema } from '@/types/artboard';
import type { ArtboardComponent, ComponentCard } from '@/types/dashboard';
import { exportArtboardToJson, exportArtboardToPdf } from '@/lib/artboard-utils';
import { getDefaultSize } from '@/lib/component-sizes';

interface ArtboardContainerProps {
    artboard: ArtboardSchema;
    isSelected: boolean;
    canvasScale: number;
    zIndex: number;
    onUpdate: (artboardId: string, updates: Partial<ArtboardSchema>) => void;
    onDelete: (artboardId: string) => void;
    onSelect: () => void;
    selectedComponentId?: string;
    onSelectComponent?: (componentId: string) => void;
    onDeselectComponent?: () => void;
}

export default function ArtboardContainer({
    artboard,
    isSelected,
    canvasScale,
    zIndex,
    onUpdate,
    onDelete,
    onSelect,
    selectedComponentId,
    onSelectComponent,
    onDeselectComponent,
}: ArtboardContainerProps) {
    const HEADER_HEIGHT_PX = 52;
    const HEADER_GAP_PX = 8;
    const HEADER_OFFSET_PX = HEADER_HEIGHT_PX + HEADER_GAP_PX;

    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [contextMenuOpen, setContextMenuOpen] = useState(false);

    // Artboard dragging
    const { isDragging, displayPosition, handleMouseDown: handleArtboardMouseDown } = useArtboardDrag({
        position: artboard.position,
        canvasScale,
        locked: artboard.locked,
        onPositionChange: (pos) => onUpdate(artboard.id, { position: pos }),
        onSelect,
    });

    // Click on artboard background to deselect components
    const handleArtboardClick = useCallback((e: React.MouseEvent) => {
        if (e.target === containerRef.current || e.target === e.currentTarget) {
            onDeselectComponent?.();
            onSelect();
        }
    }, [onSelect, onDeselectComponent]);

    // Component operations
    const addComponent = useCallback((componentType: string, position: { x: number; y: number }) => {
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
    }, [artboard.components, artboard.id, onUpdate]);

    const updateComponentPosition = useCallback((instanceId: string, position: { x: number; y: number; width: number; height: number }) => {
        const updatedComponents = artboard.components.map((c) =>
            c.instanceId === instanceId
                ? { ...c, position: { ...c.position, ...position } }
                : c
        );
        onUpdate(artboard.id, { components: updatedComponents });
    }, [artboard.components, artboard.id, onUpdate]);

    const deleteComponent = useCallback((instanceId: string) => {
        const updatedComponents = artboard.components.filter((c) => c.instanceId !== instanceId);
        onUpdate(artboard.id, { components: updatedComponents });
    }, [artboard.components, artboard.id, onUpdate]);

    const updateComponentZOrder = useCallback((instanceId: string, operation: 'front' | 'forward' | 'back' | 'backward') => {
        const component = artboard.components.find((c) => c.instanceId === instanceId);
        if (!component) return;

        const currentZ = component.position.zIndex;
        const maxZ = Math.max(...artboard.components.map((c) => c.position.zIndex));

        let newZ = currentZ;
        switch (operation) {
            case 'front':
                newZ = maxZ + 1;
                break;
            case 'forward':
                newZ = currentZ + 1;
                break;
            case 'back':
                newZ = 0;
                break;
            case 'backward':
                newZ = Math.max(0, currentZ - 1);
                break;
        }

        const updatedComponents = artboard.components.map((c) => {
            if (c.instanceId === instanceId) {
                return { ...c, position: { ...c.position, zIndex: newZ } };
            }
            // Shift others if needed
            if (operation === 'back' && c.position.zIndex >= 0) {
                return { ...c, position: { ...c.position, zIndex: c.position.zIndex + 1 } };
            }
            return c;
        });

        onUpdate(artboard.id, { components: updatedComponents });
    }, [artboard.components, artboard.id, onUpdate]);

    // Drag & Drop from sidebar
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        try {
            const componentData = JSON.parse(e.dataTransfer.getData('application/json')) as ComponentCard;
            if (!componentData?.id) return;

            // Calculate drop position relative to artboard
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;

            const x = (e.clientX - rect.left) / canvasScale;
            const y = (e.clientY - rect.top) / canvasScale;

            addComponent(componentData.id, { x, y });
        } catch (error) {
            console.error('Failed to parse dropped component:', error);
        }
    };

    if (!artboard.visible) return null;

    return (
        <>
            {/* Counter-Scaled Header */}
            <div
                className="artboard-header group absolute flex h-13 items-center justify-between px-0.5 cursor-move"
                style={{
                    left: displayPosition.x,
                    top: displayPosition.y - HEADER_OFFSET_PX / canvasScale,
                    transform: `scale(${1 / canvasScale})`,
                    transformOrigin: 'top left',
                    width: `${artboard.dimensions.widthPx * canvasScale}px`,
                    zIndex: zIndex + 1000,
                    pointerEvents: 'auto',
                    transition: isDragging ? 'none' : undefined,
                    background: 'transparent',
                }}
                onMouseDown={handleArtboardMouseDown}
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-semibold truncate">{artboard.name}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {artboard.dimensions.label}
                    </span>
                    {artboard.locked && <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                </div>

                <div className="flex items-center gap-1">
                    <DropdownMenu open={contextMenuOpen} onOpenChange={setContextMenuOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreVertical className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => exportArtboardToJson(artboard)}>
                                <FileJson className="mr-2 h-4 w-4" />
                                Export JSON
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => exportArtboardToPdf(artboard)}>
                                <FileType className="mr-2 h-4 w-4" />
                                Export PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onUpdate(artboard.id, { locked: !artboard.locked })}>
                                {artboard.locked ? (
                                    <>
                                        <Unlock className="mr-2 h-4 w-4" />
                                        Unlock
                                    </>
                                ) : (
                                    <>
                                        <Lock className="mr-2 h-4 w-4" />
                                        Lock Position
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDelete(artboard.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Artboard
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Artboard Container */}
            <div
                ref={containerRef}
                data-artboard-id={artboard.id}
                className={`absolute ${isDragging ? 'cursor-grabbing' : ''}`}
                style={{
                    left: displayPosition.x,
                    top: displayPosition.y,
                    width: artboard.dimensions.widthPx,
                    height: artboard.dimensions.heightPx,
                    zIndex: zIndex,
                    transition: isDragging ? 'none' : undefined,
                }}
                onClick={handleArtboardClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Background */}
                <div
                    className={`absolute inset-0 shadow-2xl ${isSelected ? 'ring-2 ring-primary/30' : 'ring-1 ring-border'
                        }`}
                    style={{
                        backgroundColor: artboard.backgroundColor,
                    }}
                />

                {/* Grid guides (optional) */}
                {artboard.showGrid && (
                    <div
                        className="absolute inset-0 pointer-events-none opacity-[0.03]"
                        style={{
                            backgroundImage: `
                linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
              `,
                            backgroundSize: '24px 24px',
                        }}
                    />
                )}

                {/* Drop zone indicator */}
                {isDragOver && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/5 backdrop-blur-sm pointer-events-none">
                        <div className="rounded-lg border-2 border-dashed border-primary bg-background/90 px-6 py-4">
                            <p className="text-sm font-semibold text-primary">Drop to add component</p>
                        </div>
                    </div>
                )}

                {/* Components Layer */}
                <div className="absolute inset-0" style={{ pointerEvents: 'auto' }}>
                    {artboard.components.map((component) => (
                        <DirectComponent
                            key={component.instanceId}
                            component={component}
                            isSelected={selectedComponentId === component.instanceId}
                            scale={canvasScale}
                            onSelect={() => {
                                onSelectComponent?.(component.instanceId);
                                onSelect();
                            }}
                            onPositionChange={(pos) => updateComponentPosition(component.instanceId, pos)}
                            onDelete={() => deleteComponent(component.instanceId)}
                            onZOrderChange={(op) => updateComponentZOrder(component.instanceId, op)}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}
