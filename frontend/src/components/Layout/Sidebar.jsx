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
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    roles: ['SALESMAN', 'SALE_MANAGER', 'ADMIN'],
  },
  {
    label: 'Leads',
    icon: Users,
    path: '/leads',
    roles: ['SALESMAN', 'SALE_MANAGER'],
  },
  {
    label: 'Opportunities',
    icon: TrendingUp,
    path: '/opportunities',
    roles: ['SALESMAN', 'SALE_MANAGER'],
  },
  {
    label: 'Orders',
    icon: ShoppingCart,
    path: '/orders',
    roles: ['SALESMAN', 'SALE_MANAGER'],
  },
  {
    label: 'Products',
    icon: Package,
    path: '/products',
    roles: ['SALE_MANAGER'],
  },
  {
    label: 'Campaigns',
    icon: Megaphone,
    path: '/campaigns',
    roles: ['SALE_MANAGER'],
  },
  {
    label: 'Forecast',
    icon: BarChart2,
    path: '/forecast/setup',
    roles: ['SALE_MANAGER'],
  },
  {
    label: 'Reports',
    icon: FileText,
    path: '/reports',
    roles: ['SALE_MANAGER'],
  },
  {
    label: 'User Mgmt',
    icon: UserCog,
    path: '/admin/users',
    roles: ['ADMIN'],
  },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { user, role } = useAuth();
  const currentRole = (role || user?.role_name || user?.role || '').trim().toUpperCase();

  // Lọc danh sách menu theo quyền hạn vai trò (RBAC)
  const accessibleItems = MENU_ITEMS.filter((item) =>
    item.roles.includes(currentRole)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 h-screen flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:shrink-0 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Logo & Header */}
        <div className="shrink-0 h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-tr from-[#3CB371] via-[#2E7D32] to-[#7CA5F5] flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-bold text-xl">
              Z
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-base font-bold text-white tracking-tight leading-tight">
                  Zen CRM
                </span>
                <span className="text-[10px] uppercase font-semibold text-[#3CB371] tracking-wider">
                  Enterprise v1.1
                </span>
              </div>
            )}
          </div>

          {/* Close button for mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {!collapsed && (
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#6B7280]">
              Phân hệ làm việc
            </div>
          )}

          {accessibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-[#3CB371] text-white shadow-md shadow-[#3CB371]/30 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0 transition-transform group-hover:scale-105" />
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {/* Active indicator bar */}
                {({ isActive }) =>
                  isActive && !collapsed && (
                    <span className="ml-auto w-1.5 h-4 rounded-full bg-[#DDF0E2]" />
                  )
                }
              </NavLink>
            );
          })}
        </nav>

        {/* Desktop Collapse Toggle Button */}
        <div className="shrink-0 hidden lg:flex items-center justify-between p-3 border-t border-slate-800 text-slate-400">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors text-xs font-medium cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Thu gọn menu</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
