import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuTrigger,
} from '@/modules/DesignSystem/ui/context-menu';
import { Layers, Trash2 } from 'lucide-react';

interface ComponentContextMenuProps {
    children: React.ReactNode;
    onZOrderChange?: (operation: 'front' | 'forward' | 'back' | 'backward') => void;
    onDelete: () => void;
}

export function ComponentContextMenu({ children, onZOrderChange, onDelete }: ComponentContextMenuProps) {
    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-48">
                {onZOrderChange && (
                    <>
                        <ContextMenuItem onClick={() => onZOrderChange('front')}>
                            <Layers className="mr-2 h-4 w-4" />
                            Bring to Front
                            <ContextMenuShortcut>]</ContextMenuShortcut>
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => onZOrderChange('forward')}>
                            <Layers className="mr-2 h-4 w-4" />
                            Bring Forward
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => onZOrderChange('back')}>
                            <Layers className="mr-2 h-4 w-4" />
                            Send to Back
                            <ContextMenuShortcut>[</ContextMenuShortcut>
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => onZOrderChange('backward')}>
                            <Layers className="mr-2 h-4 w-4" />
                            Send Backward
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                    </>
                )}
                <ContextMenuItem variant="destructive" onClick={onDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Component
                    <ContextMenuShortcut>⌫</ContextMenuShortcut>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}

