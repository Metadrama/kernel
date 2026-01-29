import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/modules/DesignSystem/ui/accordion';
import { Button } from '@/modules/DesignSystem/ui/button';
import PanelHeader from '@/modules/DesignSystem/ui/panel-header';
import { ScrollArea } from '@/modules/DesignSystem/ui/scroll-area';
import { ARTBOARD_CATEGORIES, ARTBOARD_PRESETS } from '@/modules/DesignSystem/constants/artboard-presets';
import type { ArtboardFormat, ArtboardPreset } from '@/modules/Artboard/types/artboard';
import { FileText, LayoutGrid, Monitor, Plus, Presentation, Smartphone, Tv, X } from 'lucide-react';

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

    const byCategory: Record<string, ArtboardPreset[]> = ARTBOARD_CATEGORIES.reduce(
        (acc, cat) => {
            acc[cat.id] = Object.values(ARTBOARD_PRESETS).filter((p) => p.category === cat.id);
            return acc;
        },
        {} as Record<string, ArtboardPreset[]>,
    );

    // Default open all groups
    const defaultOpenGroups = ARTBOARD_CATEGORIES.map((c) => c.id);

    return (
        <div className="flex h-full w-80 flex-col overflow-hidden border-l bg-background">
            {/* Header */}
            <PanelHeader
                left={
                    <div className="flex min-w-0 items-center gap-2">
                        <LayoutGrid className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <h2 className="truncate text-sm font-semibold">Add Artboard</h2>
                    </div>
                }
                right={
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                }
            />

            {/* Content */}
            <ScrollArea className="min-h-0 flex-1">
                <Accordion type="multiple" defaultValue={defaultOpenGroups} className="w-full">
                    {ARTBOARD_CATEGORIES.map((cat) => (
                        <AccordionItem key={cat.id} value={cat.id} className="border-b">
                            <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 hover:no-underline">
                                <div className="flex items-center gap-2">
                                    {iconForCategory[cat.id]}
                                    <span className="text-sm font-medium">{cat.label}</span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pt-1 pb-4">
                                <div className="space-y-1">
                                    {byCategory[cat.id].map((preset) => (
                                        <button
                                            key={preset.format}
                                            className="flex w-full flex-col items-start gap-1 rounded-md p-2 text-left transition-colors hover:bg-accent hover:text-accent-foreground"
                                            onClick={() => {
                                                onAddArtboard(preset.format);
                                                // Optional: Close panel after adding? Or keep open for multiple adds?
                                                // Keeping open seems better for a side panel workflow.
                                            }}
                                        >
                                            <div className="flex w-full items-center gap-2">
                                                <span className="text-sm font-medium">{preset.dimensions.label}</span>
                                                <Plus className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-100" />
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