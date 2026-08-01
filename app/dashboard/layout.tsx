import Sidebar from '@/components/layout/Sidebar';
import MobileDock from '@/components/layout/MobileDock';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-layout-container min-h-screen bg-bg-primary">
      <Sidebar />
      <div className="hf-dash-main">
        {children}
      </div>
      <MobileDock />
    </div>
  );
}

