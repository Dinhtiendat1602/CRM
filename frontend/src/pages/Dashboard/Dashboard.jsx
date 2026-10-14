import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Package,
} from 'lucide-react';
import { useAuth } from '../../context/authContextDef';
import axiosClient from '../../api/axiosClient';

export default function Dashboard() {
  const { user, role } = useAuth();
  const currentRole = (role || user?.role_name || user?.role || '').trim().toUpperCase();

  const [stats] = useState({
    leadsCount: 2,
    oppsCount: 1,
    ordersCount: 0,
    planCompletion: '78.5%',
    winRate: '65.0%',
  });

  const [apiConnected, setApiConnected] = useState(false);

  useEffect(() => {
    // Kiểm tra kết nối API qua axiosClient
    axiosClient
      .get('/health')
      .then(() => setApiConnected(true))
      .catch(() => setApiConnected(false));
  }, []);

  // Cấu hình KPI riêng biệt theo đúng thẩm quyền nghiệp vụ từng vai trò (SRS 2.1)
  const getRoleKPIs = () => {
    if (currentRole === 'ADMIN') {
      return [
        {
          label: 'Tổng Tài Khoản Nhân Viên',
          value: 3,
          change: 'Hệ thống đang hoạt động',
          icon: Users,
          color: 'from-purple-600 to-indigo-600',
        },
        {
          label: 'Tài Khoản Đang Kích Hoạt',
          value: 3,
          change: '100% tài khoản active',
          icon: ShieldCheck,
          color: 'from-emerald-500 to-teal-600',
        },
        {
          label: 'Tài Khoản Bị Khóa',
          value: 0,
          change: 'Không có tài khoản bị khóa',
          icon: Activity,
          color: 'from-rose-500 to-pink-600',
        },
        {
          label: 'Cấu Trúc Phân Quyền (RBAC)',
          value: '3 Vai trò',
          change: 'ADMIN, MANAGER, SALESMAN',
          icon: DollarSign,
          color: 'from-blue-600 to-cyan-600',
        },
      ];
    }

    if (currentRole === 'SALE_MANAGER') {
      return [
        {
          label: 'Danh Mục Sản Phẩm Kho',
          value: 3,
          change: 'Điện tử, Phần mềm, Máy ảnh',
          icon: Package,
          color: 'from-indigo-600 to-blue-600',
        },
        {
          label: 'Sản Phẩm Đang Kinh Doanh',
          value: 11,
          change: 'Đầy đủ tồn kho & đơn giá',
          icon: ShoppingCart,
          color: 'from-blue-600 to-cyan-600',
        },
        {
          label: 'Chiến Dịch Tiếp Thị Q4',
          value: 1,
          change: 'Đang triển khai thu Lead',
          icon: TrendingUp,
          color: 'from-amber-500 to-orange-600',
        },
        {
          label: 'Chỉ Tiêu Doanh Số 2026',
          value: stats.planCompletion,
          change: 'Kế hoạch 12 tháng (Forecast)',
          icon: DollarSign,
          color: 'from-purple-600 to-pink-600',
        },
      ];
    }

    // Mặc định vai trò SALESMAN
    return [
      {
        label: 'Khách Tiềm Năng (Leads)',
        value: stats.leadsCount,
        change: '+12% so với tháng trước',
        icon: Users,
        color: 'from-blue-600 to-indigo-600',
      },
      {
        label: 'Cơ Hội Đang Chăm Sóc',
        value: stats.oppsCount,
        change: '1 Deal đang thương thảo',
        icon: TrendingUp,
        color: 'from-amber-500 to-orange-600',
      },
      {
        label: 'Đơn Hàng Hoàn Tất',
        value: stats.ordersCount,
        change: 'Chờ chốt đơn mới',
        icon: ShoppingCart,
        color: 'from-emerald-500 to-teal-600',
      },
      {
        label: 'Tỷ Lệ Chốt Deal Cá Nhân',
        value: stats.winRate,
        change: 'Hiệu quả tư vấn bán hàng',
        icon: DollarSign,
        color: 'from-purple-600 to-pink-600',
      },
    ];
  };

  const kpis = getRoleKPIs();

  // Định nghĩa các lối tắt phân quyền riêng biệt (Role nào không quản lý thì tuyệt đối ẩn)
  const quickActions = [
    {
      title: 'Khách tiềm năng',
      desc: 'Thêm và theo dõi khách hàng mới (SRS 3.1 - 3.5)',
      path: '/leads',
      roles: ['SALESMAN'],
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      title: 'Cơ hội bán hàng',
      desc: 'Tạo cơ hội và nhật ký Follow-up (SRS 3.6 - 3.11)',
      path: '/opportunities',
      roles: ['SALESMAN'],
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      title: 'Đơn hàng (Orders)',
      desc: 'Xem hóa đơn bán hàng đã chốt (SRS 3.12)',
      path: '/orders',
      roles: ['SALESMAN'],
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Quản lý Sản phẩm',
      desc: 'Quản trị kho hàng, đơn giá & xem opp theo SP (SRS 3.15 - 3.17)',
      path: '/products',
      roles: ['SALE_MANAGER'],
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      title: 'Chiến dịch Tiếp thị',
      desc: 'Lập kế hoạch & đo lường hiệu quả ROI (SRS 3.18 - 3.19)',
      path: '/campaigns',
      roles: ['SALE_MANAGER'],
      color: 'text-pink-600 bg-pink-50 border-pink-200',
    },
    {
      title: 'Kế hoạch Doanh số',
      desc: 'Chỉ tiêu 12 tháng & Báo cáo đối soát (SRS 3.20 - 3.21)',
      path: '/forecast/setup',
      roles: ['SALE_MANAGER'],
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    },
    {
      title: 'Báo cáo Tổng hợp',
      desc: 'Thống kê Lead, Đơn & Doanh số theo SP/thời gian (SRS 2.1)',
      path: '/reports',
      roles: ['SALE_MANAGER'],
      color: 'text-violet-600 bg-violet-50 border-violet-200',
    },
    {
      title: 'Quản trị Người dùng',
      desc: 'Xem danh sách, phân vai trò & đặt lại mật khẩu (SRS 2.1)',
      path: '/admin/users',
      roles: ['ADMIN'],
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
  ];

  const allowedActions = quickActions.filter((action) =>
    action.roles.includes(currentRole)
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold backdrop-blur-xs border border-blue-400/20">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Khung giao diện Admin UI & RBAC sẵn sàng
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xin chào, {user?.full_name || user?.username || 'Thành viên Zen CRM'}!
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed">
            Hệ thống đang hoạt động với vai trò{' '}
            <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">
              {currentRole === 'ADMIN'
                ? 'Quản trị viên (ADMIN)'
                : currentRole === 'SALE_MANAGER'
                ? 'Quản lý bán hàng (SALE_MANAGER)'
                : 'Nhân viên bán hàng (SALESMAN)'}
            </span>
            .{' '}
            {currentRole === 'ADMIN' &&
              'Theo đặc tả SRS 2.1, bạn chịu trách nhiệm quản lý tài khoản người dùng, đặt lại mật khẩu, kích hoạt/khóa và gán vai trò nhân viên trong hệ thống.'}
            {currentRole === 'SALE_MANAGER' &&
              'Theo đặc tả SRS 2.1, bạn chịu trách nhiệm thiết lập sản phẩm kho, chiến dịch tiếp thị, kế hoạch doanh số 12 tháng và theo dõi báo cáo thống kê.'}
            {currentRole === 'SALESMAN' &&
              'Theo đặc tả SRS 2.1, bạn trực tiếp quản lý khách hàng tiềm năng (Leads), theo dõi cơ hội bán hàng (Opportunities), ghi nhật ký chăm sóc và chốt đơn hàng (Orders).'}
          </p>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/20 to-transparent pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{kpi.label}</span>
                <div
                  className={`h-9 w-9 rounded-xl bg-gradient-to-tr ${kpi.color} flex items-center justify-center text-white shadow-xs`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{kpi.change}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Role-Based Quick Actions (RBAC Visibility) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-base">
                Chức năng Nghiệp vụ Được Phép Quản Lý
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hiển thị tự động theo thẩm quyền của vai trò{' '}
              <strong className="text-indigo-600 font-semibold">{currentRole}</strong> (Chức năng không thuộc thẩm quyền được ẩn tuyệt đối theo quy tắc RBAC).
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 self-start sm:self-auto">
            {allowedActions.length} phân hệ khả dụng
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {allowedActions.map((action, idx) => (
            <Link
              key={idx}
              to={action.path}
              className="group p-4 rounded-xl border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between bg-slate-50/50 hover:bg-white"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors text-sm">
                    {action.title}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {action.desc}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Truy cập ngay
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${action.color}`}>
                  {action.roles.includes('ADMIN')
                    ? 'Chỉ Admin'
                    : action.roles.includes('SALE_MANAGER')
                    ? 'Chỉ Manager'
                    : 'Chỉ Salesman'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Connectivity & Architecture Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Hệ thống Trạng thái Kỹ thuật</h3>
              <p className="text-xs text-slate-500">
                Axios Interceptor tự động gắn Bearer Token & Timeout 30 phút (SRS 5.3)
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              apiConnected
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                apiConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            {apiConnected ? 'Backend:8888 Đang kết nối' : 'Đang kiểm tra API...'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-medium">Bảo mật Phiên</span>
            <span className="font-bold text-slate-800 mt-1 block">
              30 Phút Tự động Đăng xuất (SRS 5.3)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-medium">Cảnh báo Đếm ngược</span>
            <span className="font-bold text-slate-800 mt-1 block">
              Modal Cảnh báo 2 Phút Cuối (Pop-up)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 block font-medium">Phân quyền Giao diện</span>
            <span className="font-bold text-slate-800 mt-1 block">
              Dynamic Sidebar & RoleRoute Guard
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
