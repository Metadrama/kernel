import { Settings, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WidgetSchema } from '@/types/dashboard';

interface WidgetShellProps {
  widget: WidgetSchema;
  onConfigure?: () => void;
  onDelete?: () => void;
}

export default function WidgetShell({ widget, onConfigure, onDelete }: WidgetShellProps) {
  const displayName = widget.config?.name || widget.componentType || 'Empty Widget';
  const displayDescription = widget.config?.description || 'Click configure to add content';
  
  return (
    <div className="group relative h-full w-full rounded-lg border-2 bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50">
      {/* Drag Handle */}
      <div className="absolute left-3 top-3 cursor-move opacity-0 transition-opacity group-hover:opacity-100 z-10">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Actions */}
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
