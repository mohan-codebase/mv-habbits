import Sidebar from '@/components/layout/Sidebar';
import MobileDock from '@/components/layout/MobileDock';
import DailyQuoteModal from '@/components/quotes/DailyQuoteModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-layout-container min-h-screen bg-bg-primary">
      <Sidebar />
      <div className="hf-dash-main pb-32 lg:pb-8 min-h-screen">
        {children}
      </div>
      <MobileDock />
      <DailyQuoteModal />
    </div>
  );
}


