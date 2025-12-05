/**
 * EmptyWidgetState - Empty state for widgets without components
 */

import { Plus, GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { forwardRef } from 'react';

interface EmptyWidgetStateProps {
    isDragOver: boolean;
    onDelete?: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
}

const EmptyWidgetState = forwardRef<HTMLDivElement, EmptyWidgetStateProps>(
    ({ isDragOver, onDelete, onDragOver, onDragLeave, onDrop }, ref) => {
        return (
            <div
                ref={ref}
                className={`group relative h-full w-full rounded-lg border-2 border-dashed bg-card text-card-foreground shadow-sm transition-all duration-200 ease-out hover:shadow-md ${isDragOver
                        ? 'border-primary bg-primary/5 shadow-lg scale-[1.01]'
                        : 'hover:border-primary/50'
                    }`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                {/* Toolbar */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div className="widget-drag-handle cursor-move px-2 py-1 rounded bg-muted/90 backdrop-blur-sm border shadow-sm hover:bg-muted">
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 bg-muted/90 backdrop-blur-sm border shadow-sm"
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
                        <div className={`mx-auto h-12 w-12 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-200 ${isDragOver
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
);

EmptyWidgetState.displayName = 'EmptyWidgetState';

export default EmptyWidgetState;
