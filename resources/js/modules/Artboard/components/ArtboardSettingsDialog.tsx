import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/modules/DesignSystem/ui/dialog';
import { Button } from '@/modules/DesignSystem/ui/button';
import { Input } from '@/modules/DesignSystem/ui/input';
import { Label } from '@/modules/DesignSystem/ui/label';
import type { Artboard } from '@/modules/Artboard/types/artboard';

interface ArtboardSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    artboard: Artboard;
    onUpdate: (artboardId: string, updates: Partial<Artboard>) => void;
}

import { ARTBOARD_CONTAINER_PADDING } from '@/modules/Artboard/lib/artboard-utils';

export default function ArtboardSettingsDialog({
    open,
    onOpenChange,
    artboard,
    onUpdate,
}: ArtboardSettingsDialogProps) {
    const [dpi, setDpi] = useState<number>(72);
    const [padding, setPadding] = useState<number>(ARTBOARD_CONTAINER_PADDING);

    useEffect(() => {
        if (open) {
            setDpi(artboard.dimensions.dpi || 72);
            setPadding(artboard.gridPadding ?? ARTBOARD_CONTAINER_PADDING);
        }
    }, [open, artboard]);

    const handleSave = () => {
        const currentDpi = artboard.dimensions.dpi || 72;
        const newDpi = dpi;

        if (newDpi <= 0) return;

        // Calculate scale ratio
        const ratio = newDpi / currentDpi;

        // Calculate new dimensions
        const newWidthPx = Math.round(artboard.dimensions.widthPx * ratio);
        const newHeightPx = Math.round(artboard.dimensions.heightPx * ratio);

        // Update artboard
        onUpdate(artboard.id, {
            dimensions: {
                ...artboard.dimensions,
                widthPx: newWidthPx,
                heightPx: newHeightPx,
                dpi: newDpi,
            },
            gridPadding: padding,
        });

        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Artboard Settings</DialogTitle>
                    <DialogDescription>
                        Adjust settings for this artboard instance.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="padding" className="text-right">
                            Padding
                        </Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <Input
                                id="padding"
                                type="number"
                                value={padding}
                                onChange={(e) => setPadding(Math.max(0, Number(e.target.value)))}
                                min={0}
                            />
                            <span className="text-sm text-muted-foreground whitespace-nowrap">px</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="dpi" className="text-right">
                            DPI
                        </Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <Input
                                id="dpi"
                                type="number"
                                value={dpi}
                                onChange={(e) => setDpi(Number(e.target.value))}
                                min={1}
                            />
                            <span className="text-sm text-muted-foreground whitespace-nowrap">dpi</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs text-muted-foreground">
                            Current Size
                        </Label>
                        <div className="col-span-3 text-xs text-muted-foreground">
                            {artboard.dimensions.widthPx} x {artboard.dimensions.heightPx} px
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs text-muted-foreground">
                            New Size
                        </Label>
                        <div className="col-span-3 text-xs text-muted-foreground">
                            {Math.round(artboard.dimensions.widthPx * (dpi / (artboard.dimensions.dpi || 72)))} x {Math.round(artboard.dimensions.heightPx * (dpi / (artboard.dimensions.dpi || 72)))} px
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSave}>
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


