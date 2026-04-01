/**
 * ArtboardContainer - Individual artboard with freeform widget positioning
 * 
 * Represents a single artboard with fixed dimensions.
 * Manages widgets using absolute positioning (replacing GridStack).
 */

import { useRef, useState, useCallback, useMemo, memo } from 'react';
import { Trash2, Lock, Unlock, Eye, EyeOff, Copy, Settings, Clipboard, MoreVertical } from 'lucide-react';
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
import { useWidgetOperations, useArtboardDrag, useKeyboardShortcuts, useComponentDrag, useComponentResize } from '@/hooks';
import type { ArtboardSchema } from '@/types/artboard';
import type { WidgetSchema, ComponentCard, WidgetComponent } from '@/types/dashboard';
import { calculateArtboardGridConfig, exportArtboardToJson } from '@/lib/artboard-utils';
import type { SnapLine } from '@/lib/snap-utils';
import { getMinSize, getMaxSize } from '@/lib/component-sizes';

/**
 * Widget alignment guides overlay component
 */
function WidgetAlignmentGuides({ guides }: { guides: SnapLine[] }) {
  if (guides.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
      {guides.map((guide, i) => (
        <div
          key={`${guide.axis}-${guide.position}-${i}`}
          className="absolute bg-pink-500/70"
          style={
            guide.axis === 'x'
              ? {
                left: guide.position,
                top: -9999,
                bottom: -9999,
                width: 1,
              }
              : {
                top: guide.position,
                left: -9999,
                right: -9999,
                height: 1,
              }
          }
        />
      ))}
    </div>
  );
}

// Wrapper for draggable/resizable widget on the artboard
const WidgetItem = ({
  widget,
  artboardId,
  isSelected,
  onSelect,
  containerRef,
  onUpdateBounds,
  scale,
  gridSettings,
  ...props
}: {
  widget: WidgetSchema;
  artboardId: string;
  isSelected: boolean;
  onSelect: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onUpdateBounds: (id: string, bounds: { x: number; y: number; w: number; h: number }) => void;
  scale: number;
  gridSettings: any;
  [key: string]: any;
}) => {
  // Use heuristic to convert legacy grid units to pixels if needed
  const isLikelyGrid = widget.w < 20 && widget.x < 100;
  const PX_SCALE = 80;

  const x = isLikelyGrid ? widget.x * PX_SCALE : widget.x;
  const y = isLikelyGrid ? widget.y * PX_SCALE : widget.y;
  const w = isLikelyGrid ? widget.w * PX_SCALE : widget.w;
  const h = isLikelyGrid ? widget.h * PX_SCALE : widget.h;

  const widgetRef = useRef<HTMLDivElement>(null);

  const {
    startResize: handleResize,
    isResizing: resizing,
    displayBounds: resizeBounds
  } = useComponentResize({
    bounds: { x, y, width: w, height: h },
    componentId: widget.id,
    containerRef,
    minSize: { width: 100, height: 100 },
    maxSize: { width: 2000, height: 2000 },
    scale,
    enableSnapping: true,
    snapThreshold: 8,
    onBoundsChange: (b: any) => {
        onUpdateBounds(widget.id, { x: b.x, y: b.y, w: b.width, h: b.height });
    },
    siblings: [], // Pass siblings for snapping if desired
  });

  const {
    displayPosition,
    handleMouseDown: handleDrag,
    isDragging: dragging
  } = useComponentDrag({
    componentId: widget.id,
    position: { x, y },
    size: { width: w, height: h },
    containerRef,
    scale,
    enableSnapping: true,
    snapThreshold: 8,
    onPositionChange: (p: any) => {
        onUpdateBounds(widget.id, { x: p.x, y: p.y, w, h });
    },
    onSelect,
    disabled: resizing,
    siblings: [],
  });

  // Calculate final display props
  const finalX = resizing ? resizeBounds.x : (dragging ? displayPosition.x : x);
  const finalY = resizing ? resizeBounds.y : (dragging ? displayPosition.y : y);
  const finalW = resizing ? resizeBounds.width : w;
  const finalH = resizing ? resizeBounds.height : h;

  // Handles for resize
  const handles = ['nw', 'ne', 'sw', 'se'] as const;

  return (
    <div
        ref={widgetRef}
        className={`absolute group/widget ${isSelected ? 'z-20' : 'z-10'}`}
        style={{
            left: finalX,
            top: finalY,
            width: finalW,
            height: finalH,
            cursor: dragging ? 'grabbing' : 'default',
            touchAction: 'none'
        }}
        onMouseDown={handleDrag}
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
        <div className={`relative w-full h-full ${isSelected ? 'ring-1 ring-primary' : ''}`}>
            {/* Render WidgetShell */}
            <WidgetShell
                {...props}
                widget={{ ...widget, x: finalX, y: finalY, w: finalW, h: finalH }}
                isSelected={isSelected}
                showDragHandle={true}
                onSelectWidget={onSelect}
                scale={scale}
            />

            {/* Resize Handles - Only when selected */}
            {isSelected && !dragging && handles.map((handle) => (
                <div
                    key={handle}
                    className={`absolute w-3 h-3 bg-white border border-primary rounded-full z-50 hover:bg-primary transition-colors
                        ${handle === 'nw' ? '-top-1.5 -left-1.5 cursor-nw-resize' : ''}
                        ${handle === 'ne' ? '-top-1.5 -right-1.5 cursor-ne-resize' : ''}
                        ${handle === 'sw' ? '-bottom-1.5 -left-1.5 cursor-sw-resize' : ''}
                        ${handle === 'se' ? '-bottom-1.5 -right-1.5 cursor-se-resize' : ''}
                    `}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        handleResize(e, handle);
                    }}
                />
            ))}
        </div>
    </div>
  );
};

interface ArtboardContainerProps {
  artboard: ArtboardSchema;
  isSelected?: boolean;
  onUpdate: (id: string, data: Partial<ArtboardSchema>) => void;
  onDelete: (id: string) => void;
  onSelectComponent: (artboardId: string, widgetId: string, component: WidgetComponent) => void;
  selectedWidgetId?: string | null;
  selectedComponentId?: string;
  onDeselectComponent?: () => void;
  setSelectedWidgetId: (id: string | null) => void;
}

function ArtboardContainer({
  artboard,
  isSelected,
  onUpdate,
  onDelete,
  onSelectComponent,
  selectedWidgetId,
  selectedComponentId,
  onDeselectComponent,
  setSelectedWidgetId,
}: ArtboardContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  // Use existing hooks
  const { canvasScale } = useArtboardContext();

  const {
    addWidget,
    deleteWidget,
    duplicateWidget,
    pasteWidget,
    updateWidgetLock,
    addComponentToWidget,
    removeComponentFromWidget,
    reorderComponents,
    updateComponentBounds,
    updateComponentZOrder,
    updateWidgetZOrder,
  } = useWidgetOperations(artboard, onUpdate);

  // New: Function to update widget bounds directly
  const updateWidgetBounds = useCallback((widgetId: string, bounds: { x: number; y: number; w: number; h: number }) => {
    const updatedWidgets = artboard.widgets.map(w =>
        w.id === widgetId ? { ...w, ...bounds } : w
    );
    onUpdate(artboard.id, { widgets: updatedWidgets });
  }, [artboard.widgets, artboard.id, onUpdate]);

  // Use artboard drag hook for the artboard itself
  const {
    position: displayPosition,
    handleMouseDown: handleArtboardDrag,
    isDragging,
    zIndex
  } = useArtboardDrag({
    artboardId: artboard.id,
    initialPosition: artboard.position,
    onUpdatePosition: (pos) => onUpdate(artboard.id, { position: pos }),
    isSelected: isSelected ?? false,
    scale: canvasScale
  });

  const gridSettings = useMemo(() => calculateArtboardGridConfig(artboard.dimensions), [artboard.dimensions]);

  const handleArtboardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
        const data = e.dataTransfer.getData('application/json');
        if (data) {
            const component = JSON.parse(data) as ComponentCard;

            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                const relativeX = (e.clientX - rect.left) / canvasScale;
                const relativeY = (e.clientY - rect.top) / canvasScale;

                const newWidget: WidgetSchema = {
                    id: `widget-${Date.now()}`,
                    x: relativeX - 150,
                    y: relativeY - 100,
                    w: 300,
                    h: 200,
                    components: [],
                };

                // Add default config if exists (fix TS error by using partial or check existence)
                const defaultConfig = (component as any).defaultConfig || {};

                const widgetWithComponent = {
                    ...newWidget,
                    components: [{
                        instanceId: `comp-${Date.now()}`,
                        componentType: component.id,
                        x: 0, y: 0, width: 300, height: 200,
                        config: defaultConfig
                    }]
                };

                const updatedWidgets = [...artboard.widgets, widgetWithComponent];
                onUpdate(artboard.id, { widgets: updatedWidgets });
            }
        }
    } catch (err) {
        console.error('Drop failed', err);
    }
  };

  const handlePaste = useCallback(() => {
    navigator.clipboard.readText().then(text => {
      try {
        const data = JSON.parse(text);
        if (data && data.id && data.components) {
          pasteWidget(data);
        }
      } catch (e) {
        console.error('Failed to paste widget', e);
      }
    });
  }, [pasteWidget]);

  return (
    <>
      <div
        className={`absolute h-8 flex items-center px-2 -top-8 left-0 transition-opacity duration-200 ${isSelected || isDragOver ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
        style={{
          transform: `translateY(${isDragging ? -5 : 0}px)`,
          left: displayPosition.x,
          top: displayPosition.y,
          width: artboard.dimensions.widthPx,
        }}
      >
        <div
          className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1 rounded-t-md cursor-grab active:cursor-grabbing shadow-sm"
          onMouseDown={handleArtboardDrag}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs font-semibold truncate max-w-[150px]">{artboard.name}</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-4 w-4 ml-1 hover:bg-primary-foreground/20 text-primary-foreground">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setShowDuplicateDialog(true)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportArtboardToJson(artboard)}>
                <Settings className="mr-2 h-4 w-4" />
                Export JSON
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(artboard.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ContextMenu>
        <ContextMenuTrigger>
          <div
            ref={containerRef}
            className={`absolute transition-shadow duration-200 ${isSelected ? 'z-10' : 'z-0'}`}
            style={{
              left: displayPosition.x,
              top: displayPosition.y,
              width: artboard.dimensions.widthPx,
              height: artboard.dimensions.heightPx,
              backgroundColor: artboard.backgroundColor,
              boxShadow: isSelected ? '0 0 0 2px hsl(var(--primary))' : '0 1px 3px 0 rgb(0 0 0 / 0.1)',
            }}
            onClick={handleArtboardClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {artboard.showGrid && (
               <div className="absolute inset-0 pointer-events-none opacity-[0.05]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
               />
            )}

            <div className="absolute inset-0 overflow-hidden">
                {artboard.widgets.map((widget) => (
                    <WidgetItem
                        key={widget.id}
                        widget={widget}
                        artboardId={artboard.id}
                        isSelected={selectedWidgetId === widget.id}
                        onSelect={() => setSelectedWidgetId(widget.id)}
                        containerRef={containerRef}
                        onUpdateBounds={updateWidgetBounds}
                        scale={canvasScale}
                        gridSettings={gridSettings}
                        onDelete={() => deleteWidget(widget.id)}
                        onAddComponent={(c: ComponentCard) => addComponentToWidget(widget.id, c)}
                        onRemoveComponent={(cid: string) => removeComponentFromWidget(widget.id, cid)}
                        onReorderComponents={(c: WidgetComponent[]) => reorderComponents(widget.id, c)}
                        onUpdateComponentBounds={(cid: string, b: any) => updateComponentBounds(widget.id, cid, b)}
                        onUpdateComponentZOrder={(cid: string, op: any) => updateComponentZOrder(widget.id, cid, op)}
                        onWidgetZOrderChange={(op: any) => updateWidgetZOrder(widget.id, op)}
                        onLockChange={(l: boolean) => updateWidgetLock(widget.id, l)}
                        onCopy={() => navigator.clipboard.writeText(JSON.stringify(widget))}
                        onDuplicate={(c: number, o: any) => duplicateWidget(widget.id, c, o)}
                        onSelectComponent={(c: WidgetComponent) => {
                            setSelectedWidgetId(null);
                            onSelectComponent(artboard.id, widget.id, c);
                        }}
                        selectedComponentId={selectedComponentId}
                    />
                ))}
            </div>

            {isDragOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/10 border-2 border-primary border-dashed z-50 pointer-events-none">
                    <span className="bg-background px-3 py-1 rounded-full text-xs font-medium shadow-sm">Drop to add widget</span>
                </div>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
            <ContextMenuItem onClick={handlePaste}>
                <Clipboard className="mr-2 h-4 w-4" /> Paste Widget
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => onDelete(artboard.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete Artboard
            </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <ArtboardSettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        artboard={artboard}
        onUpdate={onUpdate}
      />

      <DuplicateArtboardDialog
        open={showDuplicateDialog}
        onOpenChange={setShowDuplicateDialog}
        onDuplicate={(name) => {
            // Implement duplicate logic
        }}
        artboardName={artboard.name}
      />
    </>
  );
}

export default memo(ArtboardContainer);
