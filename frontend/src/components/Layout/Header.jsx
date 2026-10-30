import { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Menu,
  LogOut,
  User,
  Shield,
  ShieldCheck,
  ChevronDown,
  Clock,
  Calendar,
  Globe,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/authContextDef';
import { useLanguage } from '../../context/LanguageContext';

// Tiêu đề thuần Tiếng Việt cho từng phân hệ (Không kèm tiếng Anh trong ngoặc)
const ROUTE_TITLES_VI = {
  '/dashboard': 'Bảng điều khiển Tổng quan',
  '/leads': 'Quản lý Khách hàng Tiềm năng',
  '/opportunities': 'Quản lý Cơ hội & Nhật ký Chăm sóc',
  '/orders': 'Quản lý Đơn hàng',
  '/products': 'Quản lý Sản phẩm & Tồn kho',
  '/campaigns': 'Chiến dịch Tiếp thị & Báo cáo',
  '/forecast/setup': 'Lập Kế hoạch Doanh số 12 Tháng',
  '/forecast/performance': 'Đối soát Kế hoạch vs Thực tế',
  '/reports': 'Báo cáo Thống kê Tổng hợp',
  '/admin/users': 'Quản trị Người dùng & Phân quyền',
  '/profile': 'Thông tin Tài khoản Cá nhân',
};

// Tiêu đề chuẩn Tiếng Anh khi chuyển đổi ngôn ngữ
const ROUTE_TITLES_EN = {
  '/dashboard': 'Dashboard Overview',
  '/leads': 'Leads Management',
  '/opportunities': 'Opportunities & Follow-up Log',
  '/orders': 'Orders Management',
  '/products': 'Products & Inventory',
  '/campaigns': 'Marketing Campaigns & Reports',
  '/forecast/setup': '12-Month Sales Forecasting',
  '/forecast/performance': 'Forecast vs Actual Performance',
  '/reports': 'Consolidated Analytics Reports',
  '/admin/users': 'User Management & Permissions',
  '/profile': 'Personal Account Profile',
};

export default function Header({ onToggleMobileSidebar }) {
  const { 
    user, 
    role, 
    logout,
    formattedSessionTime,
    sessionRemainingSeconds,
    resetSessionTimer,
    setDemoTimeout,
  } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [sessionOpen, setSessionOpen] = useState(false);
  const sessionDropdownRef = useRef(null);

  const [currentDateTime, setCurrentDateTime] = useState('');

  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
  };

  // Đồng hồ thời gian thực cập nhật từng giây theo locale ngôn ngữ được chọn
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const locale = language === 'en' ? 'en-US' : 'vi-VN';
      const dateStr = now.toLocaleDateString(locale, {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const timeStr = now.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setCurrentDateTime(`${dateStr} • ${timeStr}`);
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, [language]);

  const currentRole = role || user?.role_name || user?.role || 'User';
  const routeTitles = language === 'en' ? ROUTE_TITLES_EN : ROUTE_TITLES_VI;
  const pageTitle = routeTitles[location.pathname] || (language === 'en' ? 'Workspace' : 'Phân hệ Làm việc');

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (sessionDropdownRef.current && !sessionDropdownRef.current.contains(e.target)) {
        setSessionOpen(false);
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
    <header className="h-16 bg-white border-b border-gray-100 sticky top-0 z-30 flex items-center justify-between px-6 sm:px-8">
      {/* Left: Mobile Toggle & Page Title (Duy nhất 1 dòng to thuần Tiếng Việt) */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F3F4F6] cursor-pointer"
          aria-label={language === 'en' ? 'Open Menu' : 'Mở Menu'}
        >
          <Menu className="h-5 w-5" />
        </button>

        <h2 className="text-base sm:text-lg font-bold text-[#1F2937] leading-tight">
          {pageTitle}
        </h2>
      </div>

      {/* Right: Security Indicator & Live Clock & User Profile Dropdown */}
      <div className="flex items-center gap-3">
        {/* Đồng hồ Ngày Giờ thực tế hiển thị trên toàn bộ các trang */}
        {currentDateTime && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#F9FAFB] text-[#4B5563] border border-gray-200/60 shadow-2xs">
            <Calendar className="h-3.5 w-3.5 text-[#3CB371] shrink-0" />
            <span className="font-mono">{currentDateTime}</span>
          </div>
        )}

        {/* Security / Session Timeout indicator badge with live countdown & interactive menu */}
        <div className="relative" ref={sessionDropdownRef}>
          <button
            type="button"
            onClick={() => setSessionOpen(!sessionOpen)}
            title={
              language === 'en'
                ? 'Session automatically counts down 30 minutes of inactivity. Click to view or renew.'
                : 'Phiên làm việc tự động đếm ngược 30 phút bất hoạt. Bấm để xem chi tiết hoặc gia hạn.'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium border transition-all cursor-pointer ${
              sessionRemainingSeconds && sessionRemainingSeconds <= 120
                ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse font-bold'
                : sessionRemainingSeconds && sessionRemainingSeconds <= 300
                ? 'bg-amber-50 text-amber-700 border-amber-300 font-semibold'
                : 'bg-[#EAF5EC] text-[#2E7D32] border-[#DDF0E2] hover:bg-[#DDF0E2]'
            }`}
          >
            <Clock className={`h-3.5 w-3.5 ${
              sessionRemainingSeconds && sessionRemainingSeconds <= 120
                ? 'text-rose-600 animate-spin'
                : sessionRemainingSeconds && sessionRemainingSeconds <= 300
                ? 'text-amber-600'
                : 'text-[#3CB371]'
            }`} />
            <span className="font-mono">
              {language === 'en' ? 'Session' : 'Phiên'}: {formattedSessionTime || '30:00'}
            </span>
          </button>

          {/* Session Dropdown Popover */}
          {sessionOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-[#DDF0E2] p-4 z-50 animate-fade-in text-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#DDF0E2]">
                <ShieldCheck className="w-4 h-4 text-[#3CB371]" />
                <span className="font-bold text-[#1F2937]">
                  {language === 'en' ? 'Session Security' : 'Bảo Mật Phiên Làm Việc'}
                </span>
              </div>

              <div className="bg-[#F3F4F6] p-2.5 rounded-xl border border-[#DDF0E2] space-y-1">
                <div className="flex justify-between items-center text-[#6B7280]">
                  <span>{language === 'en' ? 'Remaining time:' : 'Thời gian còn lại:'}</span>
                  <strong className={`font-mono text-sm ${
                    sessionRemainingSeconds && sessionRemainingSeconds <= 120
                      ? 'text-rose-600 font-bold'
                      : 'text-[#2E7D32]'
                  }`}>
                    {formattedSessionTime || '30:00'}
                  </strong>
                </div>
                <div className="flex justify-between text-[#6B7280] text-[11px]">
                  <span>{language === 'en' ? 'Session duration:' : 'Hạn định phiên:'}</span>
                  <span>{language === 'en' ? '30m inactivity' : '30 phút bất hoạt'}</span>
                </div>
              </div>

              <p className="text-[11px] text-[#6B7280] leading-relaxed">
                {language === 'en'
                  ? 'System automatically extends session on mouse move or keypress. If inactive for 30 minutes, it logs out to secure data.'
                  : 'Hệ thống tự động gia hạn khi bạn di chuột hoặc gõ phím. Nếu không thao tác trong 30 phút, hệ thống sẽ tự động đăng xuất để bảo đảm an toàn dữ liệu.'}
              </p>

              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    resetSessionTimer();
                    setSessionOpen(false);
                  }}
                  className="w-full py-2 px-3 bg-[#3CB371] hover:bg-[#38A169] text-white rounded-xl font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> {language === 'en' ? 'Extend session (30:00)' : 'Gia hạn phiên (30:00)'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDemoTimeout(10000);
                    setSessionOpen(false);
                  }}
                  className="w-full py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-[11px]"
                  title={language === 'en' ? 'Test auto-logout after 10s' : 'Thử nghiệm auto-logout sau 10 giây'}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" /> {language === 'en' ? 'Test Auto-Logout (10s)' : 'Thử nghiệm Auto-Logout (10s)'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[#EAF5EC] transition-colors cursor-pointer"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#3CB371] to-[#2E7D32] flex items-center justify-center text-white font-bold text-sm shadow-xs">
              {userInitial}
            </div>

            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-[#1F2937] truncate max-w-[120px]">
                {user?.full_name || user?.username || (language === 'en' ? 'User' : 'Người dùng')}
              </span>
              <span
                className={`inline-block px-1.5 py-0.2 text-[10px] font-semibold rounded border ${getRoleBadge(
                  currentRole
                )}`}
              >
                {currentRole}
              </span>
            </div>

            <ChevronDown className="h-4 w-4 text-[#6B7280]" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-[#DDF0E2] py-2 z-50 animate-fade-in">
              {/* Header thông tin tài khoản */}
              <div className="px-4 py-2.5 border-b border-[#DDF0E2]">
                <p className="text-xs text-[#6B7280]">
                  {language === 'en' ? 'Signed in account' : 'Tài khoản đăng nhập'}
                </p>
                <p className="text-sm font-bold text-[#1F2937] truncate">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-xs text-[#6B7280] truncate">{user?.email}</p>
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

              {/* Các thao tác chính */}
              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#1F2937] hover:bg-[#EAF5EC] hover:text-[#2E7D32] transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>{language === 'en' ? 'Profile & Security' : 'Hồ sơ & Đổi mật khẩu'}</span>
                </Link>

                {/* Thay thế API Health Check bằng Chuyển đổi ngôn ngữ Tiếng Anh / Tiếng Việt */}
                <div className="px-4 py-2 border-t border-gray-100/80">
                  <div className="flex items-center justify-between mb-1.5 text-xs text-[#4B5563]">
                    <span className="flex items-center gap-2 font-medium">
                      <Globe className="h-4 w-4 text-[#3CB371]" />
                      <span>{language === 'en' ? 'Language' : 'Ngôn ngữ'}</span>
                    </span>
                    <span className="text-[10px] font-bold text-[#2E7D32] bg-[#EAF5EC] px-1.5 py-0.5 rounded border border-[#DDF0E2]">
                      {language === 'en' ? 'English' : 'Tiếng Việt'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F9FAFB] rounded-xl border border-gray-200/80">
                    <button
                      type="button"
                      onClick={() => handleLanguageChange('vi')}
                      className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        language === 'vi'
                          ? 'bg-white text-[#2E7D32] shadow-2xs border border-[#DDF0E2]'
                          : 'text-[#6B7280] hover:text-[#1F2937]'
                      }`}
                    >
                      <span className="text-xs">🇻🇳</span>
                      <span>Tiếng Việt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLanguageChange('en')}
                      className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        language === 'en'
                          ? 'bg-white text-[#2E7D32] shadow-2xs border border-[#DDF0E2]'
                          : 'text-[#6B7280] hover:text-[#1F2937]'
                      }`}
                    >
                      <span className="text-xs">🇬🇧</span>
                      <span>English</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Đăng xuất */}
              <div className="pt-1 border-t border-[#DDF0E2]">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{language === 'en' ? 'Sign out' : 'Đăng xuất'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
