/**
 * LayersPanel - Artboard/layers management panel
 */

import { useMemo } from 'react';
import { ArrowUp, ArrowDown, Eye, EyeOff, Lock, Unlock, Layers, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ArtboardSchema } from '@/types/artboard';
import type { WidgetSchema } from '@/types/dashboard';
import { AVAILABLE_COMPONENTS } from '@/constants/components';
import { cn } from '@/lib/utils';

interface LayersPanelProps {
    artboards: ArtboardSchema[];
    artboardStackOrder: string[];
    selectedArtboardId: string | null;
    onSelectArtboard: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onToggleLock: (id: string) => void;
    onMoveLayer: (id: string, direction: 'up' | 'down') => void;
}

export default function LayersPanel({
    artboards,
    artboardStackOrder,
    selectedArtboardId,
    onSelectArtboard,
    onToggleVisibility,
    onToggleLock,
    onMoveLayer,
}: LayersPanelProps) {
    const componentNameMap = useMemo(() => {
        const map: Record<string, string> = {};
        for (const component of AVAILABLE_COMPONENTS) {
            map[component.id] = component.name;
        }
        return map;
    }, []);

    const artboardOrder = useMemo(() => {
        return artboardStackOrder.length > 0 ? artboardStackOrder : artboards.map((a) => a.id);
    }, [artboardStackOrder, artboards]);

    const orderedArtboards = useMemo(() => {
        return artboardOrder
            .map((id) => artboards.find((a) => a.id === id))
            .filter((a): a is ArtboardSchema => !!a)
            .reverse();
    }, [artboards, artboardOrder]);

    const getWidgetLabel = (widget: WidgetSchema, index: number) => {
        if (widget.components.length > 0) {
            const primary = widget.components[0];
            return componentNameMap[primary.componentType] || primary.componentType;
        }
        if (widget.componentType) {
            return componentNameMap[widget.componentType] || widget.componentType;
        }
        return `Layer ${index + 1}`;
    };

    return (
        <div className="flex flex-col h-full bg-background/50">
            <div className="border-b p-3 shrink-0 bg-card/50 backdrop-blur-sm z-10 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Layer Stack</span>
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{artboards.length}</span>
            </div>

            <ScrollArea className="flex-1">
                <div className="space-y-4 p-3">
                    {orderedArtboards.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                            <Layers className="h-8 w-8 opacity-20 mb-2" />
                            <p className="text-xs">No artboards added.</p>
                        </div>
                    ) : (
                        orderedArtboards.map((artboard) => {
                            const isSelected = selectedArtboardId === artboard.id;
                            const layerIndex = artboardOrder.indexOf(artboard.id);
                            const isTopLayer = layerIndex === artboardOrder.length - 1;
                            const isBottomLayer = layerIndex === 0;

                            return (
                                <div
                                    key={artboard.id}
                                    className={cn(
                                        "group rounded-lg transition-all duration-200 border",
                                        isSelected
                                            ? "bg-card border-primary/20 shadow-sm ring-1 ring-primary/10"
                                            : "bg-card/50 border-transparent hover:border-border hover:bg-card hover:shadow-sm"
                                    )}
                                >
                                    {/* Artboard Header */}
                                    <div className="flex items-center gap-2 p-2">
                                        <button
                                            type="button"
                                            onClick={() => onSelectArtboard(artboard.id)}
                                            className="flex flex-1 flex-col text-left min-w-0"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <div className={cn("h-2 w-2 rounded-full", isSelected ? "bg-primary" : "bg-muted-foreground/30")} />
                                                <span className={cn("text-sm font-medium truncate", isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                                                    {artboard.name || 'Untitled'}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground pl-3.5 opacity-70">
                                                {artboard.dimensions.label ?? artboard.format}
                                            </span>
                                        </button>

                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                                onClick={() => onMoveLayer(artboard.id, 'up')}
                                                disabled={isTopLayer}
                                                title="Bring Forward"
                                            >
                                                <ArrowUp className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                                onClick={() => onMoveLayer(artboard.id, 'down')}
                                                disabled={isBottomLayer}
                                                title="Send Backward"
                                            >
                                                <ArrowDown className="h-3.5 w-3.5" />
                                            </Button>
                                            <div className="w-px h-3 bg-border mx-0.5" />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn("h-6 w-6", artboard.locked ? "text-amber-500" : "text-muted-foreground hover:text-foreground")}
                                                onClick={() => onToggleLock(artboard.id)}
                                                title={artboard.locked ? "Unlock" : "Lock"}
                                            >
                                                {artboard.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3.5 w-3.5" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn("h-6 w-6", !artboard.visible ? "text-muted-foreground/50" : "text-muted-foreground hover:text-foreground")}
                                                onClick={() => onToggleVisibility(artboard.id)}
                                                title={artboard.visible ? "Hide" : "Show"}
                                            >
                                                {artboard.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Widgets List (Indented) */}
                                    <div className="border-t border-border/30 bg-muted/10">
                                        {artboard.widgets.length === 0 ? (
                                            <p className="text-[10px] text-muted-foreground p-3 pl-6 italic opacity-50">Empty artboard</p>
                                        ) : (
                                            <div className="py-1">
                                                {artboard.widgets.slice().reverse().map((widget, widgetIndex) => (
                                                    <div
                                                        key={widget.id}
                                                        className="group/widget flex items-start gap-2 py-1.5 px-3 pl-6 hover:bg-muted/50 transition-colors cursor-default"
                                                    >
                                                        <Box className="h-3 w-3 text-muted-foreground/50 mt-0.5 shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs text-foreground/80 truncate font-medium">
                                                                    {getWidgetLabel(widget, widgetIndex)}
                                                                </span>
                                                            </div>
                                                            {widget.components.length > 0 && (
                                                                <div className="mt-1 flex flex-wrap gap-1">
                                                                    {widget.components.map((component) => (
                                                                        <span
                                                                            key={component.instanceId}
                                                                            className="inline-flex items-center rounded-sm bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground border border-border/50"
                                                                        >
                                                                            {componentNameMap[component.componentType] || component.componentType}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
