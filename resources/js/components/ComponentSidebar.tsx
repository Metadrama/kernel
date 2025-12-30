/**
 * ComponentSidebar - Main sidebar with components browser, layers panel, and saved states picker
 */

import { Button } from '@/components/ui/button';
import { useArtboardContext } from '@/context/ArtboardContext';
import { router } from '@inertiajs/react';
import { Download, FolderOpen, PanelLeft, PanelLeftClose, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ComponentsPanel, LayersPanel } from './sidebar';

interface SavedState {
    id: string;
    name: string;
    updatedAt: string | null;
    createdAt?: string | null;
    artboardCount: number;
}

interface ComponentSidebarProps {
    savedDashboards?: SavedState[];
    currentDashboardId?: string;
}

export default function ComponentSidebar({ savedDashboards = [], currentDashboardId }: ComponentSidebarProps) {
    const { artboards, setArtboards, selectedArtboardId, setSelectedArtboardId, artboardStackOrder, bringArtboardToFront, moveArtboardLayer } =
        useArtboardContext();

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activePanel, setActivePanel] = useState<'components' | 'layers'>('components');
    const [showDashboardPicker, setShowDashboardPicker] = useState(false);
    const pickerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [discardingId, setDiscardingId] = useState<string | null>(null);

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

    // Hover handlers for dashboard picker
    const handlePickerMouseEnter = () => {
        if (pickerTimeoutRef.current) clearTimeout(pickerTimeoutRef.current);
        setShowDashboardPicker(true);
    };

    const handlePickerMouseLeave = () => {
        pickerTimeoutRef.current = setTimeout(() => {
            setShowDashboardPicker(false);
        }, 300); // Small delay to allow moving to dropdown
    };

    const handleLoadDashboard = async (stateId: string) => {
        if (!currentDashboardId) return;

        setDiscardingId(stateId);
        try {
            // Load snapshot
            const res = await fetch(`/dashboard/${currentDashboardId}/states/${stateId}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!res.ok) {
                const text = await res.text();
                console.error('Load state failed (HTTP)', res.status, text);
                window.alert('Failed to load saved state. See console for details.');
                return;
            }

            const data = (await res.json().catch(() => null)) as { status?: string; state?: { artboards?: unknown[] }; message?: string } | null;

            if (!data || data.status !== 'ok' || !data.state) {
                console.error('Load state failed (API)', data);
                window.alert(data?.message || 'Failed to load saved state.');
                return;
            }

            // Apply snapshot to current working copy in-memory
            setArtboards((data.state.artboards as unknown as typeof artboards) ?? []);
            setSelectedArtboardId(null);
        } catch (error) {
            console.error('Load state failed (network)', error);
            window.alert('Failed to load saved state. See console for details.');
        } finally {
            setDiscardingId(null);
            setShowDashboardPicker(false);
        }
    };

    const handleDiscardState = async (stateId: string, stateName: string) => {
        if (!currentDashboardId) return;

        const ok = window.confirm(`Discard saved state "${stateName}"? This cannot be undone.`);
        if (!ok) return;

        setDiscardingId(stateId);

        try {
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() ?? '');
                return '';
            };
            const csrfToken = getCookie('XSRF-TOKEN');

            const res = await fetch(`/dashboard/${currentDashboardId}/states/${stateId}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': csrfToken,
                },
            });

            if (!res.ok) {
                const text = await res.text();
                console.error('Discard state failed (HTTP)', res.status, text);
                window.alert(`Failed to discard "${stateName}". See console for details.`);
                return;
            }

            const data = (await res.json().catch(() => null)) as { status?: string; message?: string } | null;
            if (data?.status === 'error') {
                console.error('Discard state failed (API)', data);
                window.alert(data.message || `Failed to discard "${stateName}".`);
                return;
            }

            // Refresh the Inertia page props (saved states list)
            router.reload({ only: ['savedDashboards'] });
        } catch (error) {
            console.error('Discard state failed (network)', error);
            window.alert(`Failed to discard "${stateName}". See console for details.`);
        } finally {
            setDiscardingId(null);
            setShowDashboardPicker(false);
        }
    };

    // Export a specific dashboard to desktop as JSON file
    const handleExportDashboard = async (dashId: string, dashName: string) => {
        try {
            // For current dashboard, use local state
            if (dashId === currentDashboardId) {
                const data = {
                    id: dashId,
                    name: dashName,
                    artboards: artboards,
                    exportedAt: new Date().toISOString(),
                };
                downloadJson(data, dashId);
            } else {
                // For other dashboards, just export metadata with a note
                const data = {
                    id: dashId,
                    name: dashName,
                    note: 'Load this dashboard first to export full data',
                    exportedAt: new Date().toISOString(),
                };
                downloadJson(data, dashId);
            }
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const downloadJson = (data: object, id: string) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-${id}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
        <div className="flex h-screen w-80 flex-col border-r bg-card shadow-sm">
            {/* Header */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
                <h2 className="text-lg font-semibold">BM://</h2>
                <div className="flex items-center gap-1">
                    {/* Dashboard Picker with hover */}
                    <div className="relative" onMouseEnter={handlePickerMouseEnter} onMouseLeave={handlePickerMouseLeave}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Saved States">
                            <FolderOpen className="h-4 w-4" />
                        </Button>

                        {/* Dropdown on hover */}
                        {showDashboardPicker && (
                            <div
                                className="absolute top-full right-0 z-50 mt-1 w-64 rounded-lg border bg-card shadow-lg"
                                onMouseEnter={handlePickerMouseEnter}
                                onMouseLeave={handlePickerMouseLeave}
                            >
                                <div className="border-b p-3">
                                    <p className="text-xs font-medium text-muted-foreground">SAVED STATES</p>
                                </div>

                                {savedDashboards.length === 0 ? (
                                    <div className="p-3">
                                        <p className="text-xs text-muted-foreground">No saved states yet.</p>
                                    </div>
                                ) : (
                                    <div className="max-h-48 overflow-y-auto p-1">
                                        {savedDashboards.map((dash) => (
                                            <div
                                                key={dash.id}
                                                className={`flex items-center gap-1 rounded-md transition hover:bg-muted ${
                                                    dash.id === currentDashboardId ? 'bg-muted' : ''
                                                }`}
                                            >
                                                <button
                                                    onClick={() => handleLoadDashboard(dash.id)}
                                                    className="flex-1 px-3 py-2 text-left text-sm"
                                                    title="Load state"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className={`truncate ${dash.id === currentDashboardId ? 'font-medium' : ''}`}>
                                                            {dash.name}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">{dash.artboardCount}</span>
                                                    </div>
                                                </button>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleExportDashboard(dash.id, dash.name);
                                                    }}
                                                    className="rounded-md p-2 transition hover:bg-background"
                                                    title={`Export ${dash.name}`}
                                                >
                                                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                                </button>

                                                <button
                                                    disabled={!currentDashboardId || discardingId === dash.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDiscardState(dash.id, dash.name);
                                                    }}
                                                    className="rounded-md p-2 transition hover:bg-background disabled:opacity-50"
                                                    title={!currentDashboardId ? 'No active dashboard scope' : `Discard ${dash.name}`}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

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
                            className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                                activePanel === panel
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
                    onSelectArtboard={handleSelectArtboard}
                    onToggleVisibility={handleToggleVisibility}
                    onToggleLock={handleToggleLock}
                    onMoveLayer={handleMoveLayer}
                />
            )}

            {/* Footer */}
            <div className="shrink-0 border-t bg-card/95 p-3">
                <p className="text-center text-xs text-muted-foreground">Drag components onto the canvas or into widgets</p>
            </div>
        </div>
    );
}
