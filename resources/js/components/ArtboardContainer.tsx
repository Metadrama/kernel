/**
 * ArtboardContainer - Individual artboard with its own GridStack instance
 * 
 * Represents a single artboard with fixed dimensions based on its format.
 * Contains an isolated GridStack for managing widgets within the artboard.
 * Artboards can be positioned but NOT resized (dimensions are immutable).
 */

import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { GridStack } from 'gridstack';
import { Trash2, Lock, Unlock, Eye, EyeOff, MoreVertical, Copy, Settings } from 'lucide-react';
import 'gridstack/dist/gridstack.min.css';
import WidgetShell from '@/components/WidgetShell';
import { Button } from '@/components/ui/button';
import ArtboardSettingsDialog from '@/components/ArtboardSettingsDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ArtboardSchema } from '@/types/artboard';
import type { WidgetSchema, WidgetComponent, ComponentCard } from '@/types/dashboard';
import type { GridPosition } from '@/lib/component-layout';
import { calculateArtboardGridConfig } from '@/lib/artboard-utils';
import {
  GRID_FINE_GRAIN,
  downscaleGridUnits,
  upscaleGridUnits,
} from '@/lib/component-layout';

interface ArtboardContainerProps {
  artboard: ArtboardSchema;
  isSelected: boolean;
  canvasScale: number;

  zIndex: number;
  onUpdate: (artboardId: string, updates: Partial<ArtboardSchema>) => void;
  onDelete: (artboardId: string) => void;
  onSelect: () => void;
  onSelectComponent: (artboardId: string, widgetId: string, component: WidgetComponent) => void;
  selectedComponentId?: string;
  // Header state exposed for external rendering
  onHeaderAction?: (action: {
    type: 'menu' | 'addWidget';
    artboardId: string;
    menuOpen?: boolean;
    menuPosition?: { x: number; y: number };
  }) => void;
}

function ArtboardContainer({
  artboard,
  isSelected,
  canvasScale,

  zIndex,
  onUpdate,
  onDelete,
  onSelect,
  onSelectComponent,
  selectedComponentId,
}: ArtboardContainerProps) {
  const HEADER_HEIGHT_PX = 52; // matches tailwind h-13 (3.25rem @ 16px)
  const HEADER_GAP_PX = 8;
  const HEADER_OFFSET_PX = HEADER_HEIGHT_PX + HEADER_GAP_PX;
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInstanceRef = useRef<GridStack | null>(null);
  const artboardRef = useRef<ArtboardSchema>(artboard);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localPosition, setLocalPosition] = useState<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; artboardX: number; artboardY: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const gridSettings = useMemo(() => calculateArtboardGridConfig(artboard.dimensions), [artboard.dimensions]);

  // Context menu state
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showSettings, setShowSettings] = useState(false);

  // Calculate display position (canvas space -> screen space)


  // ============================================================================
  // GridStack Initialization (per artboard)
  // ============================================================================

  useEffect(() => {
    artboardRef.current = artboard;
  }, [artboard]);

  useEffect(() => {
    if (!gridRef.current) return;

    const fineColumns = gridSettings.columns * GRID_FINE_GRAIN;
    const fineCellHeight = Math.max(16, Math.round(gridSettings.cellHeight / GRID_FINE_GRAIN));

    const grid = GridStack.init(
      {
        column: fineColumns,
        cellHeight: fineCellHeight,
        margin: gridSettings.margin,
        float: false,
        animate: true,
        minRow: 1,
        draggable: {
          handle: '.widget-drag-handle',
        },
        resizable: {
          handles: 'e, se, s, sw, w',
          autoHide: false,
        },
      },
      gridRef.current
    );

    gridInstanceRef.current = grid;

    // Listen for widget changes
    grid.on('change', (_event, items) => {
      if (!items || items.length === 0) return;

      const currentArtboard = artboardRef.current;
      const updatedWidgets = currentArtboard.widgets.map((widget) => {
        const updated = items.find((item) => (item.id ?? item.el?.id) === widget.id);
        if (!updated) return widget;

        const scaledX = downscaleGridUnits(updated.x ?? widget.x * GRID_FINE_GRAIN);
        const scaledY = downscaleGridUnits(updated.y ?? widget.y * GRID_FINE_GRAIN);
        const scaledW = Math.max(1, downscaleGridUnits(updated.w ?? widget.w * GRID_FINE_GRAIN));
        const scaledH = Math.max(1, downscaleGridUnits(updated.h ?? widget.h * GRID_FINE_GRAIN));

        return {
          ...widget,
          x: scaledX,
          y: scaledY,
          w: scaledW,
          h: scaledH,
        };
      });

      onUpdate(currentArtboard.id, { widgets: updatedWidgets });
    });

    return () => {
      grid.destroy(false);
      gridInstanceRef.current = null;
    };
  }, [artboard.id, gridSettings, onUpdate]);

  // ============================================================================
  // Artboard Positioning (Drag to Move) - Transform-Aware
  // ============================================================================



  const handleArtboardMouseDown = (e: React.MouseEvent) => {
    if (artboard.locked) return;

    // Only drag from header/title area, not from widgets
    if (
      e.target instanceof HTMLElement &&
      (e.target.classList.contains('artboard-header') ||
        e.target.closest('.artboard-header'))
    ) {
      e.stopPropagation();
      e.preventDefault();

      // Store drag start positions
      dragStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        artboardX: artboard.position.x,
        artboardY: artboard.position.y,
      };

      setIsDragging(true);
      setLocalPosition(artboard.position);
      onSelect();
    }
  };

  const handleArtboardMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current || artboard.locked) return;

      // Calculate movement in screen space
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;

      // Convert delta to canvas space (account for zoom)
      const canvasDeltaX = deltaX / canvasScale;
      const canvasDeltaY = deltaY / canvasScale;

      // Calculate new position in canvas space
      const newPosition = {
        x: dragStartRef.current.artboardX + canvasDeltaX,
        y: dragStartRef.current.artboardY + canvasDeltaY,
      };

      // Update local state for immediate visual feedback (no parent re-render)
      setLocalPosition(newPosition);
    },
    [isDragging, artboard.locked, canvasScale]
  );

  const handleArtboardMouseUp = useCallback(() => {
    if (isDragging && localPosition) {
      // Commit the final position to parent state
      onUpdate(artboard.id, { position: localPosition });
    }

    setIsDragging(false);
    setLocalPosition(null);
    dragStartRef.current = null;
  }, [isDragging, localPosition, artboard.id, onUpdate]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleArtboardMouseMove);
      window.addEventListener('mouseup', handleArtboardMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleArtboardMouseMove);
        window.removeEventListener('mouseup', handleArtboardMouseUp);
      };
    }
  }, [isDragging, handleArtboardMouseMove, handleArtboardMouseUp]);

  // ============================================================================
  // Widget Management
  // ============================================================================

  const addWidget = () => {
    const newWidget: WidgetSchema = {
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: 0,
      y: 0,
      w: 6,
      h: 5,
      components: [],
    };

    const updatedWidgets = [...artboard.widgets, newWidget];
    onUpdate(artboard.id, { widgets: updatedWidgets });

    // Add to GridStack
    setTimeout(() => {
      if (gridInstanceRef.current) {
        const element = document.getElementById(newWidget.id);
        if (element) {
          gridInstanceRef.current.makeWidget(element);
          gridInstanceRef.current.update(element, {
            minW: upscaleGridUnits(2),
            minH: upscaleGridUnits(2),
            maxW: gridSettings.columns * GRID_FINE_GRAIN,
          });
        }
      }
    }, 10);
  };

  const deleteWidget = (widgetId: string) => {
    const updatedWidgets = artboard.widgets.filter((w) => w.id !== widgetId);
    onUpdate(artboard.id, { widgets: updatedWidgets });

    // Remove from GridStack
    requestAnimationFrame(() => {
      if (gridInstanceRef.current) {
        const element = document.getElementById(widgetId);
        if (element) {
          try {
            gridInstanceRef.current.removeWidget(element, false);
          } catch (e) {
            console.debug('Widget already removed:', widgetId);
          }
        }
      }
    });
  };

  const handleAddComponentToWidget = (widgetId: string, component: ComponentCard) => {
    const newComponent: WidgetComponent = {
      instanceId: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      componentType: component.id,
      config: {
        name: component.name,
        description: component.description,
        icon: component.icon,
      },
    };

    const updatedWidgets = artboard.widgets.map((widget) =>
      widget.id === widgetId
        ? {
          ...widget,
          components: [...widget.components, newComponent],
        }
        : widget
    );

    onUpdate(artboard.id, { widgets: updatedWidgets });
  };

  const handleRemoveComponentFromWidget = (widgetId: string, instanceId: string) => {
    const updatedWidgets = artboard.widgets.map((widget) =>
      widget.id === widgetId
        ? {
          ...widget,
          components: widget.components.filter((c) => c.instanceId !== instanceId),
        }
        : widget
    );

    onUpdate(artboard.id, { widgets: updatedWidgets });
  };

  const handleReorderComponents = (widgetId: string, newComponents: WidgetComponent[]) => {
    const updatedWidgets = artboard.widgets.map((widget) =>
      widget.id === widgetId
        ? {
          ...widget,
          components: newComponents,
        }
        : widget
    );

    onUpdate(artboard.id, { widgets: updatedWidgets });
  };

  const handleUpdateComponentLayout = (
    widgetId: string,
    instanceId: string,
    gridPosition: GridPosition
  ) => {
    const updatedWidgets = artboard.widgets.map((widget) =>
      widget.id === widgetId
        ? {
          ...widget,
          components: widget.components.map((c) =>
            c.instanceId === instanceId ? { ...c, gridPosition } : c
          ),
        }
        : widget
    );

    onUpdate(artboard.id, { widgets: updatedWidgets });
  };

  // ============================================================================
  // Drag & Drop (Component from Sidebar)
  // ============================================================================

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

      const isEmptyWidgetTemplate = componentData.id === 'empty-widget';

      const newComponents: WidgetComponent[] = [];
      if (!isEmptyWidgetTemplate) {
        newComponents.push({
          instanceId: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          componentType: componentData.id,
          config: {
            name: componentData.name,
            description: componentData.description,
            icon: componentData.icon,
          },
        });
      }

      // Calculate widget size based on component intrinsics
      const intrinsicSize = (() => {
        try {
          const { getComponentIntrinsicSize } = require('@/lib/component-layout');
          return getComponentIntrinsicSize(componentData.id);
        } catch {
          return { defaultCols: 6, defaultRows: 4 };
        }
      })();

      const newWidget: WidgetSchema = {
        id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x: 0,
        y: 0,
        w: Math.max(3, Math.min(12, intrinsicSize.defaultCols)),
        h: Math.max(2, Math.min(8, intrinsicSize.defaultRows + 1)),
        components: newComponents,
      };

      const updatedWidgets = [...artboard.widgets, newWidget];
      onUpdate(artboard.id, { widgets: updatedWidgets });

      // Add to GridStack
      setTimeout(() => {
        if (gridInstanceRef.current) {
          const element = document.getElementById(newWidget.id);
          if (element) {
            gridInstanceRef.current.makeWidget(element);
            gridInstanceRef.current.update(element, {
              minW: 2,
              minH: 2,
              maxW: 12,
            });
          }
        }
      }, 10);
    } catch (error) {
      console.error('Failed to parse dropped component:', error);
    }
  };

  // ============================================================================
  // Context Menu (Right-Click)
  // ============================================================================

  const handleContextMenu = (e: React.MouseEvent) => {
    // Only show artboard menu if not right-clicking on widgets/GridStack content
    const target = e.target as HTMLElement;
    const isWidgetContent = target.closest('.grid-stack-item') || target.closest('.grid-stack');

    if (!isWidgetContent) {
      e.preventDefault();
      e.stopPropagation();

      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setContextMenuOpen(true);
      onSelect(); // Bring artboard to front
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (!artboard.visible) return null;

  // Use local position during drag for immediate feedback, otherwise use prop
  const displayPosition = isDragging && localPosition ? localPosition : artboard.position;

  return (
    <>
      {/* Counter-Scaled Header - transparent overlay above artboard */}
      <div
        className="artboard-header group absolute flex h-13 items-center justify-between px-0.5 cursor-move"
        style={{
          left: displayPosition.x,
          top: displayPosition.y - HEADER_OFFSET_PX / canvasScale,
          // Counter-scale to maintain constant size
          transform: `scale(${1 / canvasScale})`,
          transformOrigin: 'top left',
          width: `${artboard.dimensions.widthPx * canvasScale}px`,
          zIndex: zIndex + 1000, // Above artboard content
          pointerEvents: 'auto',
          transition: isDragging ? 'none' : undefined,
          background: 'transparent',
          backgroundColor: 'transparent',
        }}
        onMouseDown={handleArtboardMouseDown}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-semibold truncate">{artboard.name}</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
            {artboard.dimensions.label}
          </span>
          {artboard.locked && <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
        </div>

        <div className="flex items-center gap-1">
          {/* 3-dot menu - visible on hover (desktop) or always (mobile) */}
          <DropdownMenu
            open={contextMenuOpen}
            onOpenChange={setContextMenuOpen}
            cursorPosition={contextMenuOpen ? contextMenuPosition : null}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="artboard-menu-button h-7 w-7 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={addWidget}>
                Add Widget
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log('Duplicate artboard')}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowSettings(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onUpdate(artboard.id, { locked: !artboard.locked })}
              >
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
              <DropdownMenuItem
                onClick={() => onUpdate(artboard.id, { visible: false })}
              >
                <EyeOff className="mr-2 h-4 w-4" />
                Hide
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(artboard.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Artboard
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Artboard Container with background */}
      <div
        ref={containerRef}
        className={`absolute transition-all ${isDragging ? 'cursor-grabbing' : ''}`}
        style={{
          left: displayPosition.x,
          top: displayPosition.y,
          width: artboard.dimensions.widthPx,
          height: artboard.dimensions.heightPx,
          zIndex: zIndex, // Stack order from parent
          // Disable transitions during dragging for instant response
          transition: isDragging ? 'none' : undefined,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Background layer - starts below header with shadow and ring */}
        <div
          className={`absolute inset-0 shadow-2xl ${isSelected ? 'ring-2 ring-primary ring-offset-2' : 'ring-1 ring-border'}`}
          style={{
            backgroundColor: artboard.backgroundColor,
          }}
        />

        {/* Artboard Content Area */}
        <div
          className="absolute inset-0 overflow-auto"
          style={{
            pointerEvents: 'auto',
          }}
        >
          {/* Grid guides (if enabled) */}
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
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-primary/5 backdrop-blur-sm pointer-events-none">
              <div className="rounded-lg border-2 border-dashed border-primary bg-background/90 px-6 py-4">
                <p className="text-sm font-semibold text-primary">Drop to add component</p>
              </div>
            </div>
          )}

          {/* GridStack Container */}
          <div className="relative h-full p-4 overflow-auto">
            <div ref={gridRef} className="grid-stack">
              {artboard.widgets.map((widget) => (
                <div
                  key={widget.id}
                  id={widget.id}
                  className="grid-stack-item"
                  gs-id={widget.id}
                  gs-x={upscaleGridUnits(widget.x)}
                  gs-y={upscaleGridUnits(widget.y)}
                  gs-w={upscaleGridUnits(widget.w)}
                  gs-h={upscaleGridUnits(widget.h)}
                  gs-min-w={upscaleGridUnits(2)}
                  gs-min-h={upscaleGridUnits(2)}
                  gs-max-w={gridSettings.columns * GRID_FINE_GRAIN}
                >
                  <div className="grid-stack-item-content">
                    <WidgetShell
                      widget={widget}
                      onDelete={() => deleteWidget(widget.id)}
                      onAddComponent={(component) =>
                        handleAddComponentToWidget(widget.id, component)
                      }
                      onRemoveComponent={(instanceId) =>
                        handleRemoveComponentFromWidget(widget.id, instanceId)
                      }
                      onReorderComponents={(components) =>
                        handleReorderComponents(widget.id, components)
                      }
                      onUpdateComponentLayout={(instanceId, gridPosition) =>
                        handleUpdateComponentLayout(widget.id, instanceId, gridPosition)
                      }
                      onSelectComponent={(component) =>
                        onSelectComponent(artboard.id, widget.id, component)
                      }
                      selectedComponentId={selectedComponentId}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ArtboardSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        artboard={artboard}
        onUpdate={onUpdate}
      />
    </>
  );
}

export default memo(ArtboardContainer);
