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
import { Trash2, Lock, Unlock, Eye, EyeOff, MoreVertical, Copy, Settings, Clipboard } from 'lucide-react';
import 'gridstack/dist/gridstack.min.css';
import WidgetShell from '@/components/WidgetShell';
import { Button } from '@/components/ui/button';
import ArtboardSettingsDialog from './ArtboardSettingsDialog';
import DuplicateArtboardDialog from './DuplicateArtboardDialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useArtboardContext } from '@/context/ArtboardContext';
import { useWidgetOperations, useArtboardDrag, useKeyboardShortcuts } from '@/hooks';
import type { ArtboardSchema } from '@/types/artboard';
import type { WidgetSchema, WidgetComponent, ComponentCard } from '@/types/dashboard';
import { calculateArtboardGridConfig, calculateEffectiveGridConfig } from '@/lib/artboard-utils';
import type { SnapLine } from '@/lib/snap-utils';

/**
 * Widget alignment guides overlay component
 */
function WidgetAlignmentGuides({ guides, cellHeight }: { guides: SnapLine[]; cellHeight: number }) {
  if (guides.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
      {guides.map((guide, i) => (
        <div
          key={`${guide.axis}-${guide.position}-${i}`}
          className="absolute bg-pink-500"
          style={
            guide.axis === 'x'
              ? {
                left: guide.position,
                top: 0,
                bottom: 0,
                width: 1,
              }
              : {
                top: guide.position * cellHeight,
                left: 0,
                right: 0,
                height: 1,
              }
          }
        />
      ))}
    </div>
  );
}

interface ArtboardContainerProps {
  artboard: ArtboardSchema;
  isSelected: boolean;
  canvasScale: number;
  zIndex: number;
  onUpdate: (artboardId: string, updates: Partial<ArtboardSchema>) => void;
  onDelete: (artboardId: string) => void;
  onSelect: () => void;
  onSelectComponent: (artboardId: string, widgetId: string, component: WidgetComponent) => void;
  onDeselectComponent?: () => void;
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
  onDeselectComponent,
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

  const { duplicateArtboard } = useArtboardContext();
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  // Artboard dragging from extracted hook
  const { isDragging, displayPosition, handleMouseDown: handleArtboardMouseDown } = useArtboardDrag({
    position: artboard.position,
    canvasScale,
    locked: artboard.locked,
    onPositionChange: (pos) => onUpdate(artboard.id, { position: pos }),
    onSelect,
  });

  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [widgetAlignmentGuides, setWidgetAlignmentGuides] = useState<SnapLine[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);

  // Clear widget selection when clicking elsewhere on artboard
  const handleArtboardClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.target === containerRef.current || e.target === gridRef.current) {
      setSelectedWidgetId(null);
      onSelect(); // Ensure artboard is selected when background is clicked
      onDeselectComponent?.();
    }
  }, [onSelect, onDeselectComponent]);

  // Widget operations from hook
  const {
    addWidget: addWidgetToState,
    deleteWidget: deleteWidgetFromState,
    duplicateWidget,
    pasteWidget,
    updateWidgetLock,
    addComponentToWidget,
    removeComponentFromWidget,
    reorderComponents,
    updateComponentBounds,
    updateComponentZOrder,
    updateWidgetZOrder,
  } = useWidgetOperations({ artboard, onUpdate });

  // Handle paste from clipboard
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const widgetData = JSON.parse(text);
      // Validate it looks like a widget
      if (widgetData && widgetData.id && typeof widgetData.w === 'number' && Array.isArray(widgetData.components)) {
        pasteWidget(widgetData);
      }
    } catch (error) {
      // Clipboard doesn't contain valid widget data, ignore
      console.debug('Paste failed: clipboard does not contain valid widget data');
    }
  }, [pasteWidget]);

  // Keyboard shortcuts for selected widget
  useKeyboardShortcuts({
    enabled: !!selectedWidgetId && isSelected, // Only when artboard is active and a widget is selected
    onZOrderChange: (operation) => {
      if (selectedWidgetId) {
        updateWidgetZOrder(selectedWidgetId, operation);
      }
    },
    onDelete: () => {
      if (selectedWidgetId) {
        deleteWidgetFromState(selectedWidgetId);
        setSelectedWidgetId(null);
      }
    },
  });

  // Ctrl+V paste handler for artboard
  useEffect(() => {
    if (!isSelected) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlePaste();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSelected, handlePaste]);

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

    // Use configured padding or fallback to default
    const padding = artboard.gridPadding ?? 16;

    // Calculate effective grid configuration (accounting for container padding)
    const effectiveGridConfig = calculateEffectiveGridConfig(artboard.dimensions, padding);

    // Initialize grid with acceptWidgets for cross-artboard transfer
    const grid = GridStack.init(
      {
        column: gridSettings.columns,
        cellHeight: gridSettings.cellHeight,
        margin: gridSettings.margin,
        float: true,  // Allow free positioning like Figma
        animate: true,
        minRow: 5,    // Minimum rows to ensure empty artboards have drop zone
        maxRow: effectiveGridConfig.maxRows, // Maximum rows based on effective height
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

    // Listen for drag movement to calculate alignment guides
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (grid as any).on('drag', (_event: Event, el: HTMLElement, node: any) => {
      if (!node) return;
      const draggedId = node.id ?? el.id;
      const currentArtboard = artboardRef.current;

      // Get positions of other widgets for snapping
      const otherWidgets = currentArtboard.widgets.filter(w => w.id !== draggedId);
      const guides: SnapLine[] = [];

      const dragX = node.x ?? 0;
      const dragY = node.y ?? 0;
      const dragW = node.w ?? 0;
      const dragH = node.h ?? 0;

      // Convert grid positions to pixel positions
      const cellWidth = gridSettings.columns > 0 ? (currentArtboard.dimensions.widthPx / gridSettings.columns) : 50;

      // Check alignment with other widgets
      for (const widget of otherWidgets) {
        // Vertical alignments (X axis) - check left and right edges
        // Left edge alignment
        if (dragX === widget.x) {
          guides.push({ axis: 'x', position: widget.x * cellWidth, type: 'left' });
        }
        // Right edge alignment
        if (dragX + dragW === widget.x + widget.w) {
          guides.push({ axis: 'x', position: (widget.x + widget.w) * cellWidth, type: 'right' });
        }
        // Left to right edge alignment
        if (dragX === widget.x + widget.w) {
          guides.push({ axis: 'x', position: (widget.x + widget.w) * cellWidth, type: 'right' });
        }
        // Right to left edge alignment
        if (dragX + dragW === widget.x) {
          guides.push({ axis: 'x', position: widget.x * cellWidth, type: 'left' });
        }

        // Horizontal alignments (Y axis) - check top and bottom edges
        // Top edge alignment
        if (dragY === widget.y) {
          guides.push({ axis: 'y', position: widget.y, type: 'top' });
        }
        // Bottom edge alignment
        if (dragY + dragH === widget.y + widget.h) {
          guides.push({ axis: 'y', position: widget.y + widget.h, type: 'bottom' });
        }
        // Top to bottom edge alignment
        if (dragY === widget.y + widget.h) {
          guides.push({ axis: 'y', position: widget.y + widget.h, type: 'bottom' });
        }
        // Bottom to top edge alignment  
        if (dragY + dragH === widget.y) {
          guides.push({ axis: 'y', position: widget.y, type: 'top' });
        }
      }

      setWidgetAlignmentGuides(guides);
    });

    // Listen for drag stop to clear transfer flag and guides
    grid.on('dragstop', () => {
      setWidgetAlignmentGuides([]);
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

        // Enforce bounds constraints
        let newX = updated.x ?? widget.x;
        let newY = updated.y ?? widget.y;
        let newW = Math.max(1, updated.w ?? widget.w);
        let newH = Math.max(1, updated.h ?? widget.h);

        // Clamp X within bounds (0 to columns - width)
        newX = Math.max(0, Math.min(newX, gridSettings.columns - newW));

        // Clamp Y within bounds (0 to maxRows - height) - use effective maxRows
        newY = Math.max(0, Math.min(newY, effectiveGridConfig.maxRows - newH));

        // Clamp width to not exceed columns
        if (newX + newW > gridSettings.columns) {
          newW = gridSettings.columns - newX;
        }

        // Clamp height to not exceed max rows
        if (newY + newH > effectiveGridConfig.maxRows) {
          newH = effectiveGridConfig.maxRows - newY;
        }

        // If constraints changed the values, update GridStack
        if (newX !== updated.x || newY !== updated.y || newW !== updated.w || newH !== updated.h) {
          const element = document.getElementById(widget.id);
          if (element && grid) {
            grid.update(element, { x: newX, y: newY, w: newW, h: newH });
          }
        }

        return {
          ...widget,
          x: newX,
          y: newY,
          w: newW,
          h: newH,
        };
      });

      onUpdate(currentArtboard.id, { widgets: updatedWidgets });
    });

    return () => {
      grid.destroy(false);
      gridInstanceRef.current = null;
    };
  }, [artboard.id, artboard.dimensions, gridSettings, onUpdate]);


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

  // Track widget IDs to detect new widgets added via paste/duplicate
  const previousWidgetIdsRef = useRef<Set<string>>(new Set(artboard.widgets.map(w => w.id)));

  useEffect(() => {
    const currentIds = new Set(artboard.widgets.map(w => w.id));
    const previousIds = previousWidgetIdsRef.current;

    // Find newly added widgets
    const newWidgetIds = [...currentIds].filter(id => !previousIds.has(id));

    if (newWidgetIds.length > 0 && gridInstanceRef.current) {
      // Register new widgets with GridStack after a brief delay for React to render them
      setTimeout(() => {
        if (!gridInstanceRef.current) return;

        newWidgetIds.forEach(widgetId => {
          const element = document.getElementById(widgetId);
          if (element && !element.classList.contains('ui-draggable')) {
            try {
              gridInstanceRef.current!.makeWidget(element);
              gridInstanceRef.current!.update(element, {
                minW: 20,
                minH: 15,
                maxW: gridSettings.columns,
              });
            } catch (e) {
              console.debug('Widget already registered:', widgetId);
            }
          }
        });
      }, 20);
    }

    // Update the ref for next comparison
    previousWidgetIdsRef.current = currentIds;
  }, [artboard.widgets, gridSettings.columns]);

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

  // ============================================================================
  // Context Menu (Right-Click) - Handled by ContextMenu component
  // ============================================================================

  const handleDuplicate = (count: number) => {
    duplicateArtboard(artboard.id, count);
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
              <DropdownMenuItem onClick={() => setShowDuplicateDialog(true)}>
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

      {/* Artboard Container with background wrapped in Context Menu */}
      <ContextMenu>
        <ContextMenuTrigger>
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
            onClick={handleArtboardClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Background layer - starts below header with shadow and ring */}
            <div
              className={`absolute inset-0 shadow-2xl ${isSelected ? 'ring-1 ring-primary/20 ring-offset-2' : 'ring-1 ring-border'}`}
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
              <div
                className="relative h-full"
                style={{ padding: (artboard.gridPadding ?? 16) + 'px' }}
              >
                {/* Widget alignment guides overlay */}
                <WidgetAlignmentGuides guides={widgetAlignmentGuides} cellHeight={gridSettings.cellHeight} />

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
                          onUpdateComponentZOrder={(instanceId, operation) =>
                            updateComponentZOrder(widget.id, instanceId, operation)
                          }
                          onWidgetZOrderChange={(operation) =>
                            updateWidgetZOrder(widget.id, operation)
                          }
                          onLockChange={(locked) =>
                            updateWidgetLock(widget.id, locked)
                          }
                          onCopy={() => {
                            // Copy widget data to clipboard
                            navigator.clipboard.writeText(JSON.stringify(widget));
                          }}
                          onDuplicate={(count, options) =>
                            duplicateWidget(widget.id, count, options)
                          }
                          onSelectComponent={(component) => {
                            setSelectedWidgetId(null); // Clear widget selection when component is selected
                            onSelectComponent(artboard.id, widget.id, component);
                          }}
                          selectedComponentId={selectedComponentId}
                          scale={canvasScale}
                          isSelected={selectedWidgetId === widget.id}
                          onSelectWidget={() => {
                            setSelectedWidgetId(widget.id);
                            onDeselectComponent?.(); // Clear component selection when widget is selected
                          }}
                          showDragHandle={false}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem onClick={handlePaste}>
            <Clipboard className="mr-2 h-4 w-4" />
            Paste
            <ContextMenuShortcut>⌘V</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={addWidget}>
            Add Widget
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setShowDuplicateDialog(true)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate...
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => setShowSettings(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings...
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onUpdate(artboard.id, { locked: !artboard.locked })}>
            {artboard.locked ? (
              <>
                <Unlock className="mr-2 h-4 w-4" />
                Unlock Position
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Lock Position
              </>
            )}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onUpdate(artboard.id, { visible: false })}>
            <EyeOff className="mr-2 h-4 w-4" />
            Hide
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => onDelete(artboard.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Artboard
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu >

      <ArtboardSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        artboard={artboard}
        onUpdate={onUpdate}
      />

      <DuplicateArtboardDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        onDuplicate={handleDuplicate}
        artboardName={artboard.name}
      />
    </>
  );
}

export default memo(ArtboardContainer);
