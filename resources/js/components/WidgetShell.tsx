import { Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WidgetSchema } from '@/types/dashboard';

interface WidgetShellProps {
  widget: WidgetSchema;
  onConfigure?: () => void;
  onDelete?: () => void;
  isGhostBox?: boolean;
}

export default function WidgetShell({ widget, onConfigure, onDelete, isGhostBox = true }: WidgetShellProps) {
  const displayName = widget.config?.name || widget.componentType || 'Empty Widget';
  const displayDescription = widget.config?.description || 'Click configure to add content';
  
  // Ghost Box: Empty widget waiting to be configured
  if (isGhostBox && widget.componentType === 'empty') {
    return (
      <div className="group relative h-full w-full rounded-lg border-2 border-dashed bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50 cursor-move">
        {/* Actions */}
        <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Ghost Box Content */}
        <div className="flex h-full items-center justify-center p-8" onClick={onConfigure}>
          <div className="text-center space-y-4 max-w-sm cursor-pointer">
            <div className="mx-auto h-16 w-16 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
              <Settings className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Configure Widget
              </h3>
              <p className="text-sm text-muted-foreground">
                Click anywhere to open the Component Toolbox and select what this widget should display
              </p>
            </div>
            <Button variant="outline" size="sm" className="mt-2 pointer-events-none">
              <Settings className="mr-2 h-3 w-3" />
              Open Toolbox
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Configured Widget: Has a component type selected
  return (
    <div className="group relative h-full w-full rounded-lg border-2 bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50 cursor-move">{/* Actions */}
      <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-background/80 backdrop-blur-sm"
          onClick={onConfigure}
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-background/80 backdrop-blur-sm text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center space-y-3 max-w-sm">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="h-6 w-6 rounded bg-primary/20" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              {displayName}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {displayDescription}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onConfigure} className="mt-2">
            <Settings className="mr-2 h-3 w-3" />
            Configure Widget
          </Button>
        </div>
      </div>
    </div>
  );
}
