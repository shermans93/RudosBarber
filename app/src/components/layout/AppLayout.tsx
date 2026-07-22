import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { LowStockModal } from './LowStockModal';
import { InactivityWarningModal } from './InactivityWarningModal';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';

export function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { warningVisible, secondsLeft, continueSession } = useInactivityLogout();

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
      {warningVisible && (
        <InactivityWarningModal secondsLeft={secondsLeft} onContinue={continueSession} />
      )}
    </div>
  );
}
