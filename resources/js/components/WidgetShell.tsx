import { useState, useCallback, useRef, useEffect, useMemo, useLayoutEffect } from 'react';
import { Trash2, Plus, X, GripVertical, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isComponentRegistered, getComponent } from '@/components/widget-components';
import { EmptyWidgetState, WidgetToolbar } from '@/components/widget';
import { useComponentDragResize } from '@/hooks';
import type { WidgetSchema, ComponentCard, WidgetComponent } from '@/types/dashboard';
import {
  calculateWidgetLayout,
  getComponentIntrinsicSize,
  DEFAULT_WIDGET_GRID,
  type LayoutResult,
  type GridPosition,
  type WidgetGridConfig,
} from '@/lib/component-layout';

const SCROLLBAR_HIDE_THRESHOLD = 24;

interface WidgetShellProps {
  widget: WidgetSchema;
  onDelete?: () => void;
  onAddComponent?: (component: ComponentCard) => void;
  onRemoveComponent?: (instanceId: string) => void;
  onReorderComponents?: (components: WidgetComponent[]) => void;
  onUpdateComponentLayout?: (instanceId: string, gridPosition: GridPosition) => void;
  onSelectComponent?: (component: WidgetComponent) => void;
  selectedComponentId?: string;
}

export default function WidgetShell({
  widget,
  onDelete,
  onAddComponent,
  onRemoveComponent,
  onUpdateComponentLayout,
  onSelectComponent,
  selectedComponentId,
}: WidgetShellProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const gridContentRef = useRef<HTMLDivElement>(null);
  const gridPaddingRef = useRef({ top: 0, bottom: 0 });
  const [containerWidth, setContainerWidth] = useState(0);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [hideScrollbars, setHideScrollbars] = useState(false);

  const gridConfig: WidgetGridConfig = DEFAULT_WIDGET_GRID;
  const components = widget.components || [];
  const isEmpty = components.length === 0;

  // Measure container width for layout calculations
  const evaluateOverflow = useCallback(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const verticalOverflow = Math.max(0, el.scrollHeight - el.clientHeight);
    const horizontalOverflow = Math.max(0, el.scrollWidth - el.clientWidth);
    const maxOverflow = Math.max(verticalOverflow, horizontalOverflow);
    const shouldHide = maxOverflow > 0 && maxOverflow <= SCROLLBAR_HIDE_THRESHOLD;
    setHideScrollbars(shouldHide);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setContainerWidth(width);

        setLayoutWidth((prev) => {
          if (components.length === 0) {
            return width;
          }

          if (prev === 0) {
            return width;
          }

          return Math.max(prev, width);
        });
      }
      evaluateOverflow();
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [components.length, evaluateOverflow]);
  useLayoutEffect(() => {
    if (isEmpty) {
      gridPaddingRef.current = { top: 0, bottom: 0 };
      return;
    }

    if (!gridContentRef.current) return;
    const style = window.getComputedStyle(gridContentRef.current);
    gridPaddingRef.current = {
      top: parseFloat(style.paddingTop || '0'),
      bottom: parseFloat(style.paddingBottom || '0'),
    };
  }, [isEmpty]);


  useEffect(() => {
    if (components.length === 0) {
      setLayoutWidth(containerWidth);
    }
  }, [components.length, containerWidth]);

  // Calculate layout for all components
  const effectiveLayoutWidth = layoutWidth || containerWidth;

  const layouts = useMemo(() => {
    if (effectiveLayoutWidth === 0 || components.length === 0) return [];

    const componentInputs = components.map(comp => ({
      instanceId: comp.instanceId,
      componentType: comp.componentType,
      config: comp.gridPosition
        ? { layout: { gridPosition: comp.gridPosition, locked: true } }
        : undefined,
    }));

    return calculateWidgetLayout(componentInputs, effectiveLayoutWidth, gridConfig);
  }, [components, effectiveLayoutWidth, gridConfig]);

  // Create a map for quick lookup
  const layoutMap = useMemo(() => {
    const map = new Map<string, LayoutResult>();
    for (const layout of layouts) {
      map.set(layout.instanceId, layout);
    }
    return map;
  }, [layouts]);

  // Persist auto-generated layouts so subsequent renders treat them as locked positions
  useEffect(() => {
    if (!onUpdateComponentLayout || layouts.length === 0) return;

    components.forEach((component) => {
      if (component.gridPosition) return;
      const layout = layoutMap.get(component.instanceId);
      if (!layout) return;
      onUpdateComponentLayout(component.instanceId, layout.gridPosition);
    });
  }, [components, layouts, layoutMap, onUpdateComponentLayout]);

  // Calculate grid cell dimensions
  const gridCellWidth = useMemo(() => {
    if (effectiveLayoutWidth === 0) return 0;
    return (effectiveLayoutWidth - (gridConfig.gap * (gridConfig.columns - 1))) / gridConfig.columns;
  }, [effectiveLayoutWidth, gridConfig]);

  // Drag and resize handling via extracted hook
  const { draggingId, resizingId, isActive, startDrag, startResize } = useComponentDragResize({
    components,
    layoutMap,
    gridConfig,
    gridCellWidth,
    containerRef,
    gridPaddingRef,
    onUpdateComponentLayout,
  });

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
        // Component will be auto-positioned by the layout system
        onAddComponent?.(parsed as ComponentCard);
      }
    } catch (error) {
      console.error('Failed to parse dropped data:', error);
    }
  }, [onAddComponent]);

  // Calculate total content height
  const contentHeight = useMemo(() => {
    if (layouts.length === 0) return 0;
    const maxBottom = Math.max(...layouts.map(l => l.pixelBounds.y + l.pixelBounds.height));
    return maxBottom + gridConfig.gap;
  }, [layouts, gridConfig.gap]);

  useLayoutEffect(() => {
    evaluateOverflow();
  }, [contentHeight, layoutWidth, components.length, evaluateOverflow]);

  if (isEmpty) {
    return (
      <EmptyWidgetState
        ref={containerRef}
        isDragOver={isDragOver}
        onDelete={onDelete}
        onDragOver={handleExternalDragOver}
        onDragLeave={handleExternalDragLeave}
        onDrop={handleExternalDrop}
      />
    );
  }

  // Widget with components - STRUCTURED GRID LAYOUT
  return (
    <div
      ref={containerRef}
      className={`group relative h-full w-full rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200 ease-out hover:shadow-md overflow-auto ${isDragOver ? 'border-primary ring-2 ring-primary/20' : 'border-border'
        } ${draggingId || resizingId ? 'select-none' : ''} ${hideScrollbars ? 'widget-shell--hide-scrollbars' : ''}`}
      onDragOver={handleExternalDragOver}
      onDragLeave={handleExternalDragLeave}
      onDrop={handleExternalDrop}
    >
      {/* Widget toolbar */}
      {!draggingId && !resizingId && (
        <WidgetToolbar onDelete={onDelete} />
      )}

      {/* Grid overlay - visible during drag/resize */}
      {(draggingId || resizingId) && (
        <div
          className="absolute inset-0 pointer-events-none z-[5]"
          style={{
            backgroundSize: `${gridCellWidth + gridConfig.gap}px ${gridConfig.rowHeight + gridConfig.gap}px`,
            backgroundImage: `
              linear-gradient(to right, hsl(var(--primary) / 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--primary) / 0.1) 1px, transparent 1px)
            `,
            backgroundPosition: `${gridConfig.gap / 2}px ${gridConfig.gap / 2}px`,
          }}
        />
      )}

      {/* Grid-based components container */}
      <div
        className="relative p-2"
        ref={gridContentRef}
        style={{
          minHeight: contentHeight + gridConfig.gap * 2,
        }}
      >
        {components.map((component) => {
          const layout = layoutMap.get(component.instanceId);
          if (!layout) return null;

          const ComponentToRender = getComponent(component.componentType);
          const isRegistered = isComponentRegistered(component.componentType);
          const isDragging = draggingId === component.instanceId;
          const isResizing = resizingId === component.instanceId;
          const isActive = isDragging || isResizing;
          const isSelected = selectedComponentId === component.instanceId;

          return (
            <div
              key={component.instanceId}
              className={`absolute group/component transition-all duration-150 ${isDragging ? 'z-20 shadow-xl cursor-grabbing' : 'z-10 hover:z-15'
                } ${isResizing ? 'z-20' : ''} ${isSelected ? 'z-25' : ''}`}
              style={{
                left: layout.pixelBounds.x,
                top: layout.pixelBounds.y,
                width: layout.pixelBounds.width,
                height: layout.pixelBounds.height,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectComponent?.(component);
              }}
            >
              {/* Component container */}
              <div className={`h-full w-full rounded-md border bg-background transition-all ${isSelected
                ? 'border-primary ring-2 ring-primary/30 shadow-md'
                : isActive
                  ? 'border-primary shadow-lg ring-2 ring-primary/30'
                  : 'border-transparent group-hover/component:border-border group-hover/component:shadow-sm'
                }`}>
                {/* Move handle - top center */}
                <div
                  className="absolute -top-0 left-1/2 -translate-x-1/2 opacity-0 group-hover/component:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 bg-background/90 backdrop-blur-sm rounded-b px-2 py-0.5 border border-t-0 shadow-sm"
                  onMouseDown={(e) => startDrag(e, component)}
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

                {/* Resize handles - simplified for grid-based layout */}
                {/* East (right) resize */}
                <div
                  className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-primary/60 rounded-full opacity-0 group-hover/component:opacity-100 [@media(hover:none)]:opacity-100 cursor-e-resize z-20 hover:bg-primary"
                  onMouseDown={(e) => startResize(e, component, 'e')}
                />

                {/* South (bottom) resize */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 -bottom-1 h-2 w-8 bg-primary/60 rounded-full opacity-0 group-hover/component:opacity-100 [@media(hover:none)]:opacity-100 cursor-s-resize z-20 hover:bg-primary"
                  onMouseDown={(e) => startResize(e, component, 's')}
                />

                {/* Southeast corner resize */}
                <div
                  className="absolute -right-1 -bottom-1 w-3 h-3 bg-primary rounded-full opacity-0 group-hover/component:opacity-100 [@media(hover:none)]:opacity-100 cursor-se-resize z-20 shadow-sm"
                  onMouseDown={(e) => startResize(e, component, 'se')}
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
