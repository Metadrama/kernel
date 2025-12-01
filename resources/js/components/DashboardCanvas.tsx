import { useEffect, useRef, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import WidgetShell from '@/components/WidgetShell';
import { ComponentInspector } from '@/components/config-panel';
import type { WidgetSchema, WidgetComponent } from '@/types/dashboard';
import type { ComponentCard } from '@/types/dashboard';
import type { GridPosition } from '@/lib/component-layout';
import {
  GRID_FINE_GRAIN,
  GRID_MAX_COLUMNS,
  downscaleGridUnits,
  upscaleGridUnits,
} from '@/lib/grid-resolution';

export default function DashboardCanvas() {
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInstanceRef = useRef<GridStack | null>(null);
  const [widgets, setWidgets] = useState<WidgetSchema[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [scale, setScale] = useState(1);
  
  // Component selection state for inspector
  const [selectedComponent, setSelectedComponent] = useState<{
    widgetId: string;
    component: WidgetComponent;
  } | null>(null);
  
  // Show inspector panel
  const [showInspector, setShowInspector] = useState(false);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale((prev) => Math.min(Math.max(prev * delta, 0.1), 5));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setScale((prev) => Math.min(prev * 1.1, 5));
        } else if (e.key === '-') {
          e.preventDefault();
          setScale((prev) => Math.max(prev * 0.9, 0.1));
        } else if (e.key === '0') {
          e.preventDefault();
          setScale(1);
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fineCellHeight = 60 / GRID_FINE_GRAIN;

  useEffect(() => {
    if (!gridRef.current) return;

    // Initialize Gridstack
    const grid = GridStack.init(
      {
        column: GRID_MAX_COLUMNS,
        cellHeight: fineCellHeight,
        margin: 8,
        float: false,
        animate: true,
        minRow: 1,  // Allow grid to grow dynamically
        draggable: {
          handle: '.widget-drag-handle',
        },
        resizable: {
          handles: 'e, se, s, sw, w',
          autoHide: false,  // Always show handles on hover
        },
      },
      gridRef.current
    );

    gridInstanceRef.current = grid;

    // Listen for changes
    grid.on('change', (event, items) => {
      if (items) {
        setWidgets((prev) =>
          prev.map((widget) => {
            const updated = items.find((item) => item.id === widget.id);
            if (updated) {
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
            }
            return widget;
          })
        );
      }
    });

    return () => {
      grid.destroy(false);
    };
  }, []);

  const addWidget = () => {
    const newWidget: WidgetSchema = {
      id: `widget-${Date.now()}`,
      x: 0,
      y: 0,
      w: 6,
      h: 5,  // Increased default height for better ergonomics
      components: [],
    };

    setWidgets((prev) => [...prev, newWidget]);

    // Add to Gridstack with a small delay to ensure DOM is ready
    setTimeout(() => {
      if (gridInstanceRef.current) {
        const element = document.getElementById(newWidget.id);
        if (element) {
          gridInstanceRef.current.makeWidget(element);
          // Ensure resize constraints are properly set
          gridInstanceRef.current.update(element, {
            minW: upscaleGridUnits(2),
            minH: upscaleGridUnits(2),
            maxW: GRID_MAX_COLUMNS,
          });
        }
      }
    }, 10);
  };

  const deleteWidget = (id: string) => {
    // Update state first to trigger React re-render
    setWidgets((prev) => {
      const newWidgets = prev.filter((w) => w.id !== id);

      // Remove from Gridstack after state update
      requestAnimationFrame(() => {
        if (gridInstanceRef.current) {
          const element = document.getElementById(id);
          if (element) {
            try {
              gridInstanceRef.current.removeWidget(element, false);
            } catch (e) {
              // Element may already be removed from DOM
              console.debug('Widget already removed from grid:', id);
            }
          }
        }
      });

      return newWidgets;
    });
  };

  // Add a component to a widget
  const handleAddComponentToWidget = (widgetId: string, component: ComponentCard) => {
    const newComponent: WidgetComponent = {
      instanceId: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      componentType: component.id,
      // gridPosition will be calculated by the layout system
      config: {
        name: component.name,
        description: component.description,
        icon: component.icon,
      },
    };

    setWidgets((prev) =>
      prev.map((widget) =>
        widget.id === widgetId
          ? {
            ...widget,
            components: [...(widget.components || []), newComponent],
          }
          : widget
      )
    );
  };

  // Remove a component from a widget
  const handleRemoveComponentFromWidget = (widgetId: string, instanceId: string) => {
    setWidgets((prev) =>
      prev.map((widget) =>
        widget.id === widgetId
          ? {
            ...widget,
            components: (widget.components || []).filter(c => c.instanceId !== instanceId),
          }
          : widget
      )
    );
  };

  // Reorder components within a widget
  const handleReorderComponents = (widgetId: string, newComponents: WidgetComponent[]) => {
    setWidgets((prev) =>
      prev.map((widget) =>
        widget.id === widgetId
          ? {
            ...widget,
            components: newComponents,
          }
          : widget
      )
    );
  };

  // Update a component's grid layout within a widget
  const handleUpdateComponentLayout = (widgetId: string, instanceId: string, gridPosition: GridPosition) => {
    setWidgets((prev) =>
      prev.map((widget) =>
        widget.id === widgetId
          ? {
            ...widget,
            components: (widget.components || []).map(c =>
              c.instanceId === instanceId
                ? { ...c, gridPosition }
                : c
            ),
          }
          : widget
      )
    );
  };

  // Handle component selection for inspector
  const handleSelectComponent = useCallback((widgetId: string, component: WidgetComponent) => {
    setSelectedComponent({ widgetId, component });
    setShowInspector(true);
  }, []);

  // Handle component config change from inspector
  const handleComponentConfigChange = useCallback((instanceId: string, config: Record<string, unknown>) => {
    setWidgets((prev) =>
      prev.map((widget) => ({
        ...widget,
        components: (widget.components || []).map(c =>
          c.instanceId === instanceId
            ? { ...c, config }
            : c
        ),
      }))
    );
    
    // Update selected component reference
    setSelectedComponent((prev) => {
      if (prev && prev.component.instanceId === instanceId) {
        return {
          ...prev,
          component: { ...prev.component, config },
        };
      }
      return prev;
    });
  }, []);

  // Close inspector
  const handleCloseInspector = useCallback(() => {
    setShowInspector(false);
    setSelectedComponent(null);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const componentData = JSON.parse(e.dataTransfer.getData('application/json')) as ComponentCard;

      // When dropping on canvas, create a new widget with the component inside
      // Layout system will auto-size based on component's intrinsic size
      const newComponent: WidgetComponent = {
        instanceId: `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        componentType: componentData.id,
        config: {
          name: componentData.name,
          description: componentData.description,
          icon: componentData.icon,
        },
      };

      // Calculate appropriate widget size based on component intrinsics
      // Import getComponentIntrinsicSize at the top if not already imported
      const intrinsicSize = (() => {
        try {
          // Dynamically import to avoid circular dependencies
          const { getComponentIntrinsicSize } = require('@/lib/component-layout');
          return getComponentIntrinsicSize(componentData.id);
        } catch {
          return { defaultCols: 6, defaultRows: 4 };
        }
      })();

      const newWidget: WidgetSchema = {
        id: `widget-${Date.now()}`,
        x: 0,
        y: 0,
        w: Math.max(3, Math.min(12, intrinsicSize.defaultCols)),  // Clamp between 3-12
        h: Math.max(2, Math.min(8, intrinsicSize.defaultRows + 1)), // +1 for padding, clamp 2-8
        components: [newComponent],
      };

      setWidgets((prev) => [...prev, newWidget]);

      // Add to Gridstack
      setTimeout(() => {
        if (gridInstanceRef.current) {
          const element = document.getElementById(newWidget.id);
          if (element) {
            gridInstanceRef.current.makeWidget(element);
            // Force a re-render to ensure resize handles are properly initialized
            gridInstanceRef.current.engine.nodes.forEach(node => {
              if (node.id === newWidget.id) {
                gridInstanceRef.current?.update(element, {
                  minW: 2,
                  minH: 2,
                  maxW: 12,
                });
              }
            });
          }
        }
      }, 10);
    } catch (error) {
      console.error('Failed to parse dropped component:', error);
    }
  };

  return (
    <div className="flex h-screen flex-1 overflow-hidden">
      {/* Main Canvas Area */}
      <div className="flex flex-1 flex-col overflow-hidden bg-muted/30">
      {/* Top Bar (for future toolbar) - Fixed */}
      <div className="relative z-50 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 backdrop-blur px-6 supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold">Untitled Dashboard</h1>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            {widgets.length} {widgets.length === 1 ? 'widget' : 'widgets'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="mr-2 flex items-center rounded-md border bg-background shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none rounded-l-md border-r"
              onClick={() => setScale((prev) => Math.max(prev * 0.9, 0.1))}
              title="Zoom Out (Ctrl+-)"
            >
              <span className="text-xs">-</span>
            </Button>
            <div className="flex w-14 items-center justify-center px-2 text-xs font-medium">
              {Math.round(scale * 100)}%
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none border-r"
              onClick={() => setScale((prev) => Math.min(prev * 1.1, 5))}
              title="Zoom In (Ctrl++)"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none rounded-r-md"
              onClick={() => setScale(1)}
              title="Reset Zoom (Ctrl+0)"
            >
              <span className="text-xs">1:1</span>
            </Button>
          </div>

          <Button variant="ghost" size="sm">
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={() => addWidget()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Widget
          </Button>
          <Button size="sm">Save</Button>
        </div>
      </div>

      {/* Scrollable Viewport */}
      <div
        className="relative flex-1 overflow-auto"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Empty State - Fixed relative to viewport, ignores zoom */}
        {widgets.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-center space-y-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/25 bg-background/50 backdrop-blur-sm">
                <Plus className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">
                  Your canvas is empty
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Click "Add Widget" to create an empty widget, then drag components into it
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Scaled Content Wrapper */}
        <div
          style={{
            width: `${100 * scale}%`,
            minHeight: `${100 * scale}%`,
            transformOrigin: '0 0',
          }}
        >
          {/* Scaled Content */}
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: '0 0',
              width: `${100 / scale}%`,
              minHeight: `${100 / scale}%`,
            }}
            className="relative"
          >
            {/* Grid Background Pattern */}
            <div
              className={`absolute inset-0 transition-opacity ${isDragOver ? 'opacity-[0.03]' : 'opacity-[0.015]'
                }`}
              style={{
                backgroundImage: `
                  linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
                  linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)
                `,
                backgroundSize: '24px 24px',
              }}
            />

            {/* Drop Zone Indicator */}
            {isDragOver && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-primary/5 backdrop-blur-sm pointer-events-none">
                <div className="rounded-lg border-2 border-dashed border-primary bg-background/90 px-8 py-6 text-center">
                  <Plus className="mx-auto h-12 w-12 text-primary mb-2" />
                  <p className="text-lg font-semibold text-primary">Drop to add component</p>
                </div>
              </div>
            )}

            {/* Gridstack Container */}
            <div className="relative p-4">
              <div ref={gridRef} className="grid-stack">
                {widgets.map((widget) => (
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
                    gs-max-w={GRID_MAX_COLUMNS}
                  >
                    <div className="grid-stack-item-content">
                      <WidgetShell
                        widget={widget}
                        onDelete={() => deleteWidget(widget.id)}
                        onAddComponent={(component) => handleAddComponentToWidget(widget.id, component)}
                        onRemoveComponent={(instanceId) => handleRemoveComponentFromWidget(widget.id, instanceId)}
                        onReorderComponents={(components) => handleReorderComponents(widget.id, components)}
                        onUpdateComponentLayout={(instanceId, gridPosition) => handleUpdateComponentLayout(widget.id, instanceId, gridPosition)}
                        onSelectComponent={(component) => handleSelectComponent(widget.id, component)}
                        selectedComponentId={selectedComponent?.widgetId === widget.id ? selectedComponent.component.instanceId : undefined}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      
      {/* Component Inspector Panel */}
      {showInspector && (
        <ComponentInspector
          component={selectedComponent?.component || null}
          onConfigChange={handleComponentConfigChange}
          onClose={handleCloseInspector}
        />
      )}
    </div>
  );
}
