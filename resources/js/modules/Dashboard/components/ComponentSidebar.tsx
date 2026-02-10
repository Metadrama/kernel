/**
 * ComponentSidebar - Main sidebar with components browser and layers panel
 */

import { Button } from '@/modules/DesignSystem/ui/button';
import { useArtboardContext } from '@/modules/Artboard/context/ArtboardContext';
import { useResizable } from '@/modules/DesignSystem/hooks/useResizable';
import { PanelLeft, PanelLeftClose } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ComponentsPanel, LayersPanel } from '.';
import { ComponentContextMenuActions } from './ComponentContextMenu';

export default function ComponentSidebar() {
    const {
        artboards,
        setArtboards,
        selectedArtboardId,
        setSelectedArtboardId,
        selectedComponentId,
        setSelectedComponentId,
        artboardStackOrder,
        bringArtboardToFront,
        moveArtboardLayer
    } = useArtboardContext();

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activePanel, setActivePanel] = useState<'components' | 'layers'>('components');

    // Resizable panel
    const { width, isResizing, handleProps } = useResizable({
        defaultWidth: 320,
        minWidth: 240,
        maxWidth: 480,
        storageKey: 'sidebar-width',
        direction: 'right',
    });

    // Persist collapsed state
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved !== null) setIsCollapsed(JSON.parse(saved));
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    };

    // Layer actions
    const handleToggleVisibility = (id: string) => {
        setArtboards((prev) => prev.map((a) => (a.id === id ? { ...a, visible: !a.visible } : a)));
    };

    const handleToggleLock = (id: string) => {
        setArtboards((prev) => prev.map((a) => (a.id === id ? { ...a, locked: !a.locked } : a)));
    };

    const handleSelectArtboard = (id: string) => {
        setSelectedArtboardId(id);
        bringArtboardToFront(id);
    };

    const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
        moveArtboardLayer(id, direction);
    };

    // Component actions for LayersPanel
    const handleSelectComponent = useCallback((id: string) => {
        setSelectedComponentId(id);
        setSelectedArtboardId(null);
    }, [setSelectedComponentId, setSelectedArtboardId]);

    const getComponentActions = useCallback((componentId: string, artboardId: string): ComponentContextMenuActions => ({
        onToggleVisibility: () => {
            setArtboards((prev) => prev.map((a) => (a.id === artboardId ? {
                ...a,
                components: a.components.map((c) => c.instanceId === componentId ? { ...c, hidden: !c.hidden } : c)
            } : a)));
        },
        onToggleLock: () => {
            setArtboards((prev) => prev.map((a) => (a.id === artboardId ? {
                ...a,
                components: a.components.map((c) => c.instanceId === componentId ? { ...c, locked: !c.locked } : c)
            } : a)));
        },
        onFlipHorizontal: () => {
            setArtboards((prev) => prev.map((a) => (a.id === artboardId ? {
                ...a,
                components: a.components.map((c) => c.instanceId === componentId ? { ...c, flipX: !c.flipX } : c)
            } : a)));
        },
        onFlipVertical: () => {
            setArtboards((prev) => prev.map((a) => (a.id === artboardId ? {
                ...a,
                components: a.components.map((c) => c.instanceId === componentId ? { ...c, flipY: !c.flipY } : c)
            } : a)));
        },
        onDelete: () => {
            setArtboards((prev) => prev.map((a) => (a.id === artboardId ? {
                ...a,
                components: a.components.filter((c) => c.instanceId !== componentId),
            } : a)));
            // We need to check the current value from the callback or ref, but here we only have the closure value.
            // Since we depend on selectedComponentId in the useCallback array, it's fine.
             setSelectedComponentId((currentId) => currentId === componentId ? null : currentId);
        },
    }), [setArtboards, setSelectedComponentId]);

    if (isCollapsed) {
        return (
            <div className="flex h-screen w-12 flex-col border-r bg-card">
                <div className="flex h-14 items-center justify-center border-b">
                    <Button variant="ghost" size="icon" onClick={toggleCollapse} className="h-8 w-8">
                        <PanelLeft className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative flex h-screen flex-col border-r bg-card shadow-sm"
            style={{ width: `${width}px` }}
        >
            {/* Resize Handle */}
            <div {...handleProps} />

            {/* Header */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
                <h2 className="text-lg font-semibold">BM://</h2>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={toggleCollapse} className="h-8 w-8">
                        <PanelLeftClose className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Mode Switch */}
            <div className="border-b bg-card/95 px-4 py-2.5">
                <div className="grid grid-cols-2 gap-2">
                    {(['components', 'layers'] as const).map((panel) => (
                        <button
                            key={panel}
                            type="button"
                            onClick={() => setActivePanel(panel)}
                            className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${activePanel === panel
                                ? 'border-foreground/40 bg-background text-foreground shadow-sm'
                                : 'border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/70'
                                }`}
                        >
                            {panel === 'components' ? 'Components' : 'Layers'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Active Panel */}
            {activePanel === 'components' ? (
                <ComponentsPanel />
            ) : (
                <LayersPanel
                    artboards={artboards}
                    artboardStackOrder={artboardStackOrder}
                    selectedArtboardId={selectedArtboardId}
                    selectedComponentId={selectedComponentId}
                    onSelectArtboard={handleSelectArtboard}
                    onToggleVisibility={handleToggleVisibility}
                    onToggleLock={handleToggleLock}
                    onMoveLayer={handleMoveLayer}
                    onSelectComponent={handleSelectComponent}
                    getComponentActions={getComponentActions}
                />
            )}

            {/* Footer */}
            <div className="shrink-0 border-t bg-card/95 p-3">
                <p className="text-center text-xs text-muted-foreground">Drag components onto the canvas or into widgets</p>
            </div>
        </div>
    );
}

