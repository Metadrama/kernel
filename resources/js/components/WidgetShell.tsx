/**
 * WidgetShell - Container for components with freeform Figma-like positioning
 * 
 * Components are positioned using absolute pixel coordinates.
 * Provides smooth drag and resize with collision detection on drop.
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Plus, X, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isComponentRegistered, getComponent } from '@/components/widget-components';
import { EmptyWidgetState, WidgetToolbar } from '@/components/widget';
import { useComponentDrag, useComponentResize, type ResizeDirection } from '@/hooks';
import type { WidgetSchema, ComponentCard, WidgetComponent } from '@/types/dashboard';
import type { ComponentRect } from '@/lib/collision-detection';
import { getMinSize, getMaxSize, getAspectRatio } from '@/lib/component-sizes';

interface WidgetShellProps {
  widget: WidgetSchema;
  onDelete?: () => void;
  onAddComponent?: (component: ComponentCard) => void;
  onRemoveComponent?: (instanceId: string) => void;
  onReorderComponents?: (components: WidgetComponent[]) => void;
  onUpdateComponentBounds?: (instanceId: string, bounds: { x: number; y: number; width: number; height: number }) => void;
  onSelectComponent?: (component: WidgetComponent) => void;
  selectedComponentId?: string;
  /** Canvas scale factor for zoom compensation */
  scale?: number;
  /** Whether to show the drag handle inside the shell (default: true). Set to false when handle is rendered externally (e.g., by GridStack parent). */
  showDragHandle?: boolean;
}

/**
 * Individual component wrapper with drag and resize capabilities
 */
function ComponentItem({
  component,
  isSelected,
  containerRef,
  siblings,
  scale = 1,
  onBoundsChange,
  onSelect,
  onRemove,
}: {
  component: WidgetComponent;
  isSelected: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  siblings: ComponentRect[];
  scale?: number;
  onBoundsChange: (bounds: { x: number; y: number; width: number; height: number }) => void;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const ComponentToRender = getComponent(component.componentType);
  const isRegistered = isComponentRegistered(component.componentType);

  const minSize = getMinSize(component.componentType);
  const maxSize = getMaxSize(component.componentType);
  const aspectRatio = getAspectRatio(component.componentType);

  // Drag hook
  const { isDragging, displayPosition, handleMouseDown: handleDragMouseDown } = useComponentDrag({
    position: { x: component.x, y: component.y },
    size: { width: component.width, height: component.height },
    componentId: component.instanceId,
    containerRef,
    siblings,
    scale,
    onPositionChange: (pos) => onBoundsChange({ ...pos, width: component.width, height: component.height }),
    onSelect,
  });

  // Resize hook
  const { isResizing, displayBounds, startResize } = useComponentResize({
    bounds: { x: component.x, y: component.y, width: component.width, height: component.height },
    componentId: component.instanceId,
    minSize,
    maxSize,
    aspectRatio,
    containerRef,
    siblings,
    scale,
    onBoundsChange,
  });

  const isActive = isDragging || isResizing;

  // Use display position/bounds for immediate visual feedback
  const displayX = isResizing ? displayBounds.x : displayPosition.x;
  const displayY = isResizing ? displayBounds.y : displayPosition.y;
  const displayWidth = isResizing ? displayBounds.width : component.width;
  const displayHeight = isResizing ? displayBounds.height : component.height;

  return (
    <div
      className={`absolute group/component ${isDragging ? 'z-30 cursor-grabbing' : 'z-10 hover:z-20'} ${isResizing ? 'z-30' : ''} ${isSelected ? 'z-25' : ''}`}
      style={{
        left: displayX,
        top: displayY,
        width: displayWidth,
        height: displayHeight,
        // Disable transitions during drag/resize for instant feedback
        transition: isActive ? 'none' : 'box-shadow 150ms ease-out',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Component container with selection styling */}
      <div className={`h-full w-full rounded-md border bg-background ${isSelected
        ? 'border-primary ring-2 ring-primary/30 shadow-md'
        : isActive
          ? 'border-primary shadow-lg ring-2 ring-primary/30'
          : 'border-transparent group-hover/component:border-border group-hover/component:shadow-sm'
        }`}>

        {/* Move handle - top center */}
        <div
          className="component-drag-handle absolute -top-0 left-1/2 -translate-x-1/2 opacity-0 group-hover/component:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 bg-background/90 backdrop-blur-sm rounded-b px-2 py-0.5 border border-t-0 shadow-sm"
          onMouseDown={handleDragMouseDown}
        >
          <Move className="h-3 w-3 text-muted-foreground" />
        </div>

        {/* Remove button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-1 -top-1 h-5 w-5 opacity-0 group-hover/component:opacity-100 transition-opacity z-10 bg-background/90 backdrop-blur-sm rounded-full shadow-sm border text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3 w-3" />
        </Button>

        {/* Render the actual component */}
        <div className="h-full w-full overflow-hidden rounded-md">
          {isRegistered && ComponentToRender ? (
            <ComponentToRender config={component.config} />
          ) : (
            <div className="flex h-full items-center justify-center p-2">
              <p className="text-xs text-muted-foreground">
                Unknown: {component.componentType}
              </p>
            </div>
          )}
        </div>

        {/* Resize handles - 8 directions for Figma-like control */}
        {/* North */}
        <div
          className="component-drag-handle absolute left-1/2 -translate-x-1/2 -top-1 h-2 w-8 bg-primary/60 rounded-full opacity-0 group-hover/component:opacity-100 [@media(hover:none)]:opacity-100 cursor-n-resize z-20 hover:bg-primary"
          onMouseDown={(e) => startResize(e, 'n')}
        />
        {/* South */}
        <div
          className="component-drag-handle absolute left-1/2 -translate-x-1/2 -bottom-1 h-2 w-8 bg-primary/60 rounded-full opacity-0 group-hover/component:opacity-100 [@media(hover:none)]:opacity-100 cursor-s-resize z-20 hover:bg-primary"
          onMouseDown={(e) => startResize(e, 's')}
        />
        {/* East */}
        <div
          className="component-drag-handle absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-primary/60 rounded-full opacity-0 group-hover/component:opacity-100 [@media(hover:none)]:opacity-100 cursor-e-resize z-20 hover:bg-primary"
          onMouseDown={(e) => startResize(e, 'e')}
        />
        {/* West */}
        <div
          className="component-drag-handle absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-primary/60 rounded-full opacity-0 group-hover/component:opacity-100 [@media(hover:none)]:opacity-100 cursor-w-resize z-20 hover:bg-primary"
          onMouseDown={(e) => startResize(e, 'w')}
        />
        {/* Northeast */}
        <div
          className="component-drag-handle absolute -right-1 -top-1 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/component:opacity-100 [@media(hover:none)]:opacity-100 cursor-ne-resize z-20 shadow-sm"
          onMouseDown={(e) => startResize(e, 'ne')}
        />
        {/* Southeast */}
        <div
          className="component-drag-handle absolute -right-1 -bottom-1 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/component:opacity-100 [@media(hover:none)]:opacity-100 cursor-se-resize z-20 shadow-sm"
          onMouseDown={(e) => startResize(e, 'se')}
        />
        {/* Southwest */}
        <div
          className="component-drag-handle absolute -left-1 -bottom-1 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/component:opacity-100 [@media(hover:none)]:opacity-100 cursor-sw-resize z-20 shadow-sm"
          onMouseDown={(e) => startResize(e, 'sw')}
        />
        {/* Northwest */}
        <div
          className="component-drag-handle absolute -left-1 -top-1 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/component:opacity-100 [@media(hover:none)]:opacity-100 cursor-nw-resize z-20 shadow-sm"
          onMouseDown={(e) => startResize(e, 'nw')}
        />
      </div>
    </div>
  );
}

export default function WidgetShell({
  widget,
  onDelete,
  onAddComponent,
  onRemoveComponent,
  onUpdateComponentBounds,
  onSelectComponent,
  selectedComponentId,
  scale = 1,
  showDragHandle = true,
}: WidgetShellProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const components = widget.components || [];
  const isEmpty = components.length === 0;

  // Track container size for bounds checking
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Convert components to ComponentRect for collision detection
  const componentRects = useMemo((): ComponentRect[] => {
    return components.map(c => ({
      id: c.instanceId,
      x: c.x,
      y: c.y,
      width: c.width,
      height: c.height,
    }));
  }, [components]);

  // Handle external component drop (from sidebar)
  const handleExternalDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleExternalDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  const handleExternalDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      const parsed = JSON.parse(data);

      if (parsed.id === 'empty-widget') {
        return; // Empty widget template only applies when creating new widgets
      }

      if (parsed.id && parsed.category) {
        // Component will be auto-positioned by addComponentToWidget
        onAddComponent?.(parsed as ComponentCard);
      }
    } catch (error) {
      console.error('Failed to parse dropped data:', error);
    }
  }, [onAddComponent]);

  // Calculate content bounds for container min-height
  const contentHeight = useMemo(() => {
    if (components.length === 0) return 0;
    const maxBottom = Math.max(...components.map(c => c.y + c.height));
    return maxBottom + 16; // Add padding
  }, [components]);

  if (isEmpty) {
    return (
      <EmptyWidgetState
        ref={containerRef}
        isDragOver={isDragOver}
        onDelete={onDelete}
        onDragOver={handleExternalDragOver}
        onDragLeave={handleExternalDragLeave}
        onDrop={handleExternalDrop}
        showDragHandle={showDragHandle}
      />
    );
  }

  // Widget with components - FREEFORM LAYOUT
  return (
    <div
      ref={containerRef}
      className={`group relative h-full w-full rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200 ease-out hover:shadow-md overflow-hidden ${isDragOver ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}
      onDragOver={handleExternalDragOver}
      onDragLeave={handleExternalDragLeave}
      onDrop={handleExternalDrop}
    >
      {/* Widget toolbar */}
      <WidgetToolbar onDelete={onDelete} showDragHandle={showDragHandle} />

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
            onBoundsChange={(bounds) => onUpdateComponentBounds?.(component.instanceId, bounds)}
            onSelect={() => onSelectComponent?.(component)}
            onRemove={() => onRemoveComponent?.(component.instanceId)}
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
  );
}
