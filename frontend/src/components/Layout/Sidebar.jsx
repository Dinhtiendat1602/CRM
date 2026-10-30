import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  ShoppingCart,
  Package,
  Megaphone,
  BarChart2,
  FileText,
  UserCog,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/authContextDef';

const MENU_ITEMS = [
  {
    labelVi: 'Tổng quan',
    labelEn: 'Dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    roles: ['SALESMAN', 'SALE_MANAGER', 'ADMIN'],
  },
  {
    labelVi: 'Khách hàng',
    labelEn: 'Leads',
    label: 'Leads',
    icon: Users,
    path: '/leads',
    roles: ['SALESMAN', 'SALE_MANAGER'],
  },
  {
    labelVi: 'Cơ hội bán hàng',
    labelEn: 'Opportunities',
    label: 'Opportunities',
    icon: TrendingUp,
    path: '/opportunities',
    roles: ['SALESMAN', 'SALE_MANAGER'],
  },
  {
    labelVi: 'Đơn hàng',
    labelEn: 'Orders',
    label: 'Orders',
    icon: ShoppingCart,
    path: '/orders',
    roles: ['SALESMAN', 'SALE_MANAGER'],
  },
  {
    labelVi: 'Sản phẩm',
    labelEn: 'Products',
    label: 'Products',
    icon: Package,
    path: '/products',
    roles: ['SALE_MANAGER'],
  },
  {
    labelVi: 'Chiến dịch',
    labelEn: 'Campaigns',
    label: 'Campaigns',
    icon: Megaphone,
    path: '/campaigns',
    roles: ['SALE_MANAGER'],
  },
  {
    labelVi: 'Kế hoạch DS',
    labelEn: 'Forecast',
    label: 'Forecast',
    icon: BarChart2,
    path: '/forecast/setup',
    roles: ['SALE_MANAGER'],
  },
  {
    labelVi: 'Báo cáo',
    labelEn: 'Reports',
    label: 'Reports',
    icon: FileText,
    path: '/reports',
    roles: ['SALE_MANAGER'],
  },
  {
    labelVi: 'Quản trị User',
    labelEn: 'User Mgmt',
    label: 'User Mgmt',
    icon: UserCog,
    path: '/admin/users',
    roles: ['ADMIN'],
  },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, role } = useAuth();
  const currentRole = (role || user?.role_name || user?.role || '').trim().toUpperCase();

  // Đồng bộ ngôn ngữ với Header và localStorage
  const [language, setLanguage] = useState(() => localStorage.getItem('app_language') || 'vi');

  useEffect(() => {
    const handleLangSync = (e) => {
      if (e.detail && (e.detail === 'vi' || e.detail === 'en')) {
        setLanguage(e.detail);
      }
    };
    window.addEventListener('app_language_changed', handleLangSync);
    return () => window.removeEventListener('app_language_changed', handleLangSync);
  }, []);

  // Lọc danh sách menu theo quyền hạn vai trò (RBAC)
  const accessibleItems = MENU_ITEMS.filter((item) =>
    item.roles.includes(currentRole)
  );

  const userInitials = (user?.full_name || user?.username || 'U')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 h-screen flex flex-col justify-between py-4 transition-all duration-300 ease-in-out lg:static lg:h-full lg:shrink-0 overflow-y-auto select-none ${
          collapsed ? 'w-20 px-2' : 'w-64 px-3'
        } ${mobileOpen ? 'translate-x-0 bg-[#EBF5ED] shadow-xl' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col space-y-6">
          {/* Brand Logo & Header */}
          <div className={`flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-2.5'}`}>
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} min-w-0`}>
              {/* Modern Vector SVG Logo: Zen CRM Emblem */}
              <div
                className="h-10 w-10 shrink-0 rounded-2xl bg-gradient-to-br from-[#3CB371] to-[#2E7D32] flex items-center justify-center text-white shadow-xs ring-2 ring-white/60 transition-transform hover:scale-105"
                title="Zen CRM Enterprise"
              >
                <svg
                  className="w-5.5 h-5.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4.5 6C4.5 5.17 5.17 4.5 6 4.5H18C18.83 4.5 19.5 5.17 19.5 6C19.5 6.55 19.2 7.05 18.73 7.32L9.2 12.8H18C18.83 12.8 19.5 13.47 19.5 14.3C19.5 15.13 18.83 15.8 18 15.8H6C5.17 15.8 4.5 15.13 4.5 14.3C4.5 13.75 4.8 13.25 5.27 12.98L14.8 7.5H6C5.17 7.5 4.5 6.83 4.5 6Z"
                    fill="currentColor"
                  />
                  <circle cx="18" cy="5.5" r="2" fill="#A7F3D0" />
                </svg>
              </div>

              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-[#1F2937] tracking-tight">ZEN</span>
                    <span className="text-xl font-black text-[#3CB371] tracking-tight">CRM</span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#9CA3AF] -mt-1">
                    Enterprise
                  </span>
                </div>
              )}
            </div>

            {/* Close button for mobile */}
            {!collapsed && (
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="lg:hidden p-1.5 rounded-lg text-[#6B7280] hover:text-[#1F2937] hover:bg-white/60 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {!collapsed && (
              <div className="px-3 pb-1 text-[11px] font-semibold text-[#9CA3AF] tracking-wide">
                {language === 'en' ? 'Main Menu' : 'Danh mục'}
              </div>
            )}

            {accessibleItems.map((item) => {
              const Icon = item.icon;
              const itemLabel = language === 'en' ? item.labelEn : item.labelVi;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                      isActive
                        ? 'bg-white text-[#1F2937] shadow-xs font-semibold border border-white/80'
                        : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-white/50 font-medium'
                    }`
                  }
                  title={collapsed ? itemLabel : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`h-5 w-5 shrink-0 transition-colors ${
                          isActive ? 'text-[#3CB371]' : 'text-[#6B7280] group-hover:text-[#1F2937]'
                        }`}
                      />
                      {!collapsed && <span className="truncate">{itemLabel}</span>}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: User Info & Collapse Toggle */}
        <div className="pt-4 space-y-3">
          {/* User Profile Mini Card */}
          <div className={collapsed ? 'px-0 flex justify-center' : 'px-2'}>
            <div
              className={`flex items-center ${collapsed ? 'justify-center p-1.5' : 'gap-3 p-2'} rounded-xl hover:bg-white/50 transition-all cursor-pointer`}
              title={collapsed ? `${user?.full_name || user?.username} (${currentRole})` : undefined}
            >
              <div className="h-9 w-9 shrink-0 rounded-full bg-[#3CB371] text-white flex items-center justify-center font-bold text-xs shadow-2xs ring-2 ring-white/60">
                {userInitials}
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#1F2937] truncate">
                    {user?.full_name || user?.username || (language === 'en' ? 'Member' : 'Thành viên')}
                  </span>
                  <span className="text-[10px] text-[#9CA3AF] truncate font-medium">
                    {currentRole}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Collapse Toggle Button */}
          <div className="hidden lg:flex items-center justify-center px-2">
            <button
              type="button"
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-[#9CA3AF] hover:text-[#1F2937] hover:bg-white/40 transition-colors text-xs font-medium cursor-pointer"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4" />
                  <span>{language === 'en' ? 'Collapse' : 'Thu gọn'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
