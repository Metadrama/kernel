/**
 * ArtboardHeaderOverlay - Scale-independent artboard headers
 * 
 * Renders artboard headers in a fixed overlay layer,
 * positioned absolutely in screen space regardless of canvas zoom.
 */

import { Lock, Unlock, EyeOff, Trash2, Copy, MoreVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ArtboardSchema } from '@/types/artboard';

interface ArtboardHeaderOverlayProps {
    artboards: ArtboardSchema[];
    canvasScale: number;
    canvasPan: { x: number; y: number };
    selectedArtboardId: string | null;
    artboardStackOrder: string[];
    contextMenuState: {
        [artboardId: string]: {
            open: boolean;
            position: { x: number; y: number } | null;
        };
    };
    onUpdate: (artboardId: string, updates: Partial<ArtboardSchema>) => void;
    onDelete: (artboardId: string) => void;
    onSelect: (artboardId: string) => void;
    onAddWidget: (artboardId: string) => void;
    onContextMenuChange: (artboardId: string, open: boolean, position?: { x: number; y: number }) => void;
}

export default function ArtboardHeaderOverlay({
    artboards,
    canvasScale,
    canvasPan,
    selectedArtboardId,
    artboardStackOrder,
    contextMenuState,
    onUpdate,
    onDelete,
    onSelect,
    onAddWidget,
    onContextMenuChange,
}: ArtboardHeaderOverlayProps) {
    /**
     * Convert canvas coordinates to screen coordinates
     */
    const canvasToScreen = (canvasX: number, canvasY: number) => {
        return {
            x: canvasX * canvasScale + canvasPan.x,
            y: canvasY * canvasScale + canvasPan.y,
        };
    };

    return (
        <div className="pointer-events-none absolute inset-0 z-[100]">
            {artboardStackOrder
                .map(id => artboards.find(a => a.id === id))
                .filter((artboard): artboard is ArtboardSchema => artboard !== undefined && artboard.visible)
                .map((artboard, index) => {
                    const screenPos = canvasToScreen(artboard.position.x, artboard.position.y);
                    const screenWidth = artboard.dimensions.widthPx * canvasScale;
                    const menuState = contextMenuState[artboard.id] || { open: false, position: null };

                    return (
                        <div
                            key={artboard.id}
                            className="group pointer-events-auto absolute"
                            style={{
                                left: screenPos.x,
                                top: screenPos.y,
                                width: screenWidth,
                                height: 40, // Fixed header height
                                zIndex: 100 + index, // Match artboard stack order
                            }}
                        >
                            <div
                                className={`flex h-full items-center justify-between bg-muted/80 backdrop-blur-sm px-3 border-b border-border cursor-move ${selectedArtboardId === artboard.id ? 'ring-2 ring-primary' : ''
                                    }`}
                                style={{
                                    transition: 'none', // No transition during drag/zoom
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold truncate">{artboard.name}</span>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {artboard.dimensions.label}
                                    </span>
                                    {artboard.locked && <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <DropdownMenu
                                        open={menuState.open}
                                        onOpenChange={(open) => onContextMenuChange(artboard.id, open, menuState.position || undefined)}
                                        cursorPosition={menuState.open && menuState.position ? menuState.position : null}
                                    >
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelect(artboard.id);
                                                }}
                                            >
                                                <MoreVertical className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onAddWidget(artboard.id)}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Widget
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => console.log('Duplicate artboard')}>
                                                <Copy className="mr-2 h-4 w-4" />
                                                Duplicate
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => onUpdate(artboard.id, { locked: !artboard.locked })}
                                            >
                                                {artboard.locked ? (
                                                    <>
                                                        <Unlock className="mr-2 h-4 w-4" />
                                                        Unlock
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock className="mr-2 h-4 w-4" />
                                                        Lock Position
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onUpdate(artboard.id, { visible: false })}>
                                                <EyeOff className="mr-2 h-4 w-4" />
                                                Hide
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => onDelete(artboard.id)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete Artboard
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </div>
                    );
                })}
        </div>
    );
}
