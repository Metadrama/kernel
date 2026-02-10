/**
 * ArtboardCanvas - Infinite canvas container for multiple artboards
 *
 * Refactored to use extracted hooks and sub-components.
 * Now focuses on orchestrating canvas state and rendering artboards.
 */

import { ComponentInspector } from '@/modules/DataLayer/components/ComponentInspector';
import FloatingToolbar, { ToolType } from '@/modules/Dashboard/components/FloatingToolbar';
import { useArtboardContext } from '@/modules/Artboard/context/ArtboardContext';
import { useCanvasPan } from '@/modules/Artboard/hooks/useCanvasPan';
import { useCanvasZoom } from '@/modules/Artboard/hooks/useCanvasZoom';
import { createArtboard } from '@/modules/Artboard/lib/artboard-utils';
import type { Artboard, ArtboardComponent, ArtboardFormat } from '@/modules/Artboard/types/artboard';
import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AddArtboardPanel from './AddArtboardPanel';
import ArtboardContainer from './ArtboardContainer';
import { ArtboardInspectorContent } from './ArtboardInspector';
import CanvasEmptyState from './CanvasEmptyState';
import CanvasScrollbars, { Universe } from './CanvasScrollbars';
import CanvasTopBar from './CanvasTopBar';

export default function ArtboardCanvas() {
    const page = usePage<{ currentDashboard?: { id: string; name?: string } | null }>();
    const currentDashboardId = page.props.currentDashboard?.id ?? 'default';
    const currentDashboardName = page.props.currentDashboard?.name ?? 'Untitled Dashboard';

    const {
        artboards,
        setArtboards,
        selectedArtboardId,
        setSelectedArtboardId,
        selectedComponentId,
        setSelectedComponentId,
        artboardStackOrder,
        bringArtboardToFront,
        dataSourceConfig,
        autosaveEnabled
    } = useArtboardContext();

    // Component transfer - simplified without widget archiving
    // Components are now placed directly on artboards

    // Canvas zoom/pan from extracted hook
    const { scale, pan, setPan, viewportSize, adjustScale, canvasRef, scaleWithZoom, setScaleWithZoom } = useCanvasZoom();

    // Tool state
    const [activeTool, setActiveTool] = useState<ToolType>('pointer');
    const [isSpacePressed, setIsSpacePressed] = useState(false);

    // Panel visibility
    const [showAddArtboard, setShowAddArtboard] = useState(false);
    const [showInspector, setShowInspector] = useState(false);

    // Save state
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Component selection state - derived from context
    const selectedComponent = useMemo(() => {
        if (!selectedComponentId) return null;
        for (const artboard of artboards) {
            const component = artboard.components.find((c) => c.instanceId === selectedComponentId);
            if (component) {
                return { artboardId: artboard.id, component };
            }
        }
        return null;
    }, [artboards, selectedComponentId]);

    // Live position during drag/resize (for real-time inspector updates)
    const [livePosition, setLivePosition] = useState<{
        componentId: string;
        position: { x: number; y: number; width: number; height: number };
    } | null>(null);

    // Clipboard for copy/paste
    const [clipboard, setClipboard] = useState<{ component: ArtboardComponent; artboardId: string } | null>(null);

    // Undo/Redo history stacks
    const [history, setHistory] = useState<Artboard[][]>([]);
    const [future, setFuture] = useState<Artboard[][]>([]);
    const isUndoRedoRef = useRef(false);
    const lastArtboardsRef = useRef<string>('');
    const autosaveTimerRef = useRef<number | null>(null);
    const autosaveReadyRef = useRef(false);
    const autosaveInFlightRef = useRef(false);

    const selectedArtboard = artboards.find((a) => a.id === selectedArtboardId) || null;

    // Hand tool panning
    const isHandMode = activeTool === 'hand' || isSpacePressed;
    const { handleCanvasMouseDown } = useCanvasPan({
        isHandMode,
        pan,
        setPan,
    });

    // Handle keyboard shortcuts for tools and space key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if user is editing text
            const target = e.target as HTMLElement;
            const isEditing = target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

            if (e.key === ' ' && !isSpacePressed) {
                setIsSpacePressed(true);
            }

            // Tool shortcuts (only when not editing text)
            if (!isEditing && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
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
        (id: string, updates: Partial<Artboard>) => {
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

    // Component selection - dismiss other panels when selecting a component
    const handleSelectComponent = useCallback(
        (componentId: string) => {
            // Find the component across all artboards
            for (const artboard of artboards) {
                const component = artboard.components.find((c: ArtboardComponent) => c.instanceId === componentId);
                if (component) {
                    setSelectedComponentId(component.instanceId);
                    setShowInspector(true);
                    // Dismiss other panels - component inspector takes priority
                    setSelectedArtboardId(null);
                    setShowAddArtboard(false);
                    return;
                }
            }
        },
        [artboards, setSelectedArtboardId, setSelectedComponentId],
    );

    const handleComponentConfigChange = useCallback(
        (instanceId: string, config: Record<string, unknown>) => {
            if (!selectedComponent) return;
            setArtboards((prev) =>
                prev.map((a) => {
                    if (a.id !== selectedComponent.artboardId) return a;
                    return {
                        ...a,
                        components: a.components.map((c: ArtboardComponent) => (c.instanceId === instanceId ? { ...c, config } : c)),
                        updatedAt: new Date().toISOString(),
                    };
                }),
            );
        },
        [selectedComponent, setArtboards],
    );

    const handleComponentPositionChange = useCallback(
        (instanceId: string, positionUpdates: Partial<{ x: number; y: number; width: number; height: number; rotation: number }>) => {
            if (!selectedComponent) return;
            setArtboards((prev) =>
                prev.map((a) => {
                    if (a.id !== selectedComponent.artboardId) return a;
                    return {
                        ...a,
                        components: a.components.map((c: ArtboardComponent) =>
                            c.instanceId === instanceId
                                ? { ...c, position: { ...c.position, ...positionUpdates } }
                                : c
                        ),
                        updatedAt: new Date().toISOString(),
                    };
                }),
            );
        },
        [selectedComponent, setArtboards],
    );

    const handleCloseInspector = useCallback(() => {
        setShowInspector(false);
        setSelectedComponentId(null);
    }, [setSelectedComponentId]);

    // Copy selected component to clipboard
    const handleCopy = useCallback(() => {
        if (selectedComponent) {
            setClipboard({
                component: JSON.parse(JSON.stringify(selectedComponent.component)),
                artboardId: selectedComponent.artboardId,
            });
        }
    }, [selectedComponent]);

    // Paste from clipboard with offset
    const handlePaste = useCallback(() => {
        if (!clipboard) return;
        // Paste to the same artboard as the source, or to selected component's artboard
        const targetArtboardId = selectedComponent?.artboardId ?? clipboard.artboardId;
        const newComponent: ArtboardComponent = {
            ...clipboard.component,
            instanceId: `${clipboard.component.componentType}-${Date.now()}`,
            position: {
                ...clipboard.component.position,
                x: clipboard.component.position.x + 20,
                y: clipboard.component.position.y + 20,
            },
        };
        setArtboards((prev) =>
            prev.map((a) =>
                a.id === targetArtboardId
                    ? { ...a, components: [...a.components, newComponent], updatedAt: new Date().toISOString() }
                    : a
            )
        );
        setSelectedComponentId(newComponent.instanceId);
        setShowInspector(true);
    }, [clipboard, selectedComponent, setArtboards, setSelectedComponentId]);

    // Duplicate selected component (copy + paste in one action)
    const handleDuplicate = useCallback(() => {
        if (!selectedComponent) return;
        const original = selectedComponent.component;
        const newComponent: ArtboardComponent = {
            ...JSON.parse(JSON.stringify(original)),
            instanceId: `${original.componentType}-${Date.now()}`,
            position: {
                ...original.position,
                x: original.position.x + 20,
                y: original.position.y + 20,
            },
        };
        setArtboards((prev) =>
            prev.map((a) =>
                a.id === selectedComponent.artboardId
                    ? { ...a, components: [...a.components, newComponent], updatedAt: new Date().toISOString() }
                    : a
            )
        );
        setSelectedComponentId(newComponent.instanceId);
    }, [selectedComponent, setArtboards, setSelectedComponentId]);

    // Delete selected component
    const handleDeleteComponent = useCallback(() => {
        if (!selectedComponent) return;
        setArtboards((prev) =>
            prev.map((a) =>
                a.id === selectedComponent.artboardId
                    ? {
                        ...a,
                        components: a.components.filter((c: ArtboardComponent) => c.instanceId !== selectedComponent.component.instanceId),
                        updatedAt: new Date().toISOString(),
                    }
                    : a
            )
        );
        setSelectedComponentId(null);
        setShowInspector(false);
    }, [selectedComponent, setArtboards, setSelectedComponentId]);

    // Copy a specific component by id (called from context menu)
    const handleCopyComponentById = useCallback(
        (componentId: string) => {
            for (const artboard of artboards) {
                const component = artboard.components.find((c: ArtboardComponent) => c.instanceId === componentId);
                if (component) {
                    setClipboard({
                        component: JSON.parse(JSON.stringify(component)),
                        artboardId: artboard.id,
                    });
                    // Also select the component
                    setSelectedComponentId(component.instanceId);
                    setShowInspector(true);
                    setSelectedArtboardId(null);
                    setShowAddArtboard(false);
                    return;
                }
            }
        },
        [artboards, setSelectedArtboardId, setSelectedComponentId],
    );

    // Paste clipboard into a specific artboard (called from context menu)
    const handlePasteToArtboard = useCallback(
        (artboardId: string) => {
            if (!clipboard) return;
            const newComponent: ArtboardComponent = {
                ...clipboard.component,
                instanceId: `${clipboard.component.componentType}-${Date.now()}`,
                position: {
                    ...clipboard.component.position,
                    x: clipboard.component.position.x + 20,
                    y: clipboard.component.position.y + 20,
                },
            };
            setArtboards((prev) =>
                prev.map((a) =>
                    a.id === artboardId
                        ? { ...a, components: [...a.components, newComponent], updatedAt: new Date().toISOString() }
                        : a
                )
            );
            setSelectedComponentId(newComponent.instanceId);
            setShowInspector(true);
        },
        [clipboard, setArtboards, setSelectedComponentId],
    );

    // Toggle visibility for the currently selected component
    const handleToggleSelectedVisibility = useCallback(() => {
        if (!selectedComponent) return;
        const { artboardId, component } = selectedComponent;
        const newHidden = !component.hidden;
        setArtboards((prev) =>
            prev.map((a) =>
                a.id === artboardId
                    ? {
                        ...a,
                        components: a.components.map((c: ArtboardComponent) =>
                            c.instanceId === component.instanceId ? { ...c, hidden: newHidden } : c
                        ),
                        updatedAt: new Date().toISOString(),
                    }
                    : a
            )
        );
    }, [selectedComponent, setArtboards]);

    // Toggle lock for the currently selected component
    const handleToggleSelectedLock = useCallback(() => {
        if (!selectedComponent) return;
        const { artboardId, component } = selectedComponent;
        const newLocked = !component.locked;
        setArtboards((prev) =>
            prev.map((a) =>
                a.id === artboardId
                    ? {
                        ...a,
                        components: a.components.map((c: ArtboardComponent) =>
                            c.instanceId === component.instanceId ? { ...c, locked: newLocked } : c
                        ),
                        updatedAt: new Date().toISOString(),
                    }
                    : a
            )
        );
    }, [selectedComponent, setArtboards]);

    // Flip selected component horizontally
    const handleFlipSelectedH = useCallback(() => {
        if (!selectedComponent) return;
        const { artboardId, component } = selectedComponent;
        const newFlipX = !component.flipX;
        setArtboards((prev) =>
            prev.map((a) =>
                a.id === artboardId
                    ? {
                        ...a,
                        components: a.components.map((c: ArtboardComponent) =>
                            c.instanceId === component.instanceId ? { ...c, flipX: newFlipX } : c
                        ),
                        updatedAt: new Date().toISOString(),
                    }
                    : a
            )
        );
    }, [selectedComponent, setArtboards]);

    // Flip selected component vertically
    const handleFlipSelectedV = useCallback(() => {
        if (!selectedComponent) return;
        const { artboardId, component } = selectedComponent;
        const newFlipY = !component.flipY;
        setArtboards((prev) =>
            prev.map((a) =>
                a.id === artboardId
                    ? {
                        ...a,
                        components: a.components.map((c: ArtboardComponent) =>
                            c.instanceId === component.instanceId ? { ...c, flipY: newFlipY } : c
                        ),
                        updatedAt: new Date().toISOString(),
                    }
                    : a
            )
        );
    }, [selectedComponent, setArtboards]);

    // Track artboard changes for undo/redo history
    useEffect(() => {
        // Skip if this change is from undo/redo
        if (isUndoRedoRef.current) {
            isUndoRedoRef.current = false;
            return;
        }

        const currentSnapshot = JSON.stringify(artboards);

        // Skip if artboards haven't actually changed
        if (currentSnapshot === lastArtboardsRef.current) {
            return;
        }

        // If we have a previous state, push it to history
        if (lastArtboardsRef.current !== '') {
            const previousArtboards = JSON.parse(lastArtboardsRef.current) as Artboard[];
            setHistory(prev => [...prev.slice(-49), previousArtboards]); // Keep max 50 history entries
            setFuture([]); // Clear redo stack on new change
        }

        lastArtboardsRef.current = currentSnapshot;
    }, [artboards]);

    // Undo handler
    const handleUndo = useCallback(() => {
        if (history.length === 0) return;

        const previousState = history[history.length - 1];
        const currentState = JSON.parse(JSON.stringify(artboards)) as Artboard[];

        isUndoRedoRef.current = true;
        setHistory(prev => prev.slice(0, -1));
        setFuture(prev => [...prev, currentState]);
        setArtboards(previousState);
        lastArtboardsRef.current = JSON.stringify(previousState);

        // Clear selection as the component might not exist anymore
        setSelectedComponentId(null);
        setShowInspector(false);
    }, [history, artboards, setArtboards, setSelectedComponentId]);

    // Redo handler
    const handleRedo = useCallback(() => {
        if (future.length === 0) return;

        const nextState = future[future.length - 1];
        const currentState = JSON.parse(JSON.stringify(artboards)) as Artboard[];

        isUndoRedoRef.current = true;
        setFuture(prev => prev.slice(0, -1));
        setHistory(prev => [...prev, currentState]);
        setArtboards(nextState);
        lastArtboardsRef.current = JSON.stringify(nextState);

        // Clear selection as the component might not exist anymore
        setSelectedComponentId(null);
        setShowInspector(false);
    }, [future, artboards, setArtboards, setSelectedComponentId]);

    // Handle keyboard shortcuts for copy/paste/duplicate/delete/undo/redo + new shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if user is editing text
            const target = e.target as HTMLElement;
            const isEditing = target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

            // Copy/Paste/Duplicate/Undo/Redo shortcuts (only when not editing text)
            if (!isEditing && (e.ctrlKey || e.metaKey)) {
                if (e.key.toLowerCase() === 'c' && !e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    handleCopy();
                }
                if (e.key.toLowerCase() === 'v' && !e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    handlePaste();
                }
                if (e.key.toLowerCase() === 'd' && !e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    handleDuplicate();
                }
                if (e.key.toLowerCase() === 'z' && !e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    handleUndo();
                }
                if (e.key.toLowerCase() === 'y' && !e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    handleRedo();
                }
                // Ctrl+Shift+H: Toggle visibility
                if (e.key.toLowerCase() === 'h' && e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    handleToggleSelectedVisibility();
                }
                // Ctrl+Shift+L: Toggle lock
                if (e.key.toLowerCase() === 'l' && e.shiftKey && !e.altKey) {
                    e.preventDefault();
                    handleToggleSelectedLock();
                }
            }

            // Shift-only shortcuts (no Ctrl/Meta)
            if (!isEditing && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
                // Shift+H: Flip horizontal
                if (e.key === 'H') {
                    e.preventDefault();
                    handleFlipSelectedH();
                }
                // Shift+V: Flip vertical
                if (e.key === 'V') {
                    e.preventDefault();
                    handleFlipSelectedV();
                }
            }

            // Z-order shortcuts: ] and [
            if (!isEditing && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
                if (e.key === ']') {
                    e.preventDefault();
                    // Bring to front via the container-level handler
                    // (handled in useKeyboardShortcuts or inline)
                }
                if (e.key === '[') {
                    e.preventDefault();
                }
            }

            // Delete/Backspace to remove selected component (only when not editing)
            if (!isEditing && (e.key === 'Delete' || e.key === 'Backspace')) {
                e.preventDefault();
                handleDeleteComponent();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleCopy, handlePaste, handleDuplicate, handleDeleteComponent, handleUndo, handleRedo, handleToggleSelectedVisibility, handleToggleSelectedLock, handleFlipSelectedH, handleFlipSelectedV]);

    // Click on empty canvas (outside artboards) to dismiss all panels
    const handleCanvasClick = useCallback(
        (e: React.MouseEvent) => {
            // Only dismiss if clicking directly on canvas background, not on artboards
            if (e.target === e.currentTarget) {
                setSelectedComponentId(null);
                setShowInspector(false);
                setSelectedArtboardId(null);
                setShowAddArtboard(false);
            }
        },
        [setSelectedArtboardId, setSelectedComponentId],
    );

    // Persistence - save to database
    const handleSave = useCallback(async (options?: { silent?: boolean }) => {
        const isSilent = options?.silent === true;

        if (isSilent && autosaveInFlightRef.current) {
            return;
        }

        if (isSilent) {
            autosaveInFlightRef.current = true;
        } else {
            setIsSaving(true);
            setSaveStatus('saving');
        }
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
                    dataSourceConfig: dataSourceConfig,
                }),
            });
            if (response.ok) {
                if (!isSilent) {
                    setSaveStatus('saved');
                    // Reset to idle after 2 seconds
                    setTimeout(() => setSaveStatus('idle'), 2000);
                }
            } else {
                console.error('Save failed:', await response.text());
                if (!isSilent) {
                    setSaveStatus('error');
                    setTimeout(() => setSaveStatus('idle'), 3000);
                }
            }
        } catch (error) {
            console.error('Save error:', error);
            if (!isSilent) {
                setSaveStatus('error');
                setTimeout(() => setSaveStatus('idle'), 3000);
            }
        } finally {
            if (isSilent) {
                autosaveInFlightRef.current = false;
            } else {
                setIsSaving(false);
            }
        }
    }, [artboards, currentDashboardId, currentDashboardName, dataSourceConfig]);

    useEffect(() => {
        if (!autosaveEnabled) return;

        if (!autosaveReadyRef.current) {
            autosaveReadyRef.current = true;
            return;
        }

        if (autosaveTimerRef.current) {
            window.clearTimeout(autosaveTimerRef.current);
        }

        autosaveTimerRef.current = window.setTimeout(() => {
            handleSave({ silent: true });
        }, 1200);

        return () => {
            if (autosaveTimerRef.current) {
                window.clearTimeout(autosaveTimerRef.current);
            }
        };
    }, [artboards, dataSourceConfig, autosaveEnabled, handleSave]);

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
                        onClick={handleCanvasClick}
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
                            .filter((a): a is Artboard => !!a)
                            .map((artboard, index) => (
                                <ArtboardContainer
                                    key={artboard.id}
                                    artboard={artboard}
                                    isSelected={selectedArtboardId === artboard.id}
                                    canvasScale={scale}
                                    scaleWithZoom={scaleWithZoom}
                                    zIndex={index}
                                    onUpdate={handleUpdateArtboard}
                                    onDelete={handleDeleteArtboard}
                                    onSelect={() => {
                                        setSelectedArtboardId(artboard.id);
                                        bringArtboardToFront(artboard.id);
                                        // Dismiss Add Artboard panel when selecting an artboard
                                        setShowAddArtboard(false);
                                    }}
                                    onSelectComponent={handleSelectComponent}
                                    onDeselectComponent={() => {
                                        // Close Component Inspector and Add Artboard panel when clicking empty artboard
                                        setSelectedComponentId(null);
                                        setShowInspector(false);
                                        setShowAddArtboard(false);
                                    }}
                                    selectedComponentId={
                                        selectedComponent?.artboardId === artboard.id ? selectedComponent.component.instanceId : undefined
                                    }
                                    onLivePositionChange={setLivePosition}
                                    onCopyComponent={handleCopyComponentById}
                                    onPasteComponent={handlePasteToArtboard}
                                    hasClipboard={!!clipboard}
                                />
                            ))}
                    </div>

                    {/* Hand mode overlay */}
                    {isHandMode && <div className="absolute inset-0 z-40 cursor-grab bg-transparent active:cursor-grabbing" />}

                    <CanvasScrollbars universe={universe} viewportSize={viewportSize} scale={scale} pan={pan} setPan={setPan} />
                </div>
            </div>

            {/* Panels */}
            {(showInspector || selectedArtboard) && (
                <ComponentInspector
                    component={
                        showInspector && selectedComponent
                            ? livePosition && livePosition.componentId === selectedComponent.component.instanceId
                                ? {
                                      ...selectedComponent.component,
                                      position: { ...selectedComponent.component.position, ...livePosition.position },
                                  }
                                : selectedComponent.component
                            : null
                    }
                    onConfigChange={handleComponentConfigChange}
                    onPositionChange={handleComponentPositionChange}
                    onClose={handleCloseInspector}
                    title={!showInspector && selectedArtboard ? 'Artboard Inspector' : undefined}
                >
                    {!showInspector && selectedArtboard && (
                        <ArtboardInspectorContent
                            artboard={selectedArtboard}
                            onUpdate={(updates) => selectedArtboardId && handleUpdateArtboard(selectedArtboardId, updates)}
                        />
                    )}
                </ComponentInspector>
            )}

            {showAddArtboard && (
                <AddArtboardPanel
                    onAddArtboard={(format: ArtboardFormat) => {
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



