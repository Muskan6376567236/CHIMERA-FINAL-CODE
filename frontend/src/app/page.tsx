'use client';
import { useStore } from '@/lib/store';
import Sidebar from '@/components/Sidebar';
import OverviewTab from '@/components/tabs/OverviewTab';
import RevenueTab from '@/components/tabs/RevenueTab';
import ProductsTab from '@/components/tabs/ProductsTab';
import CustomersTab from '@/components/tabs/CustomersTab';
import ReturnsTab from '@/components/tabs/ReturnsTab';
import RelationshipsTab from '@/components/tabs/RelationshipsTab';
import ChatTab from '@/components/tabs/ChatTab';
import ExplorerTab from '@/components/tabs/ExplorerTab';
import PipelineLauncher from '@/components/PipelineLauncher';
import UploadTab from '@/components/tabs/UploadTab';

const TABS: Record<string, React.ComponentType> = {
  upload: UploadTab,
  overview: OverviewTab,
  revenue: RevenueTab,
  products: ProductsTab,
  customers: CustomersTab,
  returns: ReturnsTab,
  relationships: RelationshipsTab,
  chat: ChatTab,
  explorer: ExplorerTab,
  pipeline: PipelineLauncher,
  
};

export default function Home() {
  const { activeTab } = useStore();
  const TabComponent = TABS[activeTab] || OverviewTab;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f' }}>
      <Sidebar />
      <main style={{
        marginLeft: 220,
        flex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100vh',
      }}>
        <TabComponent />
      </main>
    </div>
  );
}
