import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { LowStockModal } from './LowStockModal';

export function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <main className="flex-1 min-w-0 bg-bg">
        <Header onMenuClick={() => setMobileNavOpen(true)} />
        <div className="p-4 md:p-8 max-w-[1120px] animate-fade-in">
          <Outlet />
        </div>
      </main>
      <LowStockModal />
    </div>
  );
}
