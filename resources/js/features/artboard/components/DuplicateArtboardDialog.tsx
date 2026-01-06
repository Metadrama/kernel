import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Copy } from 'lucide-react';

interface DuplicateArtboardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDuplicate: (count: number) => void;
    artboardName: string;
}

export default function DuplicateArtboardDialog({
    open,
    onOpenChange,
    onDuplicate,
    artboardName,
}: DuplicateArtboardDialogProps) {
    const [count, setCount] = useState(1);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onDuplicate(count);
        onOpenChange(false);
        // Reset count for next time
        setTimeout(() => setCount(1), 300);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Duplicate Artboard</DialogTitle>
                    <DialogDescription>
                        Create copies of "{artboardName}" placed next to your existing artboards.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="copies" className="text-right">
                                Copies
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="copies"
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={count}
                                    onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            New artboards will be placed automatically to the right.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

