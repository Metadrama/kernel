/**
 * CanvasTopBar - Top toolbar for the canvas
 *
 * Replaces workspace tabs with a workspace dropdown (list/create/delete).
 *
 * Workspace model:
 * - Workspace = dashboard/project (URL-based: /dashboard/{id})
 * - Manual Save persists the current workspace working copy (POST /dashboard/save)
 * - Delete workspace (DELETE /dashboard/{id}) (default workspace cannot be deleted)
 *
 * Notes:
 * - This component fetches the workspace list on open (GET /dashboard/list).
 * - Create workspace uses POST /dashboard/save with a new id and empty artboards (minimal implementation).
 */

import { Button } from '@/modules/DesignSystem/ui/button';
import { Input } from '@/modules/DesignSystem/ui/input';
import { cn } from '@/modules/DesignSystem/lib/utils';
import { router, usePage } from '@inertiajs/react';
import { Check, ChevronDown, FolderOpen, Loader2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WorkspaceSettingsDialog } from '@/modules/Dashboard/components/WorkspaceSettingsDialog';

const SHOW_DEFAULT_WORKSPACE_IN_DROPDOWN = false;

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

type WorkspaceMeta = {
    id: string;
    name: string;
    updatedAt: string | null;
    artboardCount: number;
};

type PageProps = {
    currentDashboard?: { id: string; name?: string } | null;
    savedDashboards?: WorkspaceMeta[];
};

function getCookie(name: string): string {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() ?? '');
    return '';
}

function defaultWorkspaceName(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `Workspace ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function newWorkspaceId(): string {
    // simple unique-ish id; avoids special chars
    return `ws-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
    const page = usePage<PageProps>();
    const currentWorkspaceId = page.props.currentDashboard?.id ?? 'default';
    const currentWorkspaceName = page.props.currentDashboard?.name ?? 'Untitled Workspace';

    const [menuOpen, setMenuOpen] = useState(false);
    const [workspaces, setWorkspaces] = useState<WorkspaceMeta[]>(() => page.props.savedDashboards ?? []);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [filter, setFilter] = useState('');
    const [busyId, setBusyId] = useState<string | null>(null);

    const menuRef = useRef<HTMLDivElement | null>(null);

    const refreshWorkspaces = useCallback(async () => {
        setIsLoadingList(true);
        try {
            const res = await fetch('/dashboard/list', {
                method: 'GET',
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            });
            if (!res.ok) {
                console.error('Failed to load workspaces (HTTP)', res.status, await res.text());
                return;
            }
            const data = (await res.json()) as WorkspaceMeta[];
            if (Array.isArray(data)) {
                setWorkspaces(data);
            }
        } catch (e) {
            console.error('Failed to load workspaces (network)', e);
        } finally {
            setIsLoadingList(false);
        }
    }, []);

    useEffect(() => {
        // keep initial props in sync (Inertia reloads)
        if (Array.isArray(page.props.savedDashboards)) {
            setWorkspaces(page.props.savedDashboards);
        }
    }, [page.props.savedDashboards]);

    useEffect(() => {
        if (!menuOpen) return;

        // lazy refresh on open to keep list current
        refreshWorkspaces();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuOpen(false);
        };
        const onPointerDown = (e: PointerEvent) => {
            const target = e.target as Node | null;
            if (!target) return;
            if (menuRef.current && menuRef.current.contains(target)) return;
            setMenuOpen(false);
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('pointerdown', onPointerDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('pointerdown', onPointerDown);
        };
    }, [menuOpen, refreshWorkspaces]);

    const filteredWorkspaces = useMemo(() => {
        const q = filter.trim().toLowerCase();
        const base = SHOW_DEFAULT_WORKSPACE_IN_DROPDOWN ? workspaces : workspaces.filter((w) => w.id !== 'default');

        if (!q) return base;

        return base.filter((w) => {
            return w.name.toLowerCase().includes(q) || w.id.toLowerCase().includes(q);
        });
    }, [filter, workspaces]);

    const switchWorkspace = useCallback(
        (id: string) => {
            if (!id || id === currentWorkspaceId) return;
            setMenuOpen(false);
            router.visit(`/dashboard/${id}`);
        },
        [currentWorkspaceId],
    );

    const createWorkspace = useCallback(async () => {
        const name = window.prompt('Workspace name:', defaultWorkspaceName());
        if (!name) return;

        const id = newWorkspaceId();
        setBusyId(id);

        try {
            const csrfToken = getCookie('XSRF-TOKEN');
            const res = await fetch('/dashboard/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    id,
                    name,
                    artboards: [],
                }),
            });

            if (!res.ok) {
                console.error('Create workspace failed (HTTP)', res.status, await res.text());
                window.alert('Failed to create workspace. See console for details.');
                return;
            }

            // reload list & navigate
            await refreshWorkspaces();
            setMenuOpen(false);
            router.visit(`/dashboard/${id}`);
        } catch (e) {
            console.error('Create workspace failed (network)', e);
            window.alert('Failed to create workspace. See console for details.');
        } finally {
            setBusyId(null);
        }
    }, [refreshWorkspaces]);

    const deleteWorkspace = useCallback(
        async (id: string, name: string) => {
            if (id === 'default') return;

            const ok = window.confirm(`Delete workspace "${name}"?\n\nThis permanently deletes the workspace from the server.`);
            if (!ok) return;

            setBusyId(id);

            try {
                const csrfToken = getCookie('XSRF-TOKEN');
                const res = await fetch(`/dashboard/${id}`, {
                    method: 'DELETE',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': csrfToken,
                    },
                });

                if (!res.ok) {
                    console.error('Delete workspace failed (HTTP)', res.status, await res.text());
                    window.alert('Failed to delete workspace. See console for details.');
                    return;
                }

                await refreshWorkspaces();

                // If deleting active workspace, navigate back to /dashboard (default)
                if (id === currentWorkspaceId) {
                    setMenuOpen(false);
                    router.visit('/dashboard');
                }
            } catch (e) {
                console.error('Delete workspace failed (network)', e);
                window.alert('Failed to delete workspace. See console for details.');
            } finally {
                setBusyId(null);
            }
        },
        [currentWorkspaceId, refreshWorkspaces],
    );

    return (
        <div className="relative z-50 flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {/* Left: Workspace dropdown + meta */}
            <div className="flex min-w-0 items-center gap-3">
                <div className="relative" ref={menuRef}>
                    <Button variant="ghost" size="sm" className="h-9 px-2" onClick={() => setMenuOpen((v) => !v)} title="Workspaces">
                        <FolderOpen className="mr-2 h-4 w-4" />
                        <span className="max-w-[220px] truncate">{currentWorkspaceName}</span>
                        <ChevronDown className="ml-2 h-4 w-4 text-muted-foreground" />
                    </Button>

                    {menuOpen && (
                        <div className="absolute top-full left-0 mt-2 w-[360px] rounded-lg border bg-card shadow-lg">
                            <div className="flex items-center justify-between gap-2 border-b p-2">
                                <div className="text-xs font-medium text-muted-foreground">WORKSPACES</div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    onClick={createWorkspace}
                                    disabled={busyId !== null}
                                    title="Create workspace"
                                >
                                    <Plus className="mr-1 h-4 w-4" />
                                    New
                                </Button>
                            </div>

                            <div className="p-2">
                                <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search workspaces…" className="h-8" />
                            </div>

                            <div className="max-h-64 overflow-y-auto p-1">
                                {isLoadingList ? (
                                    <div className="p-3 text-xs text-muted-foreground">Loading…</div>
                                ) : filteredWorkspaces.length === 0 ? (
                                    <div className="p-3 text-xs text-muted-foreground">No workspaces found.</div>
                                ) : (
                                    filteredWorkspaces.map((w) => {
                                        const active = w.id === currentWorkspaceId;
                                        const busy = busyId === w.id;

                                        return (
                                            <div
                                                key={w.id}
                                                className={cn(
                                                    'flex items-center gap-1 rounded-md transition hover:bg-muted',
                                                    active ? 'bg-muted' : '',
                                                )}
                                            >
                                                <button
                                                    type="button"
                                                    className="flex-1 px-3 py-2 text-left"
                                                    onClick={() => switchWorkspace(w.id)}
                                                    disabled={busy}
                                                    title={`Open ${w.name}`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={cn('truncate text-sm', active ? 'font-medium' : '')}>{w.name}</span>
                                                        <span className="shrink-0 text-xs text-muted-foreground">{w.artboardCount}</span>
                                                    </div>
                                                    <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{w.id}</div>
                                                </button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteWorkspace(w.id, w.name);
                                                    }}
                                                    disabled={busy || w.id === 'default'}
                                                    title={w.id === 'default' ? 'Cannot delete default workspace' : `Delete ${w.name}`}
                                                >
                                                    {busy ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </Button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="border-t p-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-full justify-start text-xs"
                                    onClick={refreshWorkspaces}
                                    disabled={isLoadingList || busyId !== null}
                                    title="Refresh workspace list"
                                >
                                    Refresh list
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                    {artboardCount} {artboardCount === 1 ? 'artboard' : 'artboards'}
                </span>
            </div>

            {/* Right: zoom + actions */}
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

                <WorkspaceSettingsDialog />

                <Button variant="outline" size="sm">
                    Export
                </Button>

                <Button
                    size="sm"
                    className={cn(
                        'min-w-[90px] text-white transition-all',
                        saveStatus === 'saved'
                            ? 'bg-green-600 hover:bg-green-700'
                            : saveStatus === 'error'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-black hover:bg-black/90',
                    )}
                    onClick={onSave}
                    disabled={isSaving}
                    title="Save Workspace"
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

