/**
 * WidgetShell - Container for components with freeform Figma-like positioning
 * 
 * Components are positioned using absolute pixel coordinates.
 * Provides smooth drag and resize with smart snapping to nearby components.
 * Right-click for context menu with z-order and delete options.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Plus, Move, Trash2, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, Lock, Unlock, Copy, Clipboard } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { isComponentRegistered, getComponent } from '@/components/widget-components';
import { EmptyWidgetState, WidgetToolbar } from '@/components/widget';
import DuplicateWidgetDialog from '@/components/widget/DuplicateWidgetDialog';
import { useComponentDrag, useComponentResize, useKeyboardShortcuts } from '@/hooks';
import type { WidgetSchema, ComponentCard, WidgetComponent } from '@/types/dashboard';
import type { ComponentRect } from '@/lib/collision-detection';
import type { SnapLine } from '@/lib/snap-utils';
import { getMinSize, getMaxSize, getAspectRatio } from '@/lib/component-sizes';
import { cn } from '@/lib/utils';

interface WidgetShellProps {
  widget: WidgetSchema;
  onDelete?: () => void;
  onAddComponent?: (component: ComponentCard) => void;
  onRemoveComponent?: (instanceId: string) => void;
  onReorderComponents?: (components: WidgetComponent[]) => void;
  onUpdateComponentBounds?: (instanceId: string, bounds: { x: number; y: number; width: number; height: number }) => void;
  onUpdateComponentZOrder?: (instanceId: string, operation: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward') => void;
  onWidgetZOrderChange?: (operation: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward') => void;
  /** Callback to toggle widget lock state */
  onLockChange?: (locked: boolean) => void;
  /** Callback to copy widget to clipboard */
  onCopy?: () => void;
  /** Callback to duplicate widget with count */
  onDuplicate?: (count: number, options?: { fill?: boolean }) => void;
  onSelectComponent?: (component: WidgetComponent) => void;
  selectedComponentId?: string;
  /** Whether the widget itself is selected */
  isSelected?: boolean;
  /** Callback when widget is clicked/selected */
  onSelectWidget?: () => void;
  /** Canvas scale factor for zoom compensation */
  scale?: number;
  /** Whether to show drag handle (when not locked) */
  showDragHandle?: boolean;
}

function AlignmentGuides({ guides }: { guides: SnapLine[] }) {
  if (guides.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-visible">
      {guides.map((guide, i) => (
        <div
          key={`${guide.axis}-${guide.position}-${i}`}
          className="absolute bg-primary/70"
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

// Internal component for individual items to manage their own drag/resize state
function ComponentItem({
  component,
  isSelected,
  containerRef,
  siblings,
  scale = 1,
  anySiblingActive,
  onBoundsChange,
  onSelect,
  onRemove,
  onZOrderChange,
  onGuidesChange,
  onActiveChange,
}: {
  component: WidgetComponent;
  isSelected: boolean;
  containerRef: React.RefObject<HTMLElement | null>;
  siblings: ComponentRect[];
  scale: number;
  anySiblingActive: boolean;
  onBoundsChange?: (bounds: { x: number; y: number; width: number; height: number }) => void;
  onSelect?: () => void;
  onRemove?: () => void;
  onZOrderChange?: (operation: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward') => void;
  onGuidesChange?: (guides: SnapLine[]) => void;
  onActiveChange?: (isActive: boolean) => void;
}) {
  const componentRef = useRef<HTMLDivElement>(null);

  // Calculate constraints
  const minSize = getMinSize(component.componentType);
  const maxSize = getMaxSize(component.componentType);
  const aspectRatio = getAspectRatio(component.componentType);

  // Resize hook
  const {
    startResize,
    isResizing,
    displayBounds,
    activeGuides: resizeGuides
  } = useComponentResize({
    bounds: { x: component.x, y: component.y, width: component.width, height: component.height },
    componentId: component.instanceId,
    containerRef,
    minSize,
    maxSize,
    aspectRatio: aspectRatio || undefined,
    scale,
    enableSnapping: true,
    snapThreshold: 8,
    onBoundsChange: (newBounds) => {
      if (onBoundsChange) {
        onBoundsChange(newBounds);
      }
    },
    siblings,
  });

  // Drag hook
  const {
    displayPosition,
    handleMouseDown,
    isDragging,
    activeGuides: dragGuides
  } = useComponentDrag({
    componentId: component.instanceId,
    position: { x: component.x, y: component.y },
    size: { width: component.width, height: component.height },
    containerRef,
    scale,
    enableSnapping: true,
    snapThreshold: 8,
    onPositionChange: (newPos) => {
      if (onBoundsChange) {
        onBoundsChange({ ...newPos, width: component.width, height: component.height });
      }
    },
    onSelect: () => onSelect?.(),
    disabled: isResizing, // Disable drag while resizing
    siblings: siblings.map(s => ({ ...s, id: s.id })),
  });

  // Notify parent of guide changes
  useEffect(() => {
    if (isResizing) {
       onGuidesChange?.(resizeGuides);
    } else if (isDragging) {
       onGuidesChange?.(dragGuides);
    } else {
       // Only clear if we were previously active, to avoid clearing other components' guides?
       // Actually parent handles consolidation usually, but here we just push up.
       if (!anySiblingActive) {
           onGuidesChange?.([]);
       }
    }
  }, [isResizing, isDragging, resizeGuides, dragGuides, anySiblingActive]);

  // Notify parent of active state
  useEffect(() => {
    onActiveChange?.(isDragging || isResizing);
  }, [isDragging, isResizing]);

  // Handle selection on click
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.();
  };

  const ComponentToRender = getComponent(component.componentType);
  if (!ComponentToRender) return null;

  // Handles for resize
  const handles = ['nw', 'ne', 'sw', 'se', 'n', 'e', 's', 'w'] as const;

  // Determine display values
  const x = isResizing ? displayBounds.x : (isDragging ? displayPosition.x : component.x);
  const y = isResizing ? displayBounds.y : (isDragging ? displayPosition.y : component.y);
  const w = isResizing ? displayBounds.width : component.width;
  const h = isResizing ? displayBounds.height : component.height;

  return (
    <div
      ref={componentRef}
      className={`absolute select-none group/component ${isSelected ? 'z-20' : 'z-10'}`}
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none'
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {/* Component Content */}
      <div className={`w-full h-full overflow-hidden relative transition-shadow duration-200 ${isSelected
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-sm shadow-md'
          : 'hover:ring-1 hover:ring-primary/40 hover:rounded-sm'
        }`}>
        {/* Resize Overlay - Only visible when selected */}
        {isSelected && !isDragging && (
          <>
            {handles.map((handle) => (
              <div
                key={handle}
                className={`absolute w-2.5 h-2.5 bg-background border border-primary rounded-full z-30 transition-transform hover:scale-125 hover:bg-primary hover:border-background
                  ${handle === 'nw' ? '-top-1 -left-1 cursor-nw-resize' : ''}
                  ${handle === 'ne' ? '-top-1 -right-1 cursor-ne-resize' : ''}
                  ${handle === 'sw' ? '-bottom-1 -left-1 cursor-sw-resize' : ''}
                  ${handle === 'se' ? '-bottom-1 -right-1 cursor-se-resize' : ''}
                  ${handle === 'n' ? '-top-1 left-1/2 -translate-x-1/2 cursor-n-resize' : ''}
                  ${handle === 's' ? '-bottom-1 left-1/2 -translate-x-1/2 cursor-s-resize' : ''}
                  ${handle === 'w' ? 'top-1/2 -translate-y-1/2 -left-1 cursor-w-resize' : ''}
                  ${handle === 'e' ? 'top-1/2 -translate-y-1/2 -right-1 cursor-e-resize' : ''}
                `}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  startResize(e, handle);
                }}
              />
            ))}
          </>
        )}

        {/* Component Toolbar - Quick Actions */}
        {isSelected && (
          <div className="absolute -top-10 right-0 flex items-center gap-1 bg-foreground/90 text-background p-1 rounded-md shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
            {onZOrderChange && (
              <>
                <button
                  className="p-1 hover:bg-background/20 rounded"
                  onClick={(e) => { e.stopPropagation(); onZOrderChange('bringToFront'); }}
                  title="Bring to Front"
                >
                  <ChevronsUp className="h-3 w-3" />
                </button>
                <button
                  className="p-1 hover:bg-background/20 rounded"
                  onClick={(e) => { e.stopPropagation(); onZOrderChange('sendToBack'); }}
                  title="Send to Back"
                >
                  <ChevronsDown className="h-3 w-3" />
                </button>
              </>
            )}
            <div className="w-px h-3 bg-background/20 mx-0.5" />
            <button
              className="p-1 hover:bg-red-500/80 rounded text-red-200 hover:text-white"
              onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* The actual component */}
        <div className="w-full h-full pointer-events-none">
          <ComponentToRender
            config={component.config}
          />
        </div>
      </div>
    </div>
  );
}

export default function WidgetShell({
  widget,
  onDelete,
  onAddComponent,
  onRemoveComponent,
  onReorderComponents,
  onUpdateComponentBounds,
  onUpdateComponentZOrder,
  onWidgetZOrderChange,
  onLockChange,
  onCopy,
  onDuplicate,
  onSelectComponent,
  selectedComponentId,
  isSelected,
  onSelectWidget,
  scale = 1,
  showDragHandle = false,
}: WidgetShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [activeComponentId, setActiveComponentId] = useState<string | null>(null);
  const [activeGuides, setActiveGuides] = useState<SnapLine[]>([]);

  const components = widget.components || [];
  const isEmpty = components.length === 0;

  // Calculate content bounds for container height
  const contentHeight = useMemo(() => {
    if (isEmpty) return 100;
    const maxY = Math.max(...components.map(c => c.y + c.height));
    return maxY + 20; // Add padding
  }, [components, isEmpty]);

  // Prepare siblings list for collision detection (excluding the currently dragged one)
  const componentRects = useMemo(() =>
    components.map(c => ({
      id: c.instanceId,
      x: c.x,
      y: c.y,
      width: c.width,
      height: c.height
    })),
    [components]
  );

  const handleExternalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!widget.locked) {
      setIsDragOver(true);
    }
  };

  const handleExternalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleExternalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (widget.locked) return;

    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const componentCard = JSON.parse(data) as ComponentCard;
        onAddComponent?.(componentCard);
      }
    } catch (err) {
      console.error('Failed to parse dropped component:', err);
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onDelete: isSelected ? onDelete : undefined,
    onDuplicate: isSelected && onDuplicate ? () => setShowDuplicateDialog(true) : undefined,
    onCopy: isSelected ? onCopy : undefined,
    onPaste: () => { }, // Handled at dashboard level
  });

  const handleGuidesChange = useCallback((id: string, guides: SnapLine[]) => {
    setActiveGuides(prev => {
      // Prevent infinite loop by checking if guides actually changed
      if (prev === guides) return prev;
      if (prev.length === 0 && guides.length === 0) return prev;
      if (prev.length === guides.length && prev.every((g, i) =>
        g.axis === guides[i].axis && g.position === guides[i].position
      )) {
        return prev;
      }
      return guides;
    });
  }, []);

  if (isEmpty) {
    return (
      <>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <EmptyWidgetState
              ref={containerRef}
              isDragOver={isDragOver}
              onDelete={onDelete}
              onDragOver={handleExternalDragOver}
              onDragLeave={handleExternalDragLeave}
              onDrop={handleExternalDrop}
              showDragHandle={showDragHandle}
              isSelected={isSelected}
              onSelectWidget={onSelectWidget}
            />
          </ContextMenuTrigger>
          <ContextMenuContent className="w-56">
            {/* Copy & Duplicate */}
            {onCopy && (
              <ContextMenuItem onClick={onCopy}>
                <Clipboard className="h-4 w-4 mr-2" />
                Copy
                <ContextMenuShortcut>⌘C</ContextMenuShortcut>
              </ContextMenuItem>
            )}
            {onDuplicate && (
              <ContextMenuItem onClick={() => setShowDuplicateDialog(true)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate...
              </ContextMenuItem>
            )}
            {(onCopy || onDuplicate) && <ContextMenuSeparator />}

            {/* Z-Order */}
            {onWidgetZOrderChange && (
              <>
                <ContextMenuItem onClick={() => onWidgetZOrderChange('bringToFront')}>
                  <ChevronsUp className="h-4 w-4 mr-2" />
                  Bring to Front
                  <ContextMenuShortcut>⌘⇧]</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onWidgetZOrderChange('bringForward')}>
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Bring Forward
                  <ContextMenuShortcut>⌘]</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onWidgetZOrderChange('sendBackward')}>
                  <ArrowDown className="h-4 w-4 mr-2" />
                  Send Backward
                  <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onWidgetZOrderChange('sendToBack')}>
                  <ChevronsDown className="h-4 w-4 mr-2" />
                  Send to Back
                  <ContextMenuShortcut>⌘⇧[</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSeparator />
              </>
            )}

            {/* Lock */}
            {onLockChange && (
              <>
                <ContextMenuItem onClick={() => onLockChange(!widget.locked)}>
                  {widget.locked ? (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Unlock
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Lock
                    </>
                  )}
                </ContextMenuItem>
                <ContextMenuSeparator />
              </>
            )}

            {/* Delete */}
            <ContextMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Widget
              <ContextMenuShortcut>⌫</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {/* Duplicate Dialog */}
        {onDuplicate && (
          <DuplicateWidgetDialog
            open={showDuplicateDialog}
            onOpenChange={setShowDuplicateDialog}
            onDuplicate={onDuplicate}
          />
        )}
      </>
    );
  }

  // Widget with components - FREEFORM LAYOUT
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={containerRef}
            className={cn(
                "group relative h-full w-full rounded-lg bg-card text-card-foreground transition-all duration-200 ease-out overflow-hidden",
                isSelected
                    ? "ring-2 ring-primary border-transparent shadow-md z-10"
                    : isDragOver
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                        : "border border-border/60 hover:border-border hover:shadow-sm"
            )}
            onDragOver={handleExternalDragOver}
            onDragLeave={handleExternalDragLeave}
            onDrop={handleExternalDrop}
            onClick={(e) => {
              e.stopPropagation();
              onSelectWidget?.();
            }}
          >
            {/* Corner Indicators for Selection */}
            {isSelected && (
                <>
                    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-[3px] border-l-[3px] border-primary bg-transparent z-20 rounded-tl-[2px]" />
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-[3px] border-r-[3px] border-primary bg-transparent z-20 rounded-tr-[2px]" />
                    <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-[3px] border-l-[3px] border-primary bg-transparent z-20 rounded-bl-[2px]" />
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-[3px] border-r-[3px] border-primary bg-transparent z-20 rounded-br-[2px]" />
                </>
            )}

            {/* Widget toolbar */}
            <WidgetToolbar onDelete={onDelete} showDragHandle={showDragHandle} />

            {/* Alignment guides overlay */}
            <AlignmentGuides guides={activeGuides} />

            {/* Components container - relative for absolute positioning of children */}
            <div
              className="relative p-2"
              style={{
                minHeight: Math.max(contentHeight, 100),
              }}
            >
              {components.map((component) => (
                <ComponentItem
                  key={component.instanceId}
                  component={component}
                  isSelected={selectedComponentId === component.instanceId}
                  containerRef={containerRef}
                  siblings={componentRects.filter(r => r.id !== component.instanceId)}
                  scale={scale}
                  anySiblingActive={activeComponentId !== null && activeComponentId !== component.instanceId}
                  onBoundsChange={(bounds) => onUpdateComponentBounds?.(component.instanceId, bounds)}
                  onSelect={() => onSelectComponent?.(component)}
                  onRemove={() => onRemoveComponent?.(component.instanceId)}
                  onZOrderChange={onUpdateComponentZOrder ? (op) => onUpdateComponentZOrder(component.instanceId, op) : undefined}
                  onGuidesChange={(guides) => handleGuidesChange(component.instanceId, guides)}
                  onActiveChange={(isActive) => setActiveComponentId(isActive ? component.instanceId : null)}
                />
              ))}
            </div>

            {/* Drop indicator overlay */}
            {isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-lg pointer-events-none z-20">
                <div className="flex items-center gap-2 text-primary bg-background/90 px-4 py-2 rounded-lg shadow-lg">
                  <Plus className="h-5 w-5" />
                  <span className="text-sm font-medium">Drop to add</span>
                </div>
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          {/* Copy & Duplicate */}
          {onCopy && (
            <ContextMenuItem onClick={onCopy}>
              <Clipboard className="h-4 w-4 mr-2" />
              Copy
              <ContextMenuShortcut>⌘C</ContextMenuShortcut>
            </ContextMenuItem>
          )}
          {onDuplicate && (
            <ContextMenuItem onClick={() => setShowDuplicateDialog(true)}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicate...
            </ContextMenuItem>
          )}
          {(onCopy || onDuplicate) && <ContextMenuSeparator />}

          {/* Z-Order */}
          {onWidgetZOrderChange && (
            <>
              <ContextMenuItem onClick={() => onWidgetZOrderChange('bringToFront')}>
                <ChevronsUp className="h-4 w-4 mr-2" />
                Bring to Front
                <ContextMenuShortcut>⌘⇧]</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onWidgetZOrderChange('bringForward')}>
                <ArrowUp className="h-4 w-4 mr-2" />
                Bring Forward
                <ContextMenuShortcut>⌘]</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onWidgetZOrderChange('sendBackward')}>
                <ArrowDown className="h-4 w-4 mr-2" />
                Send Backward
                <ContextMenuShortcut>⌘[</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onWidgetZOrderChange('sendToBack')}>
                <ChevronsDown className="h-4 w-4 mr-2" />
                Send to Back
                <ContextMenuShortcut>⌘⇧[</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}

          {/* Lock */}
          {onLockChange && (
            <>
              <ContextMenuItem onClick={() => onLockChange(!widget.locked)}>
                {widget.locked ? (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Unlock
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Lock
                  </>
                )}
              </ContextMenuItem>
              <ContextMenuSeparator />
            </>
          )}

          {/* Delete */}
          <ContextMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Widget
            <ContextMenuShortcut>⌫</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Duplicate Dialog */}
      {onDuplicate && (
        <DuplicateWidgetDialog
          open={showDuplicateDialog}
          onOpenChange={setShowDuplicateDialog}
          onDuplicate={onDuplicate}
        />
      )}
    </>
  );
}
