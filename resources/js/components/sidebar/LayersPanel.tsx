/**
 * LayersPanel - Artboard/layers management panel
 */

import { useMemo } from 'react';
import { ArrowUp, ArrowDown, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ArtboardSchema } from '@/types/artboard';
import { AVAILABLE_COMPONENTS } from '@/constants/components';

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

    return (
        <>
            <div className="border-b bg-card/95 px-4 py-2.5 text-xs text-muted-foreground flex items-center justify-between">
                <span>Layer stack</span>
                <span>{artboards.length} {artboards.length === 1 ? 'artboard' : 'artboards'}</span>
            </div>
            <ScrollArea className="flex-1">
                <div className="space-y-3 px-4 py-5">
                    {orderedArtboards.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Add an artboard to start managing layers.</p>
                    ) : (
                        orderedArtboards.map((artboard) => {
                            const isSelected = selectedArtboardId === artboard.id;
                            const layerIndex = artboardOrder.indexOf(artboard.id);
                            const isTopLayer = layerIndex === artboardOrder.length - 1;
                            const isBottomLayer = layerIndex === 0;

                            // Sort components by z-index to show proper layer order
                            const sortedComponents = [...artboard.components].sort((a, b) =>
                                (b.position.zIndex || 0) - (a.position.zIndex || 0)
                            );

                            return (
                                <div
                                    key={artboard.id}
                                    className={`group rounded-xl px-3 py-2 transition hover:bg-muted/40 ${isSelected ? 'ring-1 ring-foreground/40' : 'ring-1 ring-transparent'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => onSelectArtboard(artboard.id)}
                                            className="flex flex-1 flex-col text-left"
                                        >
                                            <span className="text-sm font-semibold text-foreground">
                                                {artboard.name || 'Untitled artboard'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {artboard.dimensions.label ?? artboard.format}
                                            </span>
                                        </button>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => onMoveLayer(artboard.id, 'up')}
                                                disabled={isTopLayer}
                                            >
                                                <ArrowUp className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => onMoveLayer(artboard.id, 'down')}
                                                disabled={isBottomLayer}
                                            >
                                                <ArrowDown className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => onToggleLock(artboard.id)}
                                            >
                                                {artboard.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => onToggleVisibility(artboard.id)}
                                            >
                                                {artboard.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="mt-3 space-y-2">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                                            <span>{artboard.components.length} {artboard.components.length === 1 ? 'component' : 'components'}</span>
                                            {sortedComponents.length > 0 && (
                                                <span>Top: {componentNameMap[sortedComponents[0].componentType] || sortedComponents[0].componentType}</span>
                                            )}
                                        </div>
                                        {artboard.components.length === 0 ? (
                                            <p className="text-xs text-muted-foreground px-1">No components yet.</p>
                                        ) : (
                                            <div className="space-y-1">
                                                {sortedComponents.map((component, index) => (
                                                    <div key={component.instanceId} className="rounded-lg px-3 py-2 transition hover:bg-muted/30">
                                                        <div className="flex items-center justify-between text-xs font-medium text-foreground">
                                                            <span>{componentNameMap[component.componentType] || component.componentType}</span>
                                                            <span className="text-[11px] text-muted-foreground">
                                                                Layer {sortedComponents.length - index}
                                                            </span>
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
        </>
    );
}
