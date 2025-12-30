/**
 * ArtboardCanvas - Infinite canvas container for multiple artboards
 *
 * Refactored to use extracted hooks and sub-components.
 * Now focuses on orchestrating canvas state and rendering artboards.
 */

import { ComponentInspector } from '@/components/config-panel';
import FloatingToolbar, { ToolType } from '@/components/FloatingToolbar';
import { useArtboardContext } from '@/context/ArtboardContext';
import { useCanvasPan, useCanvasZoom } from '@/hooks';
import { createArtboard } from '@/lib/artboard-utils';
import type { ArtboardSchema } from '@/types/artboard';
import type { ArtboardComponent } from '@/types/dashboard';
import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AddArtboardPanel from './AddArtboardPanel';
import ArtboardContainer from './ArtboardContainer';
import ArtboardInspector from './ArtboardInspector';
import CanvasEmptyState from './CanvasEmptyState';
import CanvasScrollbars, { Universe } from './CanvasScrollbars';
import CanvasTopBar from './CanvasTopBar';

export default function ArtboardCanvas() {
    const page = usePage<{ currentDashboard?: { id: string; name?: string } | null }>();
    const currentDashboardId = page.props.currentDashboard?.id ?? 'default';
    const currentDashboardName = page.props.currentDashboard?.name ?? 'Untitled Dashboard';

    const { artboards, setArtboards, selectedArtboardId, setSelectedArtboardId, artboardStackOrder, bringArtboardToFront } = useArtboardContext();

    // Component transfer - simplified without widget archiving
    // Components are now placed directly on artboards

    // Canvas zoom/pan from extracted hook
    const { scale, pan, setPan, viewportSize, adjustScale, canvasRef } = useCanvasZoom();

    // Tool state
    const [activeTool, setActiveTool] = useState<ToolType>('pointer');
    const [isSpacePressed, setIsSpacePressed] = useState(false);

    // Panel visibility
    const [showAddArtboard, setShowAddArtboard] = useState(false);
    const [showInspector, setShowInspector] = useState(false);

    // Save state
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Component selection state
    const [selectedComponent, setSelectedComponent] = useState<{
        artboardId: string;
        component: ArtboardComponent;
    } | null>(null);

    const selectedArtboard = artboards.find((a) => a.id === selectedArtboardId) || null;

    // Hand tool panning
    const isHandMode = activeTool === 'hand' || isSpacePressed;
    const { handleCanvasMouseDown } = useCanvasPan({
        isHandMode,
        pan,
        setPan,
    });

    // Handle spacebar for temporary hand tool
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === ' ' && !isSpacePressed) {
                setIsSpacePressed(true);
            }
            // Tool shortcuts
            if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
                if (e.key.toLowerCase() === 'v') setActiveTool('pointer');
                if (e.key.toLowerCase() === 'h') setActiveTool('hand');
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === ' ') setIsSpacePressed(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isSpacePressed]);

    // Calculate scrollable universe
    const universe: Universe = useMemo(() => {
        let contentMinX = 0,
            contentMinY = 0,
            contentMaxX = 0,
            contentMaxY = 0;

        if (artboards.length > 0) {
            contentMinX = contentMinY = Infinity;
            contentMaxX = contentMaxY = -Infinity;
            artboards.forEach((a) => {
                if (!a.visible) return;
                contentMinX = Math.min(contentMinX, a.position.x);
                contentMinY = Math.min(contentMinY, a.position.y);
                contentMaxX = Math.max(contentMaxX, a.position.x + a.dimensions.widthPx);
                contentMaxY = Math.max(contentMaxY, a.position.y + a.dimensions.heightPx);
            });
        }

        const viewMinX = -pan.x / scale;
        const viewMinY = -pan.y / scale;
        const viewMaxX = (viewportSize.width - pan.x) / scale;
        const viewMaxY = (viewportSize.height - pan.y) / scale;

        const minX = artboards.length > 0 ? Math.min(contentMinX, viewMinX) : viewMinX;
        const minY = artboards.length > 0 ? Math.min(contentMinY, viewMinY) : viewMinY;
        const maxX = artboards.length > 0 ? Math.max(contentMaxX, viewMaxX) : viewMaxX;
        const maxY = artboards.length > 0 ? Math.max(contentMaxY, viewMaxY) : viewMaxY;

        return {
            minX,
            minY,
            maxX,
            maxY,
            width: maxX - minX,
            height: maxY - minY,
            viewMinX,
            viewMinY,
            viewWidth: viewportSize.width / scale,
            viewHeight: viewportSize.height / scale,
        };
    }, [artboards, pan, scale, viewportSize]);

    // Artboard CRUD
    const handleUpdateArtboard = useCallback(
        (id: string, updates: Partial<ArtboardSchema>) => {
            setArtboards((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a)));
        },
        [setArtboards],
    );

    const handleDeleteArtboard = useCallback(
        (id: string) => {
            setArtboards((prev) => prev.filter((a) => a.id !== id));
            if (selectedArtboardId === id) setSelectedArtboardId(null);
        },
        [selectedArtboardId, setArtboards, setSelectedArtboardId],
    );

    // Remove add card - no longer used with direct component placement
    const handleAddCard = useCallback(() => {
        // No-op - components are added by dropping directly onto artboards
    }, []);

    // Component selection
    const handleSelectComponent = useCallback(
        (componentId: string) => {
            // Find the component across all artboards
            for (const artboard of artboards) {
                const component = artboard.components.find((c) => c.instanceId === componentId);
                if (component) {
                    setSelectedComponent({ artboardId: artboard.id, component });
                    setShowInspector(true);
                    return;
                }
            }
        },
        [artboards],
    );

    const handleComponentConfigChange = useCallback(
        (instanceId: string, config: Record<string, unknown>) => {
            if (!selectedComponent) return;
            setArtboards((prev) =>
                prev.map((a) => {
                    if (a.id !== selectedComponent.artboardId) return a;
                    return {
                        ...a,
                        components: a.components.map((c) => (c.instanceId === instanceId ? { ...c, config } : c)),
                        updatedAt: new Date().toISOString(),
                    };
                }),
            );
            setSelectedComponent((prev) =>
                prev?.component.instanceId === instanceId ? { ...prev, component: { ...prev.component, config } } : prev,
            );
        },
        [selectedComponent, setArtboards],
    );

    const handleCloseInspector = useCallback(() => {
        setShowInspector(false);
        setSelectedComponent(null);
    }, []);

    // Persistence - save to database
    const handleSave = useCallback(async () => {
        setIsSaving(true);
        setSaveStatus('saving');
        try {
            // Get CSRF token from XSRF-TOKEN cookie (Laravel sets this automatically)
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() ?? '');
                return '';
            };
            const csrfToken = getCookie('XSRF-TOKEN');

            // current dashboard scope is read at component level (hooks must not run inside callbacks)

            const response = await fetch('/dashboard/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    id: currentDashboardId,
                    name: currentDashboardName,
                    artboards: artboards,
                }),
            });
            if (response.ok) {
                setSaveStatus('saved');
                // Reset to idle after 2 seconds
                setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
                console.error('Save failed:', await response.text());
                setSaveStatus('error');
                setTimeout(() => setSaveStatus('idle'), 3000);
            }
        } catch (error) {
            console.error('Save error:', error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } finally {
            setIsSaving(false);
        }
    }, [artboards, currentDashboardId, currentDashboardName]);

    return (
        <div className="flex h-screen flex-1 overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden bg-muted/30">
                <CanvasTopBar
                    artboardCount={artboards.length}
                    scale={scale}
                    onZoomIn={() => adjustScale((s) => s * 1.1)}
                    onZoomOut={() => adjustScale((s) => s * 0.9)}
                    onZoomReset={() => adjustScale(() => 1)}
                    onSave={handleSave}
                    isSaving={isSaving}
                    saveStatus={saveStatus}
                />

                <div
                    ref={canvasRef}
                    className={`relative flex-1 overflow-hidden ${isHandMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                    onMouseDown={handleCanvasMouseDown}
                >
                    {artboards.length === 0 && <CanvasEmptyState />}

                    {/* Infinite Canvas */}
                    <div
                        className="absolute inset-0"
                        style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                            transformOrigin: '0 0',
                        }}
                    >
                        {/* Grid Background */}
                        <div
                            className="pointer-events-none absolute opacity-[0.015]"
                            style={{
                                left: -10000,
                                top: -10000,
                                width: 20000,
                                height: 20000,
                                backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)`,
                                backgroundSize: '8px 8px',
                            }}
                        />

                        {/* Artboards */}
                        {artboardStackOrder
                            .map((id) => artboards.find((a) => a.id === id))
                            .filter((a): a is ArtboardSchema => !!a)
                            .map((artboard, index) => (
                                <ArtboardContainer
                                    key={artboard.id}
                                    artboard={artboard}
                                    isSelected={selectedArtboardId === artboard.id}
                                    canvasScale={scale}
                                    zIndex={index}
                                    onUpdate={handleUpdateArtboard}
                                    onDelete={handleDeleteArtboard}
                                    onSelect={() => {
                                        setSelectedArtboardId(artboard.id);
                                        bringArtboardToFront(artboard.id);
                                    }}
                                    onSelectComponent={handleSelectComponent}
                                    onDeselectComponent={() => setSelectedComponent(null)}
                                    selectedComponentId={
                                        selectedComponent?.artboardId === artboard.id ? selectedComponent.component.instanceId : undefined
                                    }
                                />
                            ))}
                    </div>

                    {/* Hand mode overlay */}
                    {isHandMode && <div className="absolute inset-0 z-40 cursor-grab bg-transparent active:cursor-grabbing" />}

                    <CanvasScrollbars universe={universe} viewportSize={viewportSize} scale={scale} pan={pan} setPan={setPan} />
                </div>
            </div>

            {/* Panels */}
            {showInspector && selectedComponent && (
                <ComponentInspector
                    component={selectedComponent.component}
                    onConfigChange={handleComponentConfigChange}
                    onClose={handleCloseInspector}
                />
            )}

            {selectedArtboard && (
                <ArtboardInspector
                    artboard={selectedArtboard}
                    onUpdate={(updates) => selectedArtboardId && handleUpdateArtboard(selectedArtboardId, updates)}
                    onClose={() => setSelectedArtboardId(null)}
                />
            )}

            {showAddArtboard && (
                <AddArtboardPanel
                    onAddArtboard={(format) => {
                        const newArtboard = createArtboard({ format }, artboards);
                        setArtboards((prev) => [...prev, newArtboard]);
                    }}
                    onClose={() => setShowAddArtboard(false)}
                />
            )}

            <FloatingToolbar
                activeTool={isSpacePressed ? 'hand' : activeTool}
                onToolChange={setActiveTool}
                onAddArtboard={() => {
                    setShowAddArtboard(!showAddArtboard);
                    if (!showAddArtboard) {
                        setShowInspector(false);
                        setSelectedArtboardId(null);
                    }
                }}
                onAddCard={handleAddCard}
            />
        </div>
    );
}
