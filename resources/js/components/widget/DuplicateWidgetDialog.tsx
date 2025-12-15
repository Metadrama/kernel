/**
 * DuplicateWidgetDialog - Dialog to duplicate a widget with a specified count
 */

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface DuplicateWidgetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDuplicate: (count: number, options?: { fill?: boolean }) => void;
}

export default function DuplicateWidgetDialog({
    open,
    onOpenChange,
    onDuplicate,
}: DuplicateWidgetDialogProps) {
    const [count, setCount] = useState(1);
    const [fillArtboard, setFillArtboard] = useState(false);

    const handleDuplicate = () => {
        onDuplicate(count, { fill: fillArtboard });
        onOpenChange(false);
        setCount(1); // Reset for next time
        setFillArtboard(false);
    };

    // Auto-set count to 1 if fill is enabled (can't fill with multiple)
    const handleFillChange = (checked: boolean) => {
        setFillArtboard(checked);
        if (checked) setCount(1);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[360px]">
                <DialogHeader>
                    <DialogTitle>Duplicate Widget</DialogTitle>
                    <DialogDescription>
                        Create copies of this widget.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="count" className="text-right">
                            Copies
                        </Label>
                        <Input
                            id="count"
                            type="number"
                            min={1}
                            max={20}
                            value={count}
                            onChange={(e) => setCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                            disabled={fillArtboard}
                            className="col-span-3"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="fill-mode" className="text-right">
                            Fill Artboard
                        </Label>
                        <div className="col-span-3 flex items-center space-x-2">
                            <Switch
                                id="fill-mode"
                                checked={fillArtboard}
                                onCheckedChange={handleFillChange}
                            />
                            <Label htmlFor="fill-mode" className="text-xs text-muted-foreground font-normal">
                                Resize to cover artboard
                            </Label>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" onClick={handleDuplicate}>
                        Duplicate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
