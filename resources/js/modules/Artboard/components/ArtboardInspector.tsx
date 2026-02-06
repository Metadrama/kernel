/**
 * ArtboardInspector - Right-side panel to edit artboard properties
 */
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/modules/DesignSystem/ui/accordion';
import { Button } from '@/modules/DesignSystem/ui/button';
import { Input } from '@/modules/DesignSystem/ui/input';
import { Label } from '@/modules/DesignSystem/ui/label';
import PanelHeader from '@/modules/DesignSystem/ui/panel-header';
import { Switch } from '@/modules/DesignSystem/ui/switch';
import type { Artboard } from '@/modules/Artboard/types/artboard';
import { Grid, Image, LayoutPanelTop, Ruler, Lock, Eye } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
    artboard: Artboard | null;
    onUpdate: (updates: Partial<Artboard>) => void;
    onClose: () => void;
}

export function ArtboardInspectorContent({ artboard, onUpdate }: { artboard: Artboard; onUpdate: (updates: Partial<Artboard>) => void }) {
    const dims = useMemo(() => artboard?.dimensions, [artboard]);
    
    if (!artboard) return null;

    return (
        <Accordion type="multiple" defaultValue={['Basics', 'Appearance', 'Guides']} className="w-full">
            <AccordionItem value="Basics" className="border-b">
                <AccordionTrigger className="px-3 py-1.5 hover:bg-muted/50 hover:no-underline">
                    <div className="flex items-center gap-2">
                        <LayoutPanelTop className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Basics</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pt-1 pb-2">
                    <div className="space-y-3">
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
                    </div>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="Appearance" className="border-b">
                <AccordionTrigger className="px-3 py-1.5 hover:bg-muted/50 hover:no-underline">
                    <div className="flex items-center gap-2">
                        <Image className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Appearance</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pt-1 pb-2">
                    <div className="space-y-3">
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
                    </div>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="Guides" className="border-b">
                <AccordionTrigger className="px-3 py-1.5 hover:bg-muted/50 hover:no-underline">
                    <div className="flex items-center gap-2">
                        <Grid className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Guides</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pt-1 pb-2">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="text-sm">Show Grid Guides</div>
                            <Switch checked={artboard.showGrid} onCheckedChange={(v) => onUpdate({ showGrid: v })} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                                <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                                Show Rulers
                            </div>
                            <Switch checked={artboard.showRulers} onCheckedChange={(v) => onUpdate({ showRulers: v })} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                Lock Position
                            </div>
                            <Switch checked={artboard.locked} onCheckedChange={(v) => onUpdate({ locked: v })} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                Visible
                            </div>
                            <Switch checked={artboard.visible} onCheckedChange={(v) => onUpdate({ visible: v })} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="text-sm">Clip Content</div>
                            <Switch checked={artboard.clipContent} onCheckedChange={(v) => onUpdate({ clipContent: v })} />
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}

export default function ArtboardInspector({ artboard, onUpdate, onClose }: Props) {
    const isOpen = !!artboard;

    if (!isOpen || !artboard) return null;

    return (
        <div className="flex h-full w-80 shrink-0 flex-col border-l bg-background">
            <PanelHeader
                title="Artboard Inspector"
                right={
                    <Button variant="ghost" size="sm" className="h-8" onClick={onClose}>
                        Close
                    </Button>
                }
            />

            <div className="flex-1 overflow-y-auto p-3">
                <ArtboardInspectorContent artboard={artboard} onUpdate={onUpdate} />
            </div>
        </div>
    );
}


