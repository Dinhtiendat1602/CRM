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
        className={`fixed top-0 bottom-0 left-0 z-50 h-screen flex flex-col justify-between py-5 px-3 transition-all duration-300 ease-in-out lg:static lg:h-auto lg:shrink-0 ${
          collapsed ? 'w-20' : 'w-60 xl:w-64'
        } ${mobileOpen ? 'translate-x-0 bg-[#EBF5ED] shadow-xl' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col space-y-6">
          {/* Brand Logo & Header */}
          <div className="flex items-center justify-between px-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-[#3CB371] flex items-center justify-center text-white shadow-xs font-bold text-lg">
                Z
              </div>
              {!collapsed && (
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl font-extrabold text-[#1F2937] tracking-tight">
                    zen
                  </span>
                  <span className="text-xl font-extrabold text-[#3CB371]">crm.</span>
                </div>
              )}
            </div>

            {/* Close button for mobile */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-[#6B7280] hover:text-[#1F2937] hover:bg-white/60 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {!collapsed && (
              <div className="px-3 pb-1 text-[11px] font-semibold text-[#9CA3AF] tracking-wide">
                My Panel
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
                    `group relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
                      isActive
                        ? 'bg-white text-[#1F2937] shadow-xs font-semibold border border-white/80'
                        : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-white/50 font-medium'
                    }`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`h-5 w-5 shrink-0 transition-colors ${
                          isActive ? 'text-[#3CB371]' : 'text-[#6B7280] group-hover:text-[#1F2937]'
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
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
          <div className="px-2">
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/50 transition-all cursor-pointer">
              <div className="h-9 w-9 shrink-0 rounded-full bg-[#3CB371] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                {userInitials}
              </div>
              {!collapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-[#1F2937] truncate">
                    {user?.full_name || user?.username || 'Thành viên'}
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
                  <span>Thu gọn</span>
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
