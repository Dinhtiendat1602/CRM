import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useLanguage } from '../../context/LanguageContext';

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="h-screen bg-[#EBF5ED] flex p-2.5 sm:p-3.5 lg:p-4 font-sans text-[#1F2937] overflow-hidden">
      <div className="w-full max-w-[1750px] mx-auto flex flex-col lg:flex-row gap-3 lg:gap-5 h-full min-w-0 overflow-hidden">
        {/* Sidebar Navigation - Fixed & Sticky */}
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        {/* Main Content Area: Large White Card */}
        <div className="flex-1 flex flex-col min-w-0 bg-white rounded-3xl lg:rounded-[28px] shadow-xs border border-white/80 h-full overflow-hidden relative">
          {/* Top Header - Fixed on top of card */}
          <Header onToggleMobileSidebar={() => setMobileOpen(!mobileOpen)} />

          {/* Dynamic Page Content - Only this scrolls */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="w-full">
              <Outlet />
            </div>
          </main>

          {/* Minimalist Footer - Dynamic Bilingual */}
          <footer className="border-t border-gray-100 py-2.5 px-6 text-center text-xs text-[#9CA3AF] shrink-0">
            {t('footer', 'Zen CRM Enterprise • Nền Tảng Quản Trị Khách Hàng Toàn Diện')}
          </footer>
        </div>
      </div>
    </div>
  );
}
