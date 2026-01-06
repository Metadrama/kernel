import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportArtboardToJson, exportArtboardToPdf } from '@/lib/artboard-utils';
import type { ArtboardSchema } from '@/types/artboard';
import { FileJson, FileType, Lock, MoreVertical, Trash2, Unlock } from 'lucide-react';

interface ArtboardHeaderProps {
    artboard: ArtboardSchema;
    canvasScale: number;
    displayPosition: { x: number; y: number };
    zIndex: number;
    isDragging: boolean;
    headerOffset: number;
    onMouseDown: (e: React.MouseEvent) => void;
    onUpdate: (updates: Partial<ArtboardSchema>) => void;
    onDelete: () => void;
}

export function ArtboardHeader({
    artboard,
    canvasScale,
    displayPosition,
    zIndex,
    isDragging,
    headerOffset,
    onMouseDown,
    onUpdate,
    onDelete,
}: ArtboardHeaderProps) {
    return (
        <div
            className="artboard-header group absolute flex h-13 cursor-move items-center justify-between px-0.5"
            style={{
                left: displayPosition.x,
                top: displayPosition.y - headerOffset / canvasScale,
                transform: `scale(${1 / canvasScale})`,
                transformOrigin: 'top left',
                width: `${artboard.dimensions.widthPx * canvasScale}px`,
                zIndex: zIndex + 1000,
                pointerEvents: 'auto',
                transition: isDragging ? 'none' : undefined,
                background: 'transparent',
            }}
            onMouseDown={onMouseDown}
        >
            <div className="flex min-w-0 flex-1 items-center gap-2">
                <span className="truncate text-sm font-semibold">{artboard.name}</span>
                <span className="text-xs whitespace-nowrap text-muted-foreground">{artboard.dimensions.label}</span>
                {artboard.locked && <Lock className="h-3 w-3 flex-shrink-0 text-muted-foreground" />}
            </div>

            <div className="flex items-center gap-1">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreVertical className="h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => exportArtboardToJson(artboard)}>
                            <FileJson className="mr-2 h-4 w-4" />
                            Export JSON
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportArtboardToPdf(artboard)}>
                            <FileType className="mr-2 h-4 w-4" />
                            Export PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onUpdate({ locked: !artboard.locked })}>
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onDelete} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Artboard
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
