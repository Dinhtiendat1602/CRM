import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAF5EC] via-[#EAF5EC] to-[#DDF0E2] flex font-sans text-[#1F2937]">
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header onToggleMobileSidebar={() => setMobileOpen(!mobileOpen)} />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white/80 backdrop-blur-xs border-t border-[#DDF0E2] py-3 px-6 text-center text-xs text-[#6B7280]">
          Zen CRM Enterprise Platform &bull; Tuân thủ tuyệt đối SRS v1.1 &bull; 2026
        </footer>
      </div>
    </div>
  );
}
