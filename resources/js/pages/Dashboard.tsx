import { Head } from '@inertiajs/react';
import { useState } from 'react';
import ComponentSidebar from '@/components/ComponentSidebar';
import DashboardCanvas from '@/components/DashboardCanvas';

interface DashboardProps {
  dashboards: any[];
  currentDashboard: any | null;
}

export default function Dashboard({ dashboards, currentDashboard }: DashboardProps) {
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
