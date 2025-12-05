/**
 * CanvasEmptyState - Empty state displayed when no artboards exist
 */

import { Plus } from 'lucide-react';

export default function CanvasEmptyState() {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-center space-y-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/25 bg-background/50 backdrop-blur-sm">
                    <Plus className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                        No artboards yet
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                        Click "Add Artboard" to create a new canvas with a specific format
                    </p>
                </div>
            </div>
        </div>
    );
}
