import ComponentSidebar from '@/components/ComponentSidebar';
import ArtboardCanvas from '@/components/artboard/ArtboardCanvas';
import MobileDashboardView from '@/components/mobile/MobileDashboardView';
import { ArtboardProvider } from '@/context/ArtboardContext';
import { DragDropProvider } from '@/context/DragDropContext';
import type { DashboardLayout } from '@/types/dashboard';
import { Head } from '@inertiajs/react';

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

export default function Dashboard({ savedDashboards, currentDashboard }: DashboardProps) {
    // Prepare initial data from server props
    const initialData = currentDashboard
        ? {
              dashboardId: currentDashboard.id,
              dashboardName: currentDashboard.name,
              artboards: currentDashboard.artboards ?? [],
          }
        : undefined;

    return (
        <>
            <Head title="Dashboard Builder" />
            <ArtboardProvider initialData={initialData}>
                <DragDropProvider>
                    {/* Desktop View */}
                    <div className="hidden h-screen overflow-hidden bg-background md:flex">
                        <ComponentSidebar savedDashboards={savedDashboards} currentDashboardId={currentDashboard?.id} />
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
