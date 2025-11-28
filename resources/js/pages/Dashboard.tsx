import { Head } from '@inertiajs/react';
import ComponentSidebar from '@/components/ComponentSidebar';
import ArtboardCanvas from '@/components/ArtboardCanvas';
import type { DashboardLayout } from '@/types/dashboard';
import { useEffect } from 'react';
import { router } from '@inertiajs/react';

interface DashboardProps {
  dashboards: DashboardLayout[];
  currentDashboard: DashboardLayout | null;
}

export default function Dashboard(props: DashboardProps) {
  // Provide a simple save hook via window for now
  useEffect(() => {
    (window as any).saveDashboardLayout = (layout: DashboardLayout) => {
      router.post('/dashboard/save', layout, {
        preserveScroll: true,
      });
    };
  }, []);
  return (
    <>
      <Head title="Dashboard Builder" />
      <div className="flex h-screen overflow-hidden bg-background">
        <ComponentSidebar />
        <ArtboardCanvas />
      </div>
    </>
  );
}
