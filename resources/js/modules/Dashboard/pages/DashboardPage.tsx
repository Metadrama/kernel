import ComponentSidebar from '@/modules/Dashboard/components/ComponentSidebar';
import ArtboardCanvas from '@/modules/Artboard/components/ArtboardCanvas';
import MobileDashboardView from '@/modules/Dashboard/components/MobileDashboardView';
import { ArtboardProvider } from '@/modules/Artboard/context/ArtboardContext';
import { DragDropProvider } from '@/modules/Artboard/context/DragDropContext';
import type { DashboardLayout } from '@/modules/Dashboard/types/dashboard';
import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

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

export default function Dashboard({ currentDashboard }: DashboardProps) {
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
                    {/* Desktop View */}
                    <div className="hidden h-screen overflow-hidden bg-background md:flex">
                        <ComponentSidebar />
                        <ArtboardCanvas />
                    </div>

                    {/* Mobile View */}
                    <div className="flex h-screen overflow-hidden bg-background md:hidden">
                        <MobileDashboardView />
                    </div>
                </DragDropProvider>
            </ArtboardProvider>
        </>
    );
}




