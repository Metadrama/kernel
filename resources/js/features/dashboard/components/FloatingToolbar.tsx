import { MousePointer2, Hand, Square, Type, Frame, MoreHorizontal } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/shared/components/ui/tooltip';

export type ToolType = 'pointer' | 'hand';

interface FloatingToolbarProps {
    activeTool: ToolType;
    onToolChange: (tool: ToolType) => void;
    onAddArtboard: () => void;
    onAddCard: () => void;
}

export default function FloatingToolbar({
    activeTool,
    onToolChange,
    onAddArtboard,
    onAddCard,
}: FloatingToolbarProps) {
    return (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-xl border bg-background p-1.5 shadow-lg">
            <TooltipProvider delayDuration={300}>
                {/* Add Artboard (Frame) - First Position */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
                            onClick={onAddArtboard}
                        >
                            <Frame className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                        Frame (F)
                    </TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="mx-1 h-6" />

                {/* Pointer Tool */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={activeTool === 'pointer' ? 'secondary' : 'ghost'}
                            size="icon"
                            className={`h-9 w-9 rounded-lg ${activeTool === 'pointer' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => onToolChange('pointer')}
                        >
                            <MousePointer2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                        Move (V)
                    </TooltipContent>
                </Tooltip>

                {/* Hand Tool */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant={activeTool === 'hand' ? 'secondary' : 'ghost'}
                            size="icon"
                            className={`h-9 w-9 rounded-lg ${activeTool === 'hand' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => onToolChange('hand')}
                        >
                            <Hand className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                        Hand tool (H)
                    </TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="mx-1 h-6" />

                {/* Add Empty Card (was Shapes) */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
                            onClick={onAddCard}
                        >
                            <Square className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                        Add Empty Card
                    </TooltipContent>
                </Tooltip>

                {/* Text (Placeholder) */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
                            onClick={() => console.log('Text clicked')}
                        >
                            <Type className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                        Text (T)
                    </TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="mx-1 h-6" />

                {/* More / Resources */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                        Resources
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}

