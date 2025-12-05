/**
 * CanvasTopBar - Top toolbar for the canvas
 * 
 * Displays dashboard title, artboard count, zoom controls, and action buttons.
 */

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CanvasTopBarProps {
    artboardCount: number;
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
    onSave: () => void;
}

export default function CanvasTopBar({
    artboardCount,
    scale,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onSave,
}: CanvasTopBarProps) {
    return (
        <div className="relative z-50 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 backdrop-blur px-6 supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold">Untitled Dashboard</h1>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                    {artboardCount} {artboardCount === 1 ? 'artboard' : 'artboards'}
                </span>
            </div>
            <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="mr-2 flex items-center rounded-md border bg-background shadow-sm">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none rounded-l-md border-r"
                        onClick={onZoomOut}
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
                        onClick={onZoomIn}
                        title="Zoom In (Ctrl++)"
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none rounded-r-md"
                        onClick={onZoomReset}
                        title="Reset Zoom (Ctrl+0)"
                    >
                        <span className="text-xs">1:1</span>
                    </Button>
                </div>

                <Button variant="outline" size="sm">Preview</Button>
                <Button
                    size="sm"
                    className="bg-black text-white hover:bg-black/90"
                    onClick={onSave}
                >
                    Save
                </Button>
            </div>
        </div>
    );
}
