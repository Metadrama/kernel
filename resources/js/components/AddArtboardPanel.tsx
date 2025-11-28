import { X, LayoutGrid, Monitor, Tv, Smartphone, FileText, Presentation, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import type { ArtboardPreset, ArtboardFormat } from '@/types/artboard';
import { ARTBOARD_PRESETS, ARTBOARD_CATEGORIES } from '@/constants/artboard-presets';

interface AddArtboardPanelProps {
    onAddArtboard: (format: ArtboardFormat) => void;
    onClose: () => void;
}

export default function AddArtboardPanel({ onAddArtboard, onClose }: AddArtboardPanelProps) {
    const iconForCategory: Record<string, React.ReactNode> = {
        print: <FileText className="h-3.5 w-3.5" />,
        presentation: <Presentation className="h-3.5 w-3.5" />,
        web: <Monitor className="h-3.5 w-3.5" />,
        display: <Tv className="h-3.5 w-3.5" />,
        mobile: <Smartphone className="h-3.5 w-3.5" />,
    };

    const byCategory: Record<string, ArtboardPreset[]> = ARTBOARD_CATEGORIES.reduce((acc, cat) => {
        acc[cat.id] = Object.values(ARTBOARD_PRESETS).filter(p => p.category === cat.id);
        return acc;
    }, {} as Record<string, ArtboardPreset[]>);

    // Default open all groups
    const defaultOpenGroups = ARTBOARD_CATEGORIES.map(c => c.id);

    return (
        <div className="h-full flex flex-col bg-card border-l w-80 overflow-hidden">
            {/* Header */}
            <div className="flex h-14 items-center justify-between px-4 border-b shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                    <LayoutGrid className="h-4 w-4 text-muted-foreground shrink-0" />
                    <h2 className="text-sm font-semibold truncate">Add Artboard</h2>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 min-h-0">
                <Accordion type="multiple" defaultValue={defaultOpenGroups} className="w-full">
                    {ARTBOARD_CATEGORIES.map((cat) => (
                        <AccordionItem key={cat.id} value={cat.id} className="border-b">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                                <div className="flex items-center gap-2">
                                    {iconForCategory[cat.id]}
                                    <span className="text-sm font-medium">{cat.label}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 pt-1">
                                <div className="space-y-1">
                                    {byCategory[cat.id].map((preset) => (
                                        <button
                                            key={preset.format}
                                            className="flex w-full flex-col items-start gap-1 rounded-md p-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                                            onClick={() => {
                                                onAddArtboard(preset.format);
                                                // Optional: Close panel after adding? Or keep open for multiple adds?
                                                // Keeping open seems better for a side panel workflow.
                                            }}
                                        >
                                            <div className="flex items-center gap-2 w-full">
                                                <span className="text-sm font-medium">{preset.dimensions.label}</span>
                                                <Plus className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100" />
                                            </div>
                                            <div className="text-xs text-muted-foreground">{preset.description || preset.format}</div>
                                        </button>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </ScrollArea>
        </div>
    );
}
