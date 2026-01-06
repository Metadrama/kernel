import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import type { SavedDataSource } from '@/features/data-sources/types/component-config';
import { FileSpreadsheet, FolderOpen, Trash2 } from 'lucide-react';

interface SavedSourcesSectionProps {
    savedSources: SavedDataSource[];
    loading: boolean;
    disabled?: boolean;
    onLoad: (source: SavedDataSource) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
}

export function SavedSourcesSection({
    savedSources,
    loading,
    disabled,
    onLoad,
    onDelete,
}: SavedSourcesSectionProps) {
    if (savedSources.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Saved Sources
            </Label>
            <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                {savedSources.map((source) => (
                    <div
                        key={source.id}
                        className={`flex items-center justify-between text-xs p-2 rounded-md bg-muted/30 group ${disabled || loading
                                ? 'opacity-50 cursor-not-allowed pointer-events-none'
                                : 'hover:bg-muted/50 cursor-pointer'
                            }`}
                        onClick={() => !disabled && !loading && onLoad(source)}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <FileSpreadsheet className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{source.name}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => onDelete(source.id, e)}
                            disabled={disabled || loading}
                        >
                            <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}


