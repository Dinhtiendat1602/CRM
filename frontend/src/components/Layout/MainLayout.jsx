import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#EBF5ED] flex p-2.5 sm:p-4 lg:p-6 font-sans text-[#1F2937]">
      <div className="w-full max-w-[1700px] mx-auto flex flex-col lg:flex-row gap-2 lg:gap-5 flex-1 min-w-0">
        {/* Sidebar Navigation */}
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Main Content Area: Large White Card */}
        <div className="flex-1 flex flex-col min-w-0 bg-white rounded-3xl lg:rounded-[28px] shadow-xs border border-white/80 overflow-hidden">
          {/* Top Header */}
          <Header onToggleMobileSidebar={() => setMobileOpen(!mobileOpen)} />

          {/* Dynamic Page Content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="w-full">
              <Outlet />
            </div>
          </main>

          {/* Minimalist Footer */}
          <footer className="border-t border-gray-100 py-3 px-6 text-center text-xs text-[#9CA3AF]">
            Zen CRM Enterprise &bull; Tuân thủ chuẩn SRS v1.1
          </footer>
        </div>
      </div>
    </div>
  );
}
