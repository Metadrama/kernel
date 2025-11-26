import { Head } from '@inertiajs/react';
import ComponentSidebar from '@/components/ComponentSidebar';
import DashboardCanvas from '@/components/DashboardCanvas';
import type { DashboardLayout } from '@/types/dashboard';

interface DashboardProps {
  dashboards: DashboardLayout[];
  currentDashboard: DashboardLayout | null;
}

export default function Dashboard(_props: DashboardProps) {
  return (
    <>
      <Head title="Dashboard Builder" />
      <div className="flex h-screen overflow-hidden bg-background">
        <ComponentSidebar />
        <DashboardCanvas />
      </div>
    </>
  );
}
