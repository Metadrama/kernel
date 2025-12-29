/**
 * ArtboardInspector - Right-side panel to edit artboard properties
 */
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { ArtboardSchema } from '@/types/artboard';
import { useMemo } from 'react';

interface Props {
    artboard: ArtboardSchema | null;
    onUpdate: (updates: Partial<ArtboardSchema>) => void;
    onClose: () => void;
}

export default function ArtboardInspector({ artboard, onUpdate, onClose }: Props) {
    const isOpen = !!artboard;
    const dims = useMemo(() => artboard?.dimensions, [artboard]);

    if (!isOpen || !artboard) return null;

    return (
        <div className="flex h-full w-80 shrink-0 flex-col border-l bg-background">
            <div className="flex items-center justify-between border-b p-3">
                <div className="text-sm font-semibold">Artboard Inspector</div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    Close
                </Button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-3">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={artboard.name} onChange={(e) => onUpdate({ name: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label>Format</Label>
                        <div className="mt-1 text-xs text-muted-foreground">{dims?.label}</div>
                    </div>
                    <div>
                        <Label>DPI</Label>
                        <div className="mt-1 text-xs text-muted-foreground">{dims?.dpi}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label>Width</Label>
                        <div className="mt-1 text-xs">{dims?.widthPx}px</div>
                    </div>
                    <div>
                        <Label>Height</Label>
                        <div className="mt-1 text-xs">{dims?.heightPx}px</div>
                    </div>
                </div>

                <Separator />

                <div className="space-y-2">
                    <Label htmlFor="bg">Background Color</Label>
                    <Input id="bg" type="color" value={artboard.backgroundColor} onChange={(e) => onUpdate({ backgroundColor: e.target.value })} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bgimg">Background Image URL</Label>
                    <Input
                        id="bgimg"
                        value={artboard.backgroundImage || ''}
                        placeholder="https://..."
                        onChange={(e) => onUpdate({ backgroundImage: e.target.value })}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-sm">Show Grid Guides</div>
                    <Switch checked={artboard.showGrid} onCheckedChange={(v) => onUpdate({ showGrid: v })} />
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-sm">Show Rulers</div>
                    <Switch checked={artboard.showRulers} onCheckedChange={(v) => onUpdate({ showRulers: v })} />
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-sm">Clip Content</div>
                    <Switch checked={artboard.clipContent} onCheckedChange={(v) => onUpdate({ clipContent: v })} />
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-sm">Lock Position</div>
                    <Switch checked={artboard.locked} onCheckedChange={(v) => onUpdate({ locked: v })} />
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-sm">Visible</div>
                    <Switch checked={artboard.visible} onCheckedChange={(v) => onUpdate({ visible: v })} />
                </div>
            </div>
        </div>
    );
}
