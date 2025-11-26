import { useState, useCallback, useRef, useEffect } from 'react';
import { Trash2, Plus, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isComponentRegistered, getComponent } from '@/components/widget-components';
import type { WidgetSchema, ComponentCard, WidgetComponent } from '@/types/dashboard';
import {
  DEFAULT_SNAP_GRID_SIZE,
  snapToGrid,
  wouldCollide,
  calculateValidResizeBounds,
  findValidDropPosition,
  type Bounds,
  type ComponentWithBounds,
} from '@/lib/collision-utils';

interface WidgetShellProps {
  widget: WidgetSchema;
  onDelete?: () => void;
  onAddComponent?: (component: ComponentCard) => void;
  onRemoveComponent?: (instanceId: string) => void;
  onReorderComponents?: (components: WidgetComponent[]) => void;
  onUpdateComponentConfig?: (instanceId: string, config: Record<string, unknown>) => void;
}

// Each component has position and size within the widget
interface ComponentPosition {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  w: number; // percentage 0-100
  h: number; // percentage 0-100
}

export default function WidgetShell({ 
  widget, 
  onDelete, 
  onAddComponent,
  onRemoveComponent,
  onUpdateComponentConfig,
}: WidgetShellProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [hasCollisionWarning, setHasCollisionWarning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number; startW: number; startH: number } | null>(null);

  // Grid size for snapping (percentage)
  const SNAP_GRID = DEFAULT_SNAP_GRID_SIZE;

  const components = widget.components || [];
  const isEmpty = components.length === 0;

  // Get component position from config, or calculate default
  const getComponentPosition = useCallback((component: WidgetComponent, index: number): ComponentPosition => {
    if (component.config?.position) {
      return component.config.position as ComponentPosition;
    }
    // Default: stack vertically, each taking equal height
    const totalComponents = components.length;
    const heightPerComponent = 100 / totalComponents;
    return {
      x: 0,
      y: index * heightPerComponent,
      w: 100,
      h: heightPerComponent,
    };
  }, [components.length]);

  // Get all component bounds for collision detection
  const getAllComponentBounds = useCallback((): ComponentWithBounds[] => {
    return components.map((comp, index) => ({
      instanceId: comp.instanceId,
      bounds: getComponentPosition(comp, index) as Bounds,
    }));
  }, [components, getComponentPosition]);

  // Handle mouse move for dragging/resizing
  useEffect(() => {
    if (!draggingId && !resizingId) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !dragStartRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - dragStartRef.current.mouseX) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.mouseY) / rect.height) * 100;

      if (draggingId) {
        // Dragging - update position with snapping and collision detection
        const component = components.find(c => c.instanceId === draggingId);
        if (component) {
          const pos = getComponentPosition(component, components.indexOf(component));
          
          // Calculate raw new position
          const rawX = dragStartRef.current.startX + deltaX;
          const rawY = dragStartRef.current.startY + deltaY;
          
          // Snap to grid
          const snappedX = snapToGrid(rawX, SNAP_GRID);
          const snappedY = snapToGrid(rawY, SNAP_GRID);
          
          // Clamp to container bounds
          const clampedX = Math.max(0, Math.min(100 - pos.w, snappedX));
          const clampedY = Math.max(0, Math.min(100 - pos.h, snappedY));
          
          // Check for collision
          const newBounds: Bounds = {
            x: clampedX,
            y: clampedY,
            w: pos.w,
            h: pos.h,
          };
          
          const allBounds = getAllComponentBounds();
          const hasCollision = wouldCollide(newBounds, draggingId, allBounds);
          
          // Update collision warning state
          setHasCollisionWarning(hasCollision);
          
          // Only update position if no collision
          if (!hasCollision) {
            onUpdateComponentConfig?.(draggingId, {
              ...component.config,
              position: { ...pos, x: clampedX, y: clampedY },
            });
          }
        }
      } else if (resizingId && resizeHandle) {
        // Resizing with collision detection
        const component = components.find(c => c.instanceId === resizingId);
        if (component) {
          const pos = getComponentPosition(component, components.indexOf(component));
          let newX = pos.x, newY = pos.y, newW = pos.w, newH = pos.h;

          if (resizeHandle.includes('e')) {
            newW = Math.max(20, Math.min(100 - pos.x, dragStartRef.current.startW + deltaX));
          }
          if (resizeHandle.includes('w')) {
            const widthDelta = -deltaX;
            newW = Math.max(20, dragStartRef.current.startW + widthDelta);
            newX = Math.max(0, dragStartRef.current.startX - widthDelta);
          }
          if (resizeHandle.includes('s')) {
            newH = Math.max(15, Math.min(100 - pos.y, dragStartRef.current.startH + deltaY));
          }
          if (resizeHandle.includes('n')) {
            const heightDelta = -deltaY;
            newH = Math.max(15, dragStartRef.current.startH + heightDelta);
            newY = Math.max(0, dragStartRef.current.startY - heightDelta);
          }

          // Calculate valid resize bounds with collision detection
          const desiredBounds: Bounds = { x: newX, y: newY, w: newW, h: newH };
          const currentBounds: Bounds = { x: pos.x, y: pos.y, w: pos.w, h: pos.h };
          const allBounds = getAllComponentBounds();
          
          const validBounds = calculateValidResizeBounds(
            currentBounds,
            desiredBounds,
            resizingId,
            allBounds,
            SNAP_GRID
          );
          
          // Check if resize was blocked
          const wasBlocked = 
            validBounds.x === currentBounds.x &&
            validBounds.y === currentBounds.y &&
            validBounds.w === currentBounds.w &&
            validBounds.h === currentBounds.h;
          
          setHasCollisionWarning(wasBlocked);

          onUpdateComponentConfig?.(resizingId, {
            ...component.config,
            position: validBounds,
          });
        }
      }
    };

    const handleMouseUp = () => {
      setDraggingId(null);
      setResizingId(null);
      setResizeHandle(null);
      setHasCollisionWarning(false);
      dragStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingId, resizingId, resizeHandle, components, getComponentPosition, onUpdateComponentConfig]);

  const startDrag = useCallback((e: React.MouseEvent, component: WidgetComponent) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getComponentPosition(component, components.indexOf(component));
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: pos.x,
      startY: pos.y,
      startW: pos.w,
      startH: pos.h,
    };
    setDraggingId(component.instanceId);
  }, [components, getComponentPosition]);

  const startResize = useCallback((e: React.MouseEvent, component: WidgetComponent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    const pos = getComponentPosition(component, components.indexOf(component));
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: pos.x,
      startY: pos.y,
      startW: pos.w,
      startH: pos.h,
    };
    setResizingId(component.instanceId);
    setResizeHandle(handle);
  }, [components, getComponentPosition]);

  // Handle external component drop (from sidebar) - this uses HTML5 drag API
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
      
      // Calculate drop position as percentage
      if (parsed.id && parsed.category && containerRef.current) {
        // If it's the first component in the widget, make it fill the space
        // Otherwise find a valid non-overlapping position
        const isFirstComponent = components.length === 0;
        
        if (isFirstComponent) {
          // First component fills the widget
          const componentWithPosition = {
            ...parsed,
            initialPosition: {
              x: 2,
              y: 2,
              w: 96,
              h: 96,
            },
          };
          onAddComponent?.(componentWithPosition as ComponentCard);
        } else {
          // Additional components get placed at drop position with collision avoidance
          const rect = containerRef.current.getBoundingClientRect();
          const dropX = ((e.clientX - rect.left) / rect.width) * 100;
          const dropY = ((e.clientY - rect.top) / rect.height) * 100;
          
          // Desired size for new component
          const desiredWidth = 50;
          const desiredHeight = 50;
          
          // Find valid drop position avoiding existing components
          const existingBounds = getAllComponentBounds();
          const validPosition = findValidDropPosition(
            dropX - desiredWidth / 2,  // Center on cursor
            dropY - desiredHeight / 2,
            desiredWidth,
            desiredHeight,
            existingBounds,
            SNAP_GRID
          );
          
          const componentWithPosition = {
            ...parsed,
            initialPosition: validPosition,
          };
          onAddComponent?.(componentWithPosition as ComponentCard);
        }
      }
    } catch (error) {
      console.error('Failed to parse dropped data:', error);
    }
  }, [components, getAllComponentBounds, onAddComponent, SNAP_GRID]);

  // Empty widget state
  if (isEmpty) {
    return (
      <div 
        ref={containerRef}
        className={`group relative h-full w-full rounded-lg border-2 border-dashed bg-card text-card-foreground shadow-sm transition-all duration-200 ease-out hover:shadow-md ${
          isDragOver 
            ? 'border-primary bg-primary/5 shadow-lg scale-[1.01]' 
            : 'hover:border-primary/50'
        }`}
        onDragOver={handleExternalDragOver}
        onDragLeave={handleExternalDragLeave}
        onDrop={handleExternalDrop}
      >
        {/* Widget toolbar */}
        <div className="widget-drag-handle absolute inset-x-0 top-0 h-8 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-move bg-gradient-to-b from-background/80 to-transparent">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Empty state content */}
        <div className="flex h-full items-center justify-center p-6">
          <div className={`text-center space-y-3 max-w-xs transition-all duration-200 ${isDragOver ? 'scale-95 opacity-50' : ''}`}>
            <div className={`mx-auto h-12 w-12 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-200 ${
              isDragOver 
                ? 'border-primary bg-primary/10' 
                : 'border-muted-foreground/30'
            }`}>
              <Plus className={`h-5 w-5 ${isDragOver ? 'text-primary animate-pulse' : 'text-muted-foreground/50'}`} />
            </div>
            <p className="text-sm text-muted-foreground">
              {isDragOver ? 'Drop here' : 'Drop component'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Widget with components - FREE FORM CANVAS
  return (
    <div 
      ref={containerRef}
      className={`group relative h-full w-full rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200 ease-out hover:shadow-md overflow-hidden ${
        isDragOver ? 'border-primary ring-2 ring-primary/20' : 'border-border'
      } ${draggingId || resizingId ? 'select-none' : ''}`}
      onDragOver={handleExternalDragOver}
      onDragLeave={handleExternalDragLeave}
      onDrop={handleExternalDrop}
    >
      {/* Widget toolbar - top bar for drag and delete */}
      <div className="widget-drag-handle absolute inset-x-0 top-0 h-7 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity z-30 cursor-move bg-gradient-to-b from-muted/90 to-transparent rounded-t-lg">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Snap grid overlay - visible during drag/resize */}
      {(draggingId || resizingId) && (
        <div 
          className="absolute inset-0 pointer-events-none z-[5]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                to right,
                hsl(var(--primary) / 0.08) 0px,
                hsl(var(--primary) / 0.08) 1px,
                transparent 1px,
                transparent ${SNAP_GRID}%
              ),
              repeating-linear-gradient(
                to bottom,
                hsl(var(--primary) / 0.08) 0px,
                hsl(var(--primary) / 0.08) 1px,
                transparent 1px,
                transparent ${SNAP_GRID}%
              )
            `,
          }}
        />
      )}

      {/* Free-form components canvas */}
      <div className="absolute inset-0">
        {components.map((component, index) => {
          const ComponentToRender = getComponent(component.componentType);
          const isRegistered = isComponentRegistered(component.componentType);
          const pos = getComponentPosition(component, index);
          const isDragging = draggingId === component.instanceId;
          const isResizing = resizingId === component.instanceId;
          const isActivelyMoving = isDragging || isResizing;
          const showCollisionWarning = isActivelyMoving && hasCollisionWarning;

          return (
            <div
              key={component.instanceId}
              className={`absolute group/component transition-shadow ${
                isDragging ? 'z-20 shadow-xl cursor-grabbing' : 'z-10 hover:z-20'
              } ${isResizing ? 'z-20' : ''}`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: `${pos.w}%`,
                height: `${pos.h}%`,
              }}
            >
              {/* Component container with border on hover and collision warning */}
              <div className={`h-full w-full rounded-md border bg-background transition-all ${
                showCollisionWarning
                  ? 'border-destructive shadow-lg ring-2 ring-destructive/30'
                  : isActivelyMoving
                    ? 'border-primary shadow-lg ring-2 ring-primary/30' 
                    : 'border-transparent group-hover/component:border-border group-hover/component:shadow-md'
              }`}>
                {/* Drag handle - top center */}
                <div 
                  className="absolute -top-0 left-1/2 -translate-x-1/2 opacity-0 group-hover/component:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 bg-background/90 backdrop-blur-sm rounded-b px-2 py-0.5 border border-t-0 shadow-sm"
                  onMouseDown={(e) => startDrag(e, component)}
                >
                  <GripVertical className="h-3 w-3 text-muted-foreground rotate-90" />
                </div>

                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -right-1 -top-1 h-5 w-5 opacity-0 group-hover/component:opacity-100 transition-opacity z-10 bg-background/90 backdrop-blur-sm rounded-full shadow-sm border text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveComponent?.(component.instanceId);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>

                {/* Render the component */}
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

                {/* Resize handles - corners and edges */}
                {/* SE corner */}
                <div 
                  className="absolute -right-1 -bottom-1 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/component:opacity-100 cursor-se-resize z-10 shadow-sm"
                  onMouseDown={(e) => startResize(e, component, 'se')}
                />
                {/* SW corner */}
                <div 
                  className="absolute -left-1 -bottom-1 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/component:opacity-100 cursor-sw-resize z-10 shadow-sm"
                  onMouseDown={(e) => startResize(e, component, 'sw')}
                />
                {/* NE corner */}
                <div 
                  className="absolute -right-1 -top-1 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/component:opacity-100 cursor-ne-resize z-10 shadow-sm"
                  onMouseDown={(e) => startResize(e, component, 'ne')}
                />
                {/* NW corner */}
                <div 
                  className="absolute -left-1 -top-1 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/component:opacity-100 cursor-nw-resize z-10 shadow-sm"
                  onMouseDown={(e) => startResize(e, component, 'nw')}
                />
                {/* E edge */}
                <div 
                  className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary/50 rounded-full opacity-0 group-hover/component:opacity-100 cursor-e-resize z-10"
                  onMouseDown={(e) => startResize(e, component, 'e')}
                />
                {/* W edge */}
                <div 
                  className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary/50 rounded-full opacity-0 group-hover/component:opacity-100 cursor-w-resize z-10"
                  onMouseDown={(e) => startResize(e, component, 'w')}
                />
                {/* S edge */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-1 w-8 bg-primary/50 rounded-full opacity-0 group-hover/component:opacity-100 cursor-s-resize z-10"
                  onMouseDown={(e) => startResize(e, component, 's')}
                />
                {/* N edge */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2 -top-0.5 h-1 w-8 bg-primary/50 rounded-full opacity-0 group-hover/component:opacity-100 cursor-n-resize z-10"
                  onMouseDown={(e) => startResize(e, component, 'n')}
                />
              </div>
            </div>
          );
        })}
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
