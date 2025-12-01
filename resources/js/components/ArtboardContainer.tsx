/**
 * ArtboardContainer - Individual artboard with its own GridStack instance
 * 
 * Represents a single artboard with fixed dimensions based on its format.
 * Contains an isolated GridStack for managing widgets within the artboard.
 * Artboards can be positioned but NOT resized (dimensions are immutable).
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { GridStack } from 'gridstack';
import { Trash2, Lock, Unlock, Eye, EyeOff, MoreVertical, Copy } from 'lucide-react';
import 'gridstack/dist/gridstack.min.css';
import WidgetShell from '@/components/WidgetShell';
import { Button } from '@/components/ui/button';
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

interface ArtboardContainerProps {
  artboard: ArtboardSchema;
  isSelected: boolean;
  canvasScale: number;
  canvasPan: { x: number; y: number };
  zIndex: number;
  onUpdate: (artboardId: string, updates: Partial<ArtboardSchema>) => void;
  onDelete: (artboardId: string) => void;
  onSelect: () => void;
  onSelectComponent: (artboardId: string, widgetId: string, component: WidgetComponent) => void;
  selectedComponentId?: string;
}

export default function ArtboardContainer({
  artboard,
  isSelected,
  canvasScale,
  canvasPan,
  zIndex,
  onUpdate,
  onDelete,
  onSelect,
  onSelectComponent,
  selectedComponentId,
}: ArtboardContainerProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInstanceRef = useRef<GridStack | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localPosition, setLocalPosition] = useState<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; artboardX: number; artboardY: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // ============================================================================
  // GridStack Initialization (per artboard)
  // ============================================================================

  useEffect(() => {
    if (!gridRef.current) return;

    const gridConfig = calculateArtboardGridConfig(artboard.dimensions);

    const grid = GridStack.init(
      {
        column: gridConfig.columns,
        cellHeight: gridConfig.cellHeight,
        margin: gridConfig.margin,
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
    grid.on('change', (event, items) => {
      if (items) {
        const updatedWidgets = artboard.widgets.map((widget) => {
          const updated = items.find((item) => item.id === widget.id);
          if (updated) {
            return {
              ...widget,
              x: updated.x ?? widget.x,
              y: updated.y ?? widget.y,
              w: updated.w ?? widget.w,
              h: updated.h ?? widget.h,
            };
          }
          return widget;
        });

        onUpdate(artboard.id, { widgets: updatedWidgets });
      }
    });

    return () => {
      grid.destroy(false);
      gridInstanceRef.current = null;
    };
  }, [artboard.id, artboard.dimensions]);

  // ============================================================================
  // Artboard Positioning (Drag to Move) - Transform-Aware
  // ============================================================================

  /**
   * Convert screen coordinates to canvas space
   * Accounts for canvas pan and zoom transforms
   */
  const screenToCanvasCoords = useCallback(
    (screenX: number, screenY: number): { x: number; y: number } => {
      return {
        x: (screenX - canvasPan.x) / canvasScale,
        y: (screenY - canvasPan.y) / canvasScale,
      };
    },
    [canvasScale, canvasPan]
  );

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
            minW: 2,
            minH: 2,
            maxW: 12,
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

      const newComponent: WidgetComponent = {
        instanceId: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        componentType: componentData.id,
        config: {
          name: componentData.name,
          description: componentData.description,
          icon: componentData.icon,
        },
      };

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
        components: [newComponent],
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
  // Render
  // ============================================================================

  if (!artboard.visible) return null;

  // Use local position during drag for immediate feedback, otherwise use prop
  const displayPosition = isDragging && localPosition ? localPosition : artboard.position;

  return (
    <div
      ref={containerRef}
      className={`absolute bg-background shadow-2xl transition-all ${isSelected ? 'ring-2 ring-primary ring-offset-2' : 'ring-1 ring-border'
        } ${isDragging ? 'cursor-grabbing' : ''}`}
      style={{
        left: displayPosition.x,
        top: displayPosition.y,
        width: artboard.dimensions.widthPx,
        height: artboard.dimensions.heightPx,
        backgroundColor: artboard.backgroundColor,
        zIndex: zIndex, // Stack order from parent
        // Disable transitions during dragging for instant response
        transition: isDragging ? 'none' : undefined,
      }}
      onMouseDown={handleArtboardMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Artboard Header */}
      <div className="artboard-header absolute top-0 left-0 right-0 z-50 flex h-10 items-center justify-between bg-muted/80 backdrop-blur-sm px-3 border-b cursor-move">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">{artboard.name}</span>
          <span className="text-xs text-muted-foreground">
            {artboard.dimensions.label}
          </span>
          {artboard.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
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

      {/* Artboard Content Area */}
      <div
        className="absolute inset-0 top-10 overflow-auto"
        style={{ pointerEvents: 'auto' }}
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
                gs-x={widget.x}
                gs-y={widget.y}
                gs-w={widget.w}
                gs-h={widget.h}
                gs-min-w={2}
                gs-min-h={2}
                gs-max-w={12}
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
  );
}
