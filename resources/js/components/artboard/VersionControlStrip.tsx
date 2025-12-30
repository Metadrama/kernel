import { router, usePage } from '@inertiajs/react';
import { Clock, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useArtboardContext } from '@/context/ArtboardContext';
import { cn } from '@/lib/utils';

/**
 * VersionControlStrip
 *
 * Always-visible, IDE-style (VSCode/Zed-like) bottom bar for versioning.
 * - Fixed height: 28px
 * - Full width
 * - Shows compact status + actions
 * - Saved States list appears in a popover (NOT inline expansion)
 *
 * Contract / endpoints (current app):
 * - Create snapshot: POST `/dashboard/save` with payload { id: workspaceId, name, artboards }
 * - List snapshots is provided via Inertia props as `savedDashboards` (legacy prop name)
 * - Load snapshot: GET `/dashboard/{workspaceId}/states/{stateId}`
 * - Discard snapshot: DELETE `/dashboard/{workspaceId}/states/{stateId}`
 *
 * Naming:
 * - Workspace = scope (URL-based)
 * - Saved State = snapshot/version
 * - Dashboard = export/output (handled elsewhere)
 */

type SavedState = {
    id: string;
    name: string;
    updatedAt: string | null;
    createdAt?: string | null;
    artboardCount: number;
};

type PageProps = {
    currentDashboard?: { id: string; name?: string } | null;
    // Legacy prop name used throughout the app; represents Saved States now.
    savedDashboards?: SavedState[];
};

function formatTimestamp(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    // IDE-style compact
    return d.toLocaleString(undefined, {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function defaultStateName(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `State ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getCookie(name: string): string {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() ?? '');
    return '';
}

export default function VersionControlStrip() {
    const page = usePage<PageProps>();
    const { artboards, setArtboards, setSelectedArtboardId } = useArtboardContext();

    const workspaceId = page.props.currentDashboard?.id ?? 'default';
    const workspaceName = page.props.currentDashboard?.name ?? 'Untitled Workspace';

    const savedStates = useMemo(() => page.props.savedDashboards ?? [], [page.props.savedDashboards]);

    const latestState = useMemo(() => (savedStates.length > 0 ? savedStates[0] : null), [savedStates]);

    const [busyOp, setBusyOp] = useState<'idle' | 'saving' | 'loading' | 'deleting' | 'refreshing' | 'error'>('idle');

    const statusText = useMemo(() => {
        if (busyOp === 'saving') return 'Saving state…';
        if (busyOp === 'loading') return 'Loading…';
        if (busyOp === 'deleting') return 'Discarding…';
        if (busyOp === 'refreshing') return 'Refreshing…';
        if (busyOp === 'error') return 'Error';
        if (!latestState) return 'No saved states';
        const ts = formatTimestamp(latestState.updatedAt || latestState.createdAt);
        return ts ? `Last: ${latestState.name} • ${ts}` : `Last: ${latestState.name}`;
    }, [busyOp, latestState]);

    const reloadStates = useCallback(async () => {
        setBusyOp('refreshing');
        try {
            router.reload({ only: ['savedDashboards'] });
            // router.reload is async-ish but no promise; keep it short.
            window.setTimeout(() => setBusyOp('idle'), 350);
        } catch (e) {
            console.error('Refresh states failed', e);
            setBusyOp('error');
            window.setTimeout(() => setBusyOp('idle'), 1200);
        }
    }, []);

    const createState = useCallback(async () => {
        const name = window.prompt('Name this saved state:', defaultStateName());
        if (!name) return;

        setBusyOp('saving');

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
                    id: workspaceId,
                    name,
                    artboards,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                console.error('Create state failed (HTTP)', res.status, text);
                setBusyOp('error');
                window.setTimeout(() => setBusyOp('idle'), 1200);
                return;
            }

            const data = (await res.json().catch(() => null)) as { status?: string; message?: string } | null;
            if (data?.status === 'error') {
                console.error('Create state failed (API)', data);
                setBusyOp('error');
                window.setTimeout(() => setBusyOp('idle'), 1200);
                return;
            }

            // Update list
            router.reload({ only: ['savedDashboards'] });
            window.setTimeout(() => setBusyOp('idle'), 650);
        } catch (e) {
            console.error('Create state failed (network)', e);
            setBusyOp('error');
            window.setTimeout(() => setBusyOp('idle'), 1200);
        }
    }, [artboards, workspaceId]);

    const loadState = useCallback(
        async (stateId: string) => {
            if (!stateId) return;

            setBusyOp('loading');

            try {
                const res = await fetch(`/dashboard/${workspaceId}/states/${stateId}`, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!res.ok) {
                    const text = await res.text();
                    console.error('Load state failed (HTTP)', res.status, text);
                    setBusyOp('error');
                    window.setTimeout(() => setBusyOp('idle'), 1200);
                    return;
                }

                const data = (await res.json().catch(() => null)) as { status?: string; state?: { artboards?: unknown } } | null;
                if (!data || data.status !== 'ok' || !data.state) {
                    console.error('Load state failed (API)', data);
                    setBusyOp('error');
                    window.setTimeout(() => setBusyOp('idle'), 1200);
                    return;
                }

                setArtboards((data.state.artboards as unknown as typeof artboards) ?? []);
                setSelectedArtboardId(null);

                setBusyOp('idle');
            } catch (e) {
                console.error('Load state failed (network)', e);
                setBusyOp('error');
                window.setTimeout(() => setBusyOp('idle'), 1200);
            }
        },
        [setArtboards, setSelectedArtboardId, workspaceId],
    );

    const discardState = useCallback(
        async (stateId: string, stateName: string) => {
            const ok = window.confirm(`Discard saved state "${stateName}"? This cannot be undone.`);
            if (!ok) return;

            setBusyOp('deleting');

            try {
                const csrfToken = getCookie('XSRF-TOKEN');

                const res = await fetch(`/dashboard/${workspaceId}/states/${stateId}`, {
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
                    setBusyOp('error');
                    window.setTimeout(() => setBusyOp('idle'), 1200);
                    return;
                }

                const data = (await res.json().catch(() => null)) as { status?: string; message?: string } | null;
                if (data?.status === 'error') {
                    console.error('Discard state failed (API)', data);
                    setBusyOp('error');
                    window.setTimeout(() => setBusyOp('idle'), 1200);
                    return;
                }

                router.reload({ only: ['savedDashboards'] });
                window.setTimeout(() => setBusyOp('idle'), 350);
            } catch (e) {
                console.error('Discard state failed (network)', e);
                setBusyOp('error');
                window.setTimeout(() => setBusyOp('idle'), 1200);
            }
        },
        [workspaceId],
    );

    const busy = busyOp !== 'idle';

    return (
        <div
            className={cn(
                'shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
                'h-7', // 28px via Tailwind h-7
            )}
            style={{ height: 28 }}
        >
            <div className="flex h-full items-center justify-between px-3">
                {/* Left: label + status */}
                <div className="flex min-w-0 items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground/90">Saved States</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="max-w-[22vw] truncate text-xs text-muted-foreground" title={workspaceName}>
                        {workspaceName}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span
                        className={cn(
                            'max-w-[45vw] truncate text-xs',
                            busyOp === 'error'
                                ? 'text-red-600'
                                : busyOp === 'saving'
                                  ? 'text-foreground'
                                  : busyOp === 'loading'
                                    ? 'text-foreground'
                                    : 'text-muted-foreground',
                        )}
                        title={statusText}
                    >
                        {statusText}
                    </span>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={reloadStates} disabled={busy} title="Refresh saved states">
                        <RefreshCcw className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={createState}
                        disabled={busy}
                        title="Create saved state (snapshot)"
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </Button>

                    <Popover>
                        <PopoverTrigger>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" disabled={busy} title="Browse saved states">
                                States…
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent side="top" align="end" sideOffset={8} className="w-[360px] p-2">
                            <div className="flex items-center justify-between px-1 pb-2">
                                <div className="text-xs font-medium">Saved States</div>
                                <div className="text-[11px] text-muted-foreground">{savedStates.length} total</div>
                            </div>

                            {savedStates.length === 0 ? (
                                <div className="px-1 py-3 text-xs text-muted-foreground">No saved states yet.</div>
                            ) : (
                                <div className="max-h-72 overflow-y-auto pr-1">
                                    <div className="flex flex-col gap-1">
                                        {savedStates.map((s) => {
                                            const ts = formatTimestamp(s.updatedAt || s.createdAt);
                                            return (
                                                <div
                                                    key={s.id}
                                                    className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 hover:bg-muted/40"
                                                >
                                                    <button
                                                        type="button"
                                                        className="min-w-0 flex-1 text-left"
                                                        onClick={() => loadState(s.id)}
                                                        disabled={busy}
                                                        title={`Load "${s.name}"`}
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="truncate text-xs font-medium">{s.name}</span>
                                                            <span className="shrink-0 text-[11px] text-muted-foreground">{s.artboardCount}</span>
                                                        </div>
                                                        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{ts ? ts : ''}</div>
                                                    </button>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => discardState(s.id, s.name)}
                                                        disabled={busy}
                                                        title={`Discard "${s.name}"`}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </div>
    );
}
