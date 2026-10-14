import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  LogOut,
  User,
  Shield,
  ChevronDown,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/authContextDef';

// Ánh xạ breadcrumb / tiêu đề theo đường dẫn
const ROUTE_TITLES = {
  '/dashboard': 'Dashboard Tổng quan',
  '/leads': 'Quản lý Khách hàng Tiềm năng (Leads)',
  '/opportunities': 'Quản lý Cơ hội & Nhật ký Chăm sóc',
  '/orders': 'Quản lý Đơn hàng (Orders)',
  '/products': 'Quản lý Sản phẩm & Tồn kho',
  '/campaigns': 'Chiến dịch Tiếp thị & Báo cáo',
  '/forecast/setup': 'Lập Kế hoạch Doanh số 12 Tháng',
  '/forecast/performance': 'Đối soát Kế hoạch vs Thực tế',
  '/reports': 'Báo cáo Thống kê Tổng hợp',
  '/admin/users': 'Quản trị Người dùng & Phân quyền',
  '/profile': 'Thông tin Tài khoản Cá nhân',
};

export default function Header({ onToggleMobileSidebar }) {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentRole = role || user?.role_name || user?.role || 'User';
  const pageTitle = ROUTE_TITLES[location.pathname] || 'Phân hệ Làm việc';

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Màu sắc Badge vai trò
  const getRoleBadge = (r) => {
    switch (r) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SALE_MANAGER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SALESMAN':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const userInitial = (user?.full_name || user?.username || 'U')
    .charAt(0)
    .toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile Toggle & Page Title / Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          aria-label="Mở Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Zen CRM</span>
            <span>/</span>
            <span className="text-slate-700 font-medium">{pageTitle}</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
            {pageTitle}
          </h2>
        </div>
      </div>

      {/* Right: Security Indicator & User Profile Dropdown */}
      <div className="flex items-center gap-3">
        {/* Security / Session Timeout indicator badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
          <Clock className="h-3.5 w-3.5 text-blue-600" />
          <span>Phiên 30m an toàn</span>
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              {userInitial}
            </div>

            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                {user?.full_name || user?.username || 'Người dùng'}
              </span>
              <span
                className={`inline-block px-1.5 py-0.2 text-[10px] font-semibold rounded border ${getRoleBadge(
                  currentRole
                )}`}
              >
                {currentRole}
              </span>
            </div>

            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs text-slate-500">Tài khoản đăng nhập</p>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md border ${getRoleBadge(
                      currentRole
                    )}`}
                  >
                    <Shield className="h-3 w-3" />
                    {currentRole}
                  </span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Hồ sơ & Đổi mật khẩu</span>
                </Link>

                <a
                  href="/api/health"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <Shield className="h-4 w-4" />
                    <span>API Health Check</span>
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </a>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
