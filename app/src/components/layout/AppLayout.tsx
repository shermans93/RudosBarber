import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { LowStockModal } from './LowStockModal';

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-wrap">
      <Sidebar />
      <main className="flex-1 min-w-[320px] bg-bg">
        <Header />
        <div className="p-8 max-w-[1120px] animate-fade-in">
          <Outlet />
        </div>
      </main>
      <LowStockModal />
    </div>
  );
}
