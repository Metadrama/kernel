import { Button } from '@/modules/DesignSystem/ui/button';
import { Label } from '@/modules/DesignSystem/ui/label';
import type { SavedSpreadsheet } from '@/modules/DataLayer/hooks/use-saved-spreadsheets';
import { Bookmark, Link, Trash2 } from 'lucide-react';

interface SavedSpreadsheetsSectionProps {
    savedSpreadsheets: SavedSpreadsheet[];
    loading: boolean;
    disabled?: boolean;
    onLoad: (spreadsheet: SavedSpreadsheet) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
}

export function SavedSpreadsheetsSection({
    savedSpreadsheets,
    loading,
    disabled,
    onLoad,
    onDelete,
}: SavedSpreadsheetsSectionProps) {
    if (savedSpreadsheets.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
                <Bookmark className="h-4 w-4" />
                Saved Spreadsheets
            </Label>
            <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                {savedSpreadsheets.map((spreadsheet) => (
                    <div
                        key={spreadsheet.id}
                        className={`flex items-center justify-between text-xs p-2 rounded-md bg-muted/30 group ${disabled || loading
                            ? 'opacity-50 cursor-not-allowed pointer-events-none'
                            : 'hover:bg-muted/50 cursor-pointer'
                            }`}
                        onClick={() => !disabled && !loading && onLoad(spreadsheet)}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <Link className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate font-medium">{spreadsheet.name}</span>
                            {spreadsheet.spreadsheetTitle && (
                                <span className="text-muted-foreground truncate">({spreadsheet.spreadsheetTitle})</span>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => onDelete(spreadsheet.id, e)}
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


