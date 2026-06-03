import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarLayout } from './SidebarLayout';
import { TopbarLayout } from './TopbarLayout';

export function AppLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground flex">
      <SidebarLayout
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopbarLayout onMobileMenuClick={() => setIsMobileSidebarOpen(true)} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background-secondary p-4 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {/* The routed content will render here */}
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
