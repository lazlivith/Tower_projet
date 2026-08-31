import { ReactNode, useState } from 'react';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar Modulaire */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative">
        {/* Header Modulaire */}
        <Header />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto relative">
          <div className="absolute inset-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
