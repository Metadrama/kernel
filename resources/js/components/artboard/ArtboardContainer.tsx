/**
 * ArtboardContainer - Individual artboard with its own GridStack instance
 * 
 * Represents a single artboard with fixed dimensions based on its format.
 * Contains an isolated GridStack for managing widgets within the artboard.
 * Artboards can be positioned but NOT resized (dimensions are immutable).
 * 
 * Supports cross-artboard widget transfer via acceptWidgets.
 */

import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { GridStack, GridStackNode } from 'gridstack';
import { Trash2, Lock, Unlock, Eye, EyeOff, MoreVertical, Copy, Settings } from 'lucide-react';
import 'gridstack/dist/gridstack.min.css';
import WidgetShell from '@/components/WidgetShell';
import { Button } from '@/components/ui/button';
import ArtboardSettingsDialog from './ArtboardSettingsDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWidgetOperations, useArtboardDrag } from '@/hooks';
import type { ArtboardSchema } from '@/types/artboard';
import type { WidgetSchema, WidgetComponent, ComponentCard } from '@/types/dashboard';
import { calculateArtboardGridConfig } from '@/lib/artboard-utils';

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
  // Widget transfer callbacks for cross-artboard drag
  onWidgetReceived?: (widget: WidgetSchema, sourceArtboardId: string | undefined) => void;
  onWidgetRemoved?: (widgetId: string) => void;
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
  onWidgetReceived,
  onWidgetRemoved,
}: ArtboardContainerProps) {
  const HEADER_HEIGHT_PX = 52; // matches tailwind h-13 (3.25rem @ 16px)
  const HEADER_GAP_PX = 8;
  const HEADER_OFFSET_PX = HEADER_HEIGHT_PX + HEADER_GAP_PX;
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInstanceRef = useRef<GridStack | null>(null);
  const artboardRef = useRef<ArtboardSchema>(artboard);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const gridSettings = useMemo(() => calculateArtboardGridConfig(artboard.dimensions), [artboard.dimensions]);

  // Artboard dragging from extracted hook
  const { isDragging, displayPosition, handleMouseDown: handleArtboardMouseDown } = useArtboardDrag({
    position: artboard.position,
    canvasScale,
    locked: artboard.locked,
    onPositionChange: (pos) => onUpdate(artboard.id, { position: pos }),
    onSelect,
  });

  // Context menu state
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showSettings, setShowSettings] = useState(false);

  // Widget operations from hook
  const {
    addWidget: addWidgetToState,
    deleteWidget: deleteWidgetFromState,
    addComponentToWidget,
    removeComponentFromWidget,
    reorderComponents,
    updateComponentBounds,
  } = useWidgetOperations({ artboard, onUpdate });

  // Calculate display position (canvas space -> screen space)


  // ============================================================================
  // GridStack Initialization (per artboard)
  // ============================================================================

  useEffect(() => {
    artboardRef.current = artboard;
  }, [artboard]);

  useEffect(() => {
    if (!gridRef.current) return;

    // Track if we're in the middle of a cross-grid transfer to prevent React conflicts
    let isTransferring = false;

    // Initialize grid with acceptWidgets for cross-artboard transfer
    const grid = GridStack.init(
      {
        column: gridSettings.columns,
        cellHeight: gridSettings.cellHeight,
        margin: gridSettings.margin,
        float: true,  // Allow free positioning like Figma
        animate: true,
        minRow: 5,    // Minimum rows to ensure empty artboards have drop zone
        acceptWidgets: '.grid-stack-item', // Accept widgets from any grid
        draggable: {
          // Cancel on component handles so they don't trigger widget drag
          cancel: '.component-drag-handle',
        },
        resizable: {
          handles: 'e, se, s, sw, w',
          autoHide: false,
        },
      },
      gridRef.current
    );

    gridInstanceRef.current = grid;

    // Listen for drag start to set transfer flag
    grid.on('dragstart', () => {
      isTransferring = true;
    });

    // Listen for drag stop to clear transfer flag
    grid.on('dragstop', () => {
      // Small delay to let GridStack finish its internal updates
      setTimeout(() => {
        isTransferring = false;
      }, 50);
    });

    // Listen for widget position/size changes within this artboard
    grid.on('change', (_event: Event, items: GridStackNode[]) => {
      if (!items || items.length === 0) return;
      // Skip state update during transfer to prevent React conflicts
      if (isTransferring) return;

      const currentArtboard = artboardRef.current;
      const updatedWidgets = currentArtboard.widgets.map((widget) => {
        const updated = items.find((item) => (item.id ?? item.el?.id) === widget.id);
        if (!updated) return widget;

        return {
          ...widget,
          x: updated.x ?? widget.x,
          y: updated.y ?? widget.y,
          w: Math.max(1, updated.w ?? widget.w),
          h: Math.max(1, updated.h ?? widget.h),
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
  // Widget Management (GridStack integration)
  // ============================================================================

  const addWidget = () => {
    const newWidget = addWidgetToState();

    // Add to GridStack
    setTimeout(() => {
      if (gridInstanceRef.current) {
        const element = document.getElementById(newWidget.id);
        if (element) {
          gridInstanceRef.current.makeWidget(element);
          gridInstanceRef.current.update(element, {
            minW: 20, // 20 * 8px = 160px min width
            minH: 15, // 15 * 8px = 120px min height
            maxW: gridSettings.columns,
          });
        }
      }
    }, 10);
  };

  const deleteWidget = (widgetId: string) => {
    // Remove from GridStack FIRST (synchronously) to prevent React/DOM conflict
    if (gridInstanceRef.current) {
      const element = document.getElementById(widgetId);
      if (element) {
        try {
          // Use removeWidget with removeDOM=false since React will handle DOM removal
          gridInstanceRef.current.removeWidget(element, false);
        } catch (e) {
          console.debug('Widget already removed from grid:', widgetId);
        }
      }
    }

    // Then update React state
    deleteWidgetFromState(widgetId);
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

      // Only allow empty widget template drops on artboard
      // Direct component drops are disabled to prevent malformed dimensions
      // Users should first add an empty widget, then add components to it
      if (componentData.id !== 'empty-widget') {
        console.debug('Direct component drops on artboard disabled. Drop onto an existing widget instead.');
        return;
      }

      // Create empty widget with sensible defaults
      const newWidget: WidgetSchema = {
        id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x: 0,
        y: 0,
        w: 60, // 60 * 8px = 480px width
        h: 40, // 40 * 8px = 320px height
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
              minW: 20, // 160px min width
              minH: 15, // 120px min height
              maxW: gridSettings.columns,
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
          className="absolute inset-0"
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

          {/* GridStack Container - no overflow-hidden to allow cross-artboard drag */}
          <div className="relative h-full p-4">
            <div ref={gridRef} className="grid-stack">
              {artboard.widgets.map((widget) => (
                <div
                  key={widget.id}
                  id={widget.id}
                  className="grid-stack-item group/widget"
                  gs-id={widget.id}
                  gs-x={widget.x}
                  gs-y={widget.y}
                  gs-w={widget.w}
                  gs-h={widget.h}
                  gs-min-w={20}
                  gs-min-h={15}
                  gs-max-w={gridSettings.columns}
                  data-source-artboard={artboard.id}
                >

                  <div className="grid-stack-item-content">
                    <WidgetShell
                      widget={widget}
                      onDelete={() => deleteWidget(widget.id)}
                      onAddComponent={(component) =>
                        addComponentToWidget(widget.id, component)
                      }
                      onRemoveComponent={(instanceId) =>
                        removeComponentFromWidget(widget.id, instanceId)
                      }
                      onReorderComponents={(components) =>
                        reorderComponents(widget.id, components)
                      }
                      onUpdateComponentBounds={(instanceId, bounds) =>
                        updateComponentBounds(widget.id, instanceId, bounds)
                      }
                      onSelectComponent={(component) =>
                        onSelectComponent(artboard.id, widget.id, component)
                      }
                      selectedComponentId={selectedComponentId}
                      scale={canvasScale}
                      showDragHandle={false}
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
