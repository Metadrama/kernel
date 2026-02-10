import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from '@/modules/DesignSystem/ui/context-menu';
import { ChevronRight } from 'lucide-react';

// ── Callback types ──────────────────────────────────────────────────────────

export interface ComponentContextMenuActions {
    // Clipboard
    onCopy?: () => void;
    onPaste?: () => void;
    onPasteReplace?: () => void;
    // Copy/Paste-as submenu (placeholders)
    onCopyAsCode?: () => void;
    onCopyAsPng?: () => void;
    onCopyProperties?: () => void;
    onPasteProperties?: () => void;
    // Z-order
    onZOrderChange?: (operation: 'front' | 'forward' | 'back' | 'backward') => void;
    // Organisation (placeholders)
    onConvertToSection?: () => void;
    onGroupSelection?: () => void;
    onFrameSelection?: () => void;
    onUngroup?: () => void;
    onFlatten?: () => void;
    onOutlineStroke?: () => void;
    onUseAsMask?: () => void;
    // Widgets submenu (placeholder)
    onSaveAsPreset?: () => void;
    // State & orientation
    onToggleVisibility?: () => void;
    onToggleLock?: () => void;
    onFlipHorizontal?: () => void;
    onFlipVertical?: () => void;
    // Destructive
    onDelete: () => void;
}

interface ComponentContextMenuProps extends ComponentContextMenuActions {
    children: React.ReactNode;
    /** Current locked state – drives the label/icon */
    isLocked?: boolean;
    /** Current hidden state – drives the label/icon */
    isHidden?: boolean;
    /** Whether clipboard has content ready to paste */
    hasClipboard?: boolean;
}

// Placeholder click handler – logs intent so we know the feature was exercised
const placeholder = (label: string) => () => {
    console.log(`[ContextMenu] "${label}" – not yet implemented`);
};

export function ComponentContextMenu({
    children,
    isLocked = false,
    isHidden = false,
    hasClipboard = false,
    onCopy,
    onPaste,
    onPasteReplace,
    onCopyAsCode,
    onCopyAsPng,
    onCopyProperties,
    onPasteProperties,
    onZOrderChange,
    onConvertToSection,
    onGroupSelection,
    onFrameSelection,
    onUngroup,
    onFlatten,
    onOutlineStroke,
    onUseAsMask,
    onSaveAsPreset,
    onToggleVisibility,
    onToggleLock,
    onFlipHorizontal,
    onFlipVertical,
    onDelete,
}: ComponentContextMenuProps) {
    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-64 p-1">
                {/* ── Clipboard ────────────────────────────────── */}
                <ContextMenuItem onClick={onCopy}>
                    Copy
                    <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem disabled={!hasClipboard} onClick={onPaste}>
                    Paste here
                </ContextMenuItem>

                <ContextMenuItem disabled={!hasClipboard} onClick={onPasteReplace ?? placeholder('Paste to replace')}>
                    Paste to replace
                    <ContextMenuShortcut>Ctrl+⇧+R</ContextMenuShortcut>
                </ContextMenuItem>

                {/* Copy / Paste as – submenu */}
                <ContextMenuSub>
                    <ContextMenuSubTrigger>
                        Copy / Paste as
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-48">
                        <ContextMenuItem disabled onClick={onCopyAsCode ?? placeholder('Copy as code')}>
                            Copy as code
                        </ContextMenuItem>
                        <ContextMenuItem disabled onClick={onCopyAsPng ?? placeholder('Copy as PNG')}>
                            Copy as PNG
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem disabled onClick={onCopyProperties ?? placeholder('Copy properties')}>
                            Copy properties
                        </ContextMenuItem>
                        <ContextMenuItem disabled onClick={onPasteProperties ?? placeholder('Paste properties')}>
                            Paste properties
                        </ContextMenuItem>
                    </ContextMenuSubContent>
                </ContextMenuSub>

                <ContextMenuSeparator />

                {/* ── Z-order ──────────────────────────────────── */}
                {onZOrderChange && (
                    <>
                        <ContextMenuItem onClick={() => onZOrderChange('front')}>
                            Bring to front
                            <ContextMenuShortcut>]</ContextMenuShortcut>
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => onZOrderChange('back')}>
                            Send to back
                            <ContextMenuShortcut>[</ContextMenuShortcut>
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                    </>
                )}

                {/* ── Organisation (placeholders) ─────────────── */}
                <ContextMenuItem disabled onClick={onConvertToSection ?? placeholder('Convert to section')}>
                    Convert to section
                </ContextMenuItem>

                <ContextMenuItem disabled onClick={onGroupSelection ?? placeholder('Group selection')}>
                    Group selection
                    <ContextMenuShortcut>Ctrl+G</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem disabled onClick={onFrameSelection ?? placeholder('Frame selection')}>
                    Frame selection
                    <ContextMenuShortcut>Ctrl+Alt+G</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem disabled onClick={onUngroup ?? placeholder('Ungroup')}>
                    Ungroup
                    <ContextMenuShortcut>Ctrl+⇧+G</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem disabled onClick={onFlatten ?? placeholder('Flatten')}>
                    Flatten
                    <ContextMenuShortcut>Alt+⇧+F</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem disabled onClick={onOutlineStroke ?? placeholder('Outline stroke')}>
                    Outline stroke
                    <ContextMenuShortcut>Ctrl+Alt+O</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem disabled onClick={onUseAsMask ?? placeholder('Use as mask')}>
                    Use as mask
                    <ContextMenuShortcut>Ctrl+Alt+M</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuSeparator />

                {/* ── Widgets submenu (placeholder) ───────────── */}
                <ContextMenuSub>
                    <ContextMenuSubTrigger>
                        Widgets
                    </ContextMenuSubTrigger>
                    <ContextMenuSubContent className="w-44">
                        <ContextMenuItem disabled onClick={onSaveAsPreset ?? placeholder('Save as preset')}>
                            Save as preset
                        </ContextMenuItem>
                    </ContextMenuSubContent>
                </ContextMenuSub>

                <ContextMenuSeparator />

                {/* ── State & Orientation ──────────────────────── */}
                <ContextMenuItem onClick={onToggleVisibility}>
                    {isHidden ? 'Show' : 'Hide'}
                    <ContextMenuShortcut>Ctrl+⇧+H</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem onClick={onToggleLock}>
                    {isLocked ? 'Unlock' : 'Lock'}
                    <ContextMenuShortcut>Ctrl+⇧+L</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem onClick={onFlipHorizontal}>
                    Flip horizontal
                    <ContextMenuShortcut>⇧+H</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem onClick={onFlipVertical}>
                    Flip vertical
                    <ContextMenuShortcut>⇧+V</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuSeparator />

                {/* ── Destructive ─────────────────────────────── */}
                <ContextMenuItem variant="destructive" onClick={onDelete}>
                    Delete
                    <ContextMenuShortcut>⌫</ContextMenuShortcut>
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}

