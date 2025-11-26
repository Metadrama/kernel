import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import WidgetShell from '@/components/WidgetShell';
import ComponentToolbox from '@/components/ComponentToolbox';
import type { WidgetSchema } from '@/types/dashboard';
import type { ComponentCard } from '@/types/dashboard';

export default function DashboardCanvas() {
  const gridRef = useRef<HTMLDivElement>(null);
  const gridInstanceRef = useRef<GridStack | null>(null);
  const [widgets, setWidgets] = useState<WidgetSchema[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [configuringWidgetId, setConfiguringWidgetId] = useState<string | null>(null);

  useEffect(() => {
    if (!gridRef.current) return;

    // Initialize Gridstack
    const grid = GridStack.init(
      {
        column: 12,
        cellHeight: 60,
        margin: 8,
        float: false,
        animate: true,
        resizable: {
          handles: 'e, se, s, sw, w',
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
              return {
                ...widget,
                x: updated.x ?? widget.x,
                y: updated.y ?? widget.y,
                w: updated.w ?? widget.w,
                h: updated.h ?? widget.h,
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

  const addWidget = (componentData?: ComponentCard) => {
    const newWidget: WidgetSchema = {
      id: `widget-${Date.now()}`,
      x: 0,
      y: 0,
      w: 6,
      h: 4,
      componentType: componentData?.name || 'empty',
      config: componentData ? { ...componentData } : undefined,
    };

    setWidgets((prev) => [...prev, newWidget]);

    // Add to Gridstack with a small delay to ensure DOM is ready
    setTimeout(() => {
      if (gridInstanceRef.current) {
        const element = document.getElementById(newWidget.id);
        if (element) {
          gridInstanceRef.current.makeWidget(element);
        }
      }
    }, 10);
  };

  const deleteWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    if (gridInstanceRef.current) {
      const element = document.getElementById(id);
      if (element) {
        gridInstanceRef.current.removeWidget(element);
      }
    }
  };

  const configureWidget = (widgetId: string) => {
    setConfiguringWidgetId(widgetId);
  };

  const handleComponentSelect = (component: ComponentCard) => {
    if (!configuringWidgetId) return;

    setWidgets((prev) =>
      prev.map((widget) =>
        widget.id === configuringWidgetId
          ? {
              ...widget,
              componentType: component.id,
              config: {
                name: component.name,
                description: component.description,
                icon: component.icon,
              },
            }
          : widget
      )
    );

    setConfiguringWidgetId(null);
  };

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
      const componentData = JSON.parse(e.dataTransfer.getData('application/json'));
      addWidget(componentData);
    } catch (error) {
      console.error('Failed to parse dropped component:', error);
    }
  };

  return (
    <div
      className="relative flex h-screen flex-1 flex-col overflow-auto bg-muted/30"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Grid Background Pattern */}
      <div
        className={`absolute inset-0 transition-opacity ${
          isDragOver ? 'opacity-[0.03]' : 'opacity-[0.015]'
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

      {/* Empty State */}
      {widgets.length === 0 && (
        <div className="relative flex flex-1 items-center justify-center pointer-events-none">
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/25">
              <Plus className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Your canvas is empty
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Click "Add Component" to start building your dashboard
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gridstack Container */}
      <div className="relative flex-1 p-4 pt-16">
        <div ref={gridRef} className="grid-stack">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              id={widget.id}
              className="grid-stack-item"
              gs-id={widget.id}
              gs-x={widget.x}
              gs-y={widget.y}
              gs-w={widget.w}
              gs-h={widget.h}
            >
              <div className="grid-stack-item-content">
                <WidgetShell
                  widget={widget}
                  isGhostBox={widget.componentType === 'empty'}
                  onConfigure={() => configureWidget(widget.id)}
                  onDelete={() => deleteWidget(widget.id)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Component Toolbox Modal */}
      <ComponentToolbox
        open={configuringWidgetId !== null}
        onOpenChange={(open) => !open && setConfiguringWidgetId(null)}
        onSelectComponent={handleComponentSelect}
      />

      {/* Top Bar (for future toolbar) */}
      <div className="absolute top-0 left-0 right-0 flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 z-10">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold">Untitled Dashboard</h1>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">
            {widgets.length} {widgets.length === 1 ? 'widget' : 'widgets'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            Preview
          </Button>
          <Button variant="outline" size="sm" onClick={() => addWidget()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Component
          </Button>
          <Button size="sm">Save</Button>
        </div>
      </div>
    </div>
  );
}
