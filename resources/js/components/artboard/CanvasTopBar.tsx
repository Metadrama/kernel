/**
 * CanvasTopBar - Top toolbar for the canvas
 *
 * Displays workspace tabs (URL-based), dashboard title, artboard count, zoom controls, and action buttons.
 *
 * Tabs strategy:
 * - URL-based navigation (Inertia) for robustness and clear mental model
 * - Local persistence of open workspace tabs
 */

import { Button } from '@/components/ui/button';
import { router, usePage } from '@inertiajs/react';
import { Check, Loader2, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type WorkspaceTab = {
    id: string;
    name?: string;
};

const TABS_STORAGE_KEY = 'workspace-tabs:v1';

function loadTabsFromStorage(): WorkspaceTab[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(TABS_STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed
            .filter((t): t is { id: unknown; name?: unknown } => typeof t === 'object' && t !== null && 'id' in t)
            .filter((t): t is { id: string; name?: unknown } => typeof t.id === 'string')
            .map((t) => ({
                id: t.id,
                name: typeof t.name === 'string' ? t.name : undefined,
            }));
    } catch {
        return [];
    }
}

function saveTabsToStorage(tabs: WorkspaceTab[]) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabs));
    } catch {
        // ignore
    }
}

interface CanvasTopBarProps {
    artboardCount: number;
    scale: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
    onSave: () => void;
    isSaving?: boolean;
    saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
}

export default function CanvasTopBar({
    artboardCount,
    scale,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onSave,
    isSaving = false,
    saveStatus = 'idle',
}: CanvasTopBarProps) {
    const page = usePage<{ currentDashboard?: { id: string; name?: string } | null }>();
    const currentWorkspaceId = page.props.currentDashboard?.id ?? 'default';
    const currentWorkspaceName = page.props.currentDashboard?.name ?? 'Untitled Workspace';

    const [tabs, setTabs] = useState<WorkspaceTab[]>(() => loadTabsFromStorage());

    // Ensure current workspace is in the tabs list
    useEffect(() => {
        setTabs((prev) => {
            const exists = prev.some((t) => t.id === currentWorkspaceId);
            const next = exists
                ? prev.map((t) => (t.id === currentWorkspaceId ? { ...t, name: currentWorkspaceName } : t))
                : [{ id: currentWorkspaceId, name: currentWorkspaceName }, ...prev];
            saveTabsToStorage(next);
            return next;
        });
    }, [currentWorkspaceId, currentWorkspaceName]);

    const orderedTabs = useMemo(() => {
        // Keep current tab first for quick access; preserve others order
        const current = tabs.find((t) => t.id === currentWorkspaceId);
        const rest = tabs.filter((t) => t.id !== currentWorkspaceId);
        return current ? [current, ...rest] : tabs;
    }, [tabs, currentWorkspaceId]);

    const switchToWorkspace = (id: string) => {
        if (!id || id === currentWorkspaceId) return;
        router.visit(`/dashboard/${id}`);
    };

    const closeTab = (id: string) => {
        setTabs((prev) => {
            const next = prev.filter((t) => t.id !== id);
            saveTabsToStorage(next);

            // If closing active tab, fall back to the first remaining tab; otherwise go to /dashboard (default)
            if (id === currentWorkspaceId) {
                const fallback = next[0]?.id;
                if (fallback) {
                    router.visit(`/dashboard/${fallback}`);
                } else {
                    router.visit('/dashboard');
                }
            }

            return next;
        });
    };

    return (
        <div className="relative z-50 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex min-w-0 items-center gap-3">
                {/* Workspace tabs */}
                <div className="flex max-w-[40vw] items-center gap-1 overflow-x-auto pr-1">
                    {orderedTabs.map((t) => {
                        const active = t.id === currentWorkspaceId;
                        return (
                            <div
                                key={t.id}
                                className={`group flex items-center rounded-md border px-2 py-1 text-xs ${active ? 'border-foreground/20 bg-muted' : 'border-border bg-background hover:bg-muted/50'}`}
                            >
                                <button
                                    type="button"
                                    className="max-w-[160px] truncate"
                                    onClick={() => switchToWorkspace(t.id)}
                                    title={t.name || t.id}
                                >
                                    {t.name || t.id}
                                </button>
                                <button
                                    type="button"
                                    className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded hover:bg-background/60"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        closeTab(t.id);
                                    }}
                                    title="Close tab"
                                >
                                    <X className="h-3 w-3 text-muted-foreground" />
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Workspace title + meta */}
                <div className="flex min-w-0 items-center gap-2">
                    <h1 className="truncate text-sm font-semibold">{currentWorkspaceName}</h1>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                        {artboardCount} {artboardCount === 1 ? 'artboard' : 'artboards'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="mr-2 flex items-center rounded-md border bg-background shadow-sm">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none rounded-l-md border-r"
                        onClick={onZoomOut}
                        title="Zoom Out (Ctrl+-)"
                    >
                        <span className="text-xs">-</span>
                    </Button>
                    <div className="flex w-14 items-center justify-center px-2 text-xs font-medium">{Math.round(scale * 100)}%</div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none border-r" onClick={onZoomIn} title="Zoom In (Ctrl++)">
                        <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-none rounded-r-md"
                        onClick={onZoomReset}
                        title="Reset Zoom (Ctrl+0)"
                    >
                        <span className="text-xs">1:1</span>
                    </Button>
                </div>

                <Button variant="outline" size="sm">
                    Preview
                </Button>
                <Button
                    size="sm"
                    className={`min-w-[70px] transition-all ${
                        saveStatus === 'saved'
                            ? 'bg-green-600 hover:bg-green-700'
                            : saveStatus === 'error'
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-black hover:bg-black/90'
                    } text-white`}
                    onClick={onSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : saveStatus === 'saved' ? (
                        <>
                            <Check className="mr-1 h-4 w-4" />
                            Saved
                        </>
                    ) : saveStatus === 'error' ? (
                        'Error!'
                    ) : (
                        'Save'
                    )}
                </Button>
            </div>
        </div>
    );
}
