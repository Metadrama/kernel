import { useState, useCallback } from 'react';
import { Trash2, Plus, GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isComponentRegistered, getComponent } from '@/components/widget-components';
import type { WidgetSchema, ComponentCard, WidgetComponent } from '@/types/dashboard';

interface WidgetShellProps {
  widget: WidgetSchema;
  onDelete?: () => void;
  onAddComponent?: (component: ComponentCard) => void;
  onRemoveComponent?: (instanceId: string) => void;
  onReorderComponents?: (components: WidgetComponent[]) => void;
  onUpdateComponentConfig?: (instanceId: string, config: Record<string, unknown>) => void;
}

export default function WidgetShell({ 
  widget, 
  onDelete, 
  onAddComponent,
  onRemoveComponent,
  onReorderComponents,
}: WidgetShellProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingInstanceId, setDraggingInstanceId] = useState<string | null>(null);

  const components = widget.components || [];
  const isEmpty = components.length === 0;

  // Handle external component drop (from sidebar)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if this is an external component drag
    const types = e.dataTransfer.types;
    if (types.includes('application/json')) {
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, insertIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragOverIndex(null);
    
    try {
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;
      
      const parsed = JSON.parse(data);
      
      // Check if it's an internal reorder (has instanceId) or external drop (ComponentCard)
      if (parsed.instanceId && parsed.fromWidgetId === widget.id) {
        // Internal reorder
        if (insertIndex !== undefined && onReorderComponents) {
          const newComponents = [...components];
          const fromIndex = components.findIndex(c => c.instanceId === parsed.instanceId);
          if (fromIndex !== -1 && fromIndex !== insertIndex) {
            const [removed] = newComponents.splice(fromIndex, 1);
            const adjustedIndex = insertIndex > fromIndex ? insertIndex - 1 : insertIndex;
            newComponents.splice(adjustedIndex, 0, removed);
            onReorderComponents(newComponents);
          }
        }
      } else if (parsed.id && parsed.category) {
        // External component from sidebar
        onAddComponent?.(parsed as ComponentCard);
      }
    } catch (error) {
      console.error('Failed to parse dropped data:', error);
    }
  }, [widget.id, components, onAddComponent, onReorderComponents]);

  // Handle internal component drag start
  const handleComponentDragStart = useCallback((e: React.DragEvent, component: WidgetComponent) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      ...component,
      fromWidgetId: widget.id,
    }));
    setDraggingInstanceId(component.instanceId);
  }, [widget.id]);

  const handleComponentDragEnd = useCallback(() => {
    setDraggingInstanceId(null);
    setDragOverIndex(null);
  }, []);

  const handleComponentDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(index);
  }, []);

  // Empty widget state
  if (isEmpty) {
    return (
      <div 
        className={`group relative h-full w-full rounded-lg border-2 border-dashed bg-card text-card-foreground shadow-sm transition-all duration-200 ease-out hover:shadow-md ${
          isDragOver 
            ? 'border-primary bg-primary/5 shadow-lg scale-[1.01]' 
            : 'hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e)}
      >
        {/* Delete button */}
        <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Empty state content */}
        <div className="flex h-full items-center justify-center p-6">
          <div className={`text-center space-y-3 max-w-xs transition-all duration-200 ${isDragOver ? 'scale-95 opacity-50' : ''}`}>
            <div className={`mx-auto h-14 w-14 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-200 ${
              isDragOver 
                ? 'border-primary bg-primary/10' 
                : 'border-muted-foreground/30'
            }`}>
              <Plus className={`h-6 w-6 ${isDragOver ? 'text-primary animate-pulse' : 'text-muted-foreground/50'}`} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                {isDragOver ? 'Drop Component' : 'Empty Widget'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isDragOver 
                  ? 'Release to add component' 
                  : 'Drag components here'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Widget with components
  return (
    <div 
      className={`group relative h-full w-full rounded-lg border-2 bg-card text-card-foreground shadow-sm transition-all duration-200 ease-out hover:shadow-md ${
        isDragOver ? 'border-primary' : 'hover:border-primary/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, components.length)}
    >
      {/* Widget actions */}
      <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-20">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Components container */}
      <div className="h-full w-full flex flex-col overflow-hidden">
        {components.map((component, index) => {
          const ComponentToRender = getComponent(component.componentType);
          const isRegistered = isComponentRegistered(component.componentType);
          const isDragging = draggingInstanceId === component.instanceId;
          const isDropTarget = dragOverIndex === index;

          return (
            <div
              key={component.instanceId}
              className={`relative flex-1 min-h-0 group/component transition-all duration-150 ${
                isDragging ? 'opacity-50' : ''
              } ${isDropTarget ? 'border-t-2 border-primary' : ''}`}
              draggable
              onDragStart={(e) => handleComponentDragStart(e, component)}
              onDragEnd={handleComponentDragEnd}
              onDragOver={(e) => handleComponentDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
            >
              {/* Component drag handle and remove button */}
              <div className="absolute left-2 top-2 flex items-center gap-1 opacity-0 group-hover/component:opacity-100 transition-opacity z-10">
                <div className="cursor-grab active:cursor-grabbing p-1 rounded bg-background/80 backdrop-blur-sm hover:bg-accent">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
              <div className="absolute right-10 top-2 opacity-0 group-hover/component:opacity-100 transition-opacity z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveComponent?.(component.instanceId);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Render the component */}
              {isRegistered && ComponentToRender ? (
                <div className="h-full w-full">
                  <ComponentToRender config={component.config} />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center p-4">
                  <p className="text-sm text-muted-foreground">
                    Unknown component: {component.componentType}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* Drop zone at the bottom when dragging */}
        {isDragOver && (
          <div 
            className="h-16 border-2 border-dashed border-primary/50 bg-primary/5 rounded-lg m-2 flex items-center justify-center"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOverIndex(components.length);
            }}
            onDrop={(e) => handleDrop(e, components.length)}
          >
            <Plus className="h-5 w-5 text-primary/50" />
          </div>
        )}
      </div>
    </div>
  );
}
