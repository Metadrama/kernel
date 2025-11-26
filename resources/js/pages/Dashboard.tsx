import { Head } from '@inertiajs/react';
import ComponentSidebar from '@/components/ComponentSidebar';
import DashboardCanvas from '@/components/DashboardCanvas';

export default function Dashboard() {
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
