import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  ShieldCheck,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../../context/authContextDef';
import axiosClient from '../../api/axiosClient';

export default function Dashboard() {
  const { user, role } = useAuth();
  const currentRole = role || user?.role_name || user?.role;

  const [stats] = useState({
    leadsCount: 2,
    oppsCount: 1,
    ordersCount: 0,
    planCompletion: '78.5%',
  });

  const [apiConnected, setApiConnected] = useState(false);

  useEffect(() => {
    // Kiểm tra kết nối API qua axiosClient
    axiosClient
      .get('/health')
      .then(() => setApiConnected(true))
      .catch(() => setApiConnected(false));
  }, []);

  const kpis = [
    {
      label: 'Khách tiềm năng (Leads)',
      value: stats.leadsCount,
      change: '+12% so với tháng trước',
      icon: Users,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      label: 'Cơ hội đang chăm sóc',
      value: stats.oppsCount,
      change: '1 Deal đang thương thảo',
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-600',
    },
    {
      label: 'Đơn hàng hoàn tất',
      value: stats.ordersCount,
      change: 'Chờ chốt đơn mới',
      icon: ShoppingCart,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Chỉ tiêu Doanh số 2026',
      value: stats.planCompletion,
      change: 'Tiến độ quý hiện tại',
      icon: DollarSign,
      color: 'from-purple-600 to-pink-600',
    },
  ];

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
            Hệ thống phân quyền đang kích hoạt vai trò{' '}
            <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">
              {currentRole}
            </span>
            . Bạn có thể sử dụng menu điều hướng bên trái để truy cập các phân hệ được cấp phép theo đặc tả SRS v1.1.
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
            {apiConnected ? 'Backend:5001 Đang kết nối' : 'Đang kiểm tra API...'}
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
