/**
 * WidgetToolbar - Toolbar for widget actions (drag handle, delete)
 */

import { GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WidgetToolbarProps {
    onDelete?: () => void;
    visible?: boolean;
    /** Whether to show the drag handle (default: true). Set to false when handle is rendered externally. */
    showDragHandle?: boolean;
}

export default function WidgetToolbar({ onDelete, visible = true, showDragHandle = true }: WidgetToolbarProps) {
    if (!visible) return null;

    return (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity z-30">
            {showDragHandle && (
                <div className="widget-drag-handle cursor-move px-2 py-1 rounded bg-muted/90 backdrop-blur-sm border shadow-sm hover:bg-muted">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 bg-muted/90 backdrop-blur-sm border shadow-sm"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.();
                }}
            >
                <Trash2 className="h-3 w-3" />
            </Button>
        </div>
    );
}
