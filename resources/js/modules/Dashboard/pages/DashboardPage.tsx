import type { DashboardLayout } from '@/modules/Dashboard/types/dashboard';
import { Head } from '@inertiajs/react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { ArtboardProvider } from '@/modules/Artboard/context/ArtboardContext';
import { DragDropProvider } from '@/modules/Artboard/context/DragDropContext';
import { useMediaQuery } from '@/modules/DesignSystem/hooks/useMediaQuery';
import { Loader2 } from 'lucide-react';

const ComponentSidebar = lazy(() => import('@/modules/Dashboard/components/ComponentSidebar'));
const ArtboardCanvas = lazy(() => import('@/modules/Artboard/components/ArtboardCanvas'));
const MobileDashboardView = lazy(() => import('@/modules/Dashboard/components/MobileDashboardView'));

interface SavedDashboard {
    id: string;
    name: string;
    updatedAt: string | null;
    artboardCount: number;
}

interface DashboardProps {
    savedDashboards: SavedDashboard[];
    currentDashboard: DashboardLayout | null;
}

const LAST_WORKSPACE_KEY = 'last-workspace-id';

function DashboardSkeleton() {
    return (
        <div className="flex h-screen items-center justify-center bg-background text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2 text-sm font-medium">Loading Workspace...</span>
        </div>
    );
}

export default function Dashboard({ currentDashboard }: DashboardProps) {
    // Media query matches Tailwind's 'md' breakpoint (768px)
    // Note: Default to true (Desktop) for SSR to match the most common use case 
    // or handle hydration mismatch carefully.
    // For now, we'll let it hydrate.
    const isDesktop = useMediaQuery('(min-width: 768px)');

    // Prepare initial data from server props
    const initialData = currentDashboard
        ? {
            dashboardId: currentDashboard.id,
            dashboardName: currentDashboard.name,
            artboards: currentDashboard.artboards ?? [],
        }
        : undefined;

    // Client-side redirect: /dashboard should open the last workspace if available.
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const path = window.location.pathname;
        const isBaseDashboardRoute = path === '/dashboard' || path === '/dashboard/';

        if (!isBaseDashboardRoute) return;

        const lastId = window.localStorage.getItem(LAST_WORKSPACE_KEY);
        if (!lastId || lastId === 'default') return;

        window.location.replace(`/dashboard/${lastId}`);
    }, []);

    // Track last opened workspace whenever a specific workspace is loaded.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!currentDashboard?.id) return;

        try {
            window.localStorage.setItem(LAST_WORKSPACE_KEY, currentDashboard.id);
        } catch {
            // ignore
        }
    }, [currentDashboard?.id]);

    return (
        <>
            <Head title="Dashboard Builder" />
            <ArtboardProvider initialData={initialData}>
                <DragDropProvider>
                    <Suspense fallback={<DashboardSkeleton />}>
                        {isDesktop ? (
                            <div className="flex h-screen overflow-hidden bg-background">
                                <ComponentSidebar />
                                <ArtboardCanvas />
                            </div>
                        ) : (
                            <div className="flex h-screen overflow-hidden bg-background">
                                <MobileDashboardView />
                            </div>
                        )}
                    </Suspense>
                </DragDropProvider>
            </ArtboardProvider>
        </>
    );
}




