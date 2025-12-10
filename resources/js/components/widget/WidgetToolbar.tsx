/**
 * WidgetToolbar - Minimal toolbar for widget drag handle
 * 
 * Z-order and delete actions are now in the right-click context menu
 */

import { GripVertical } from 'lucide-react';

interface WidgetToolbarProps {
    onDelete?: () => void;
    visible?: boolean;
    /** Whether to show the drag handle (default: true). Set to false when handle is rendered externally. */
    showDragHandle?: boolean;
}

export default function WidgetToolbar({
    visible = true,
    showDragHandle = true
}: WidgetToolbarProps) {
    if (!visible || !showDragHandle) return null;

    return (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity z-30">
            <div className="widget-drag-handle cursor-move px-2 py-1 rounded bg-muted/90 backdrop-blur-sm border shadow-sm hover:bg-muted">
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
        </div>
    );
}
