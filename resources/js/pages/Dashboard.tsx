import { Head } from '@inertiajs/react';
import ComponentSidebar from '@/components/ComponentSidebar';
import ArtboardCanvas from '@/components/artboard/ArtboardCanvas';
import MobileDashboardView from '@/components/mobile/MobileDashboardView';
import { ArtboardProvider } from '@/context/ArtboardContext';
import type { DashboardLayout } from '@/types/dashboard';

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
  const initialData = currentDashboard ? {
    dashboardId: currentDashboard.id,
    dashboardName: currentDashboard.name,
    artboards: currentDashboard.artboards ?? [],
    archivedWidgets: currentDashboard.archivedWidgets ?? [],
  } : undefined;

  return (
    <>
      <Head title="Dashboard Builder" />
      <ArtboardProvider initialData={initialData}>
        {/* Desktop View */}
        <div className="hidden md:flex h-screen overflow-hidden bg-background">
          <ComponentSidebar savedDashboards={savedDashboards} currentDashboardId={currentDashboard?.id} />
          <ArtboardCanvas />
        </div>

        {/* Mobile View */}
        <div className="md:hidden flex h-screen overflow-hidden bg-background">
          <MobileDashboardView />
        </div>
      </ArtboardProvider>
    </>
  );
}
