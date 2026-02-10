/**
 * LayersPanel - Artboard/layers management panel
 */

import { useMemo } from 'react';
import { ArrowUp, ArrowDown, Eye, EyeOff, Lock, Unlock, Trash2 } from 'lucide-react';
import { Button } from '@/modules/DesignSystem/ui/button';
import { ScrollArea } from '@/modules/DesignSystem/ui/scroll-area';
import { ComponentContextMenu, ComponentContextMenuActions } from './ComponentContextMenu';
import type { Artboard } from '@/modules/Artboard/types/artboard';
import { AVAILABLE_COMPONENTS } from '@/modules/DesignSystem/constants/components';

interface LayersPanelProps {
    artboards: Artboard[];
    artboardStackOrder: string[];
    selectedArtboardId: string | null;
    selectedComponentId: string | null;
    onSelectArtboard: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onToggleLock: (id: string) => void;
    onMoveLayer: (id: string, direction: 'up' | 'down') => void;
    // Component actions
    onSelectComponent: (id: string) => void;
    getComponentActions: (componentId: string, artboardId: string) => ComponentContextMenuActions;
}

export default function LayersPanel({
    artboards,
    artboardStackOrder,
    selectedArtboardId,
    selectedComponentId,
    onSelectArtboard,
    onToggleVisibility,
    onToggleLock,
    onMoveLayer,
    onSelectComponent,
    getComponentActions,
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
            .filter((a): a is Artboard => !!a)
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
                                    className={`group rounded-xl px-3 py-2 transition hover:bg-muted/40 ${isSelected && !selectedComponentId ? 'ring-1 ring-foreground/40' : 'ring-1 ring-transparent'
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
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                    <div className="mt-3 space-y-1">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pb-1">
                                            <span>{artboard.components.length} {artboard.components.length === 1 ? 'component' : 'components'}</span>
                                        </div>
                                        {artboard.components.length === 0 ? (
                                            <p className="text-xs text-muted-foreground px-1 py-1">No components yet.</p>
                                        ) : (
                                            <div className="space-y-0.5">
                                                {sortedComponents.map((component, index) => {
                                                    const isComponentSelected = selectedComponentId === component.instanceId;
                                                    const actions = getComponentActions(component.instanceId, artboard.id);

                                                    return (
                                                        <ComponentContextMenu
                                                            key={component.instanceId}
                                                            {...actions}
                                                            isLocked={component.locked}
                                                            isHidden={component.hidden}
                                                        >
                                                            <div
                                                                className={`group/item flex items-center justify-between rounded-lg pl-3 pr-1 py-1.5 transition cursor-pointer ${isComponentSelected
                                                                    ? 'bg-primary/10 text-primary font-medium'
                                                                    : 'text-foreground hover:bg-muted/50'
                                                                    } ${component.hidden ? 'opacity-50' : ''}`}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onSelectComponent(component.instanceId);
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-2 overflow-hidden">
                                                                    <div className="h-1.5 w-1.5 rounded-full bg-current shrink-0 opacity-50" />
                                                                    <span className="truncate text-xs">
                                                                        {componentNameMap[component.componentType] || component.componentType}
                                                                    </span>
                                                                </div>

                                                                <div className={`flex items-center gap-0.5 ${isComponentSelected ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100'} transition-opacity`}>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            actions.onToggleVisibility?.();
                                                                        }}
                                                                    >
                                                                        {component.hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                                        <span className="sr-only">Toggle visibility</span>
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            actions.onToggleLock?.();
                                                                        }}
                                                                    >
                                                                        {component.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                                                                        <span className="sr-only">Toggle lock</span>
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            actions.onDelete?.();
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                        <span className="sr-only">Delete</span>
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </ComponentContextMenu>
                                                    );
                                                })}
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


