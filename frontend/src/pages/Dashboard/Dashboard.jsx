import { useState } from 'react';
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
  Megaphone,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/authContextDef';
import dashboardApi from '../../api/dashboardApi';

// Hàm format tiền tệ VNĐ
const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

// Hàm format ngày giờ Việt Nam
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const [y, m, d] = dateStr.slice(0, 10).split('-');
      return `${d}/${m}/${y}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

const OPP_STATUS_COLORS = {
  NEW: 'bg-blue-100 text-blue-800 border-blue-200',
  QUALIFIED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  PROPOSAL: 'bg-purple-100 text-purple-800 border-purple-200',
  NEGOTIATION: 'bg-amber-100 text-amber-800 border-amber-200',
  ORDERED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  LOST: 'bg-rose-100 text-rose-800 border-rose-200',
};

const OPP_STATUS_LABELS = {
  NEW: 'Mới tạo',
  QUALIFIED: 'Đủ điều kiện',
  PROPOSAL: 'Đã gửi báo giá',
  NEGOTIATION: 'Đang đàm phán',
  ORDERED: 'Đã chốt đơn',
  LOST: 'Thất bại',
};

export default function Dashboard() {
  const { user, role } = useAuth();
  const currentRole = (role || user?.role_name || user?.role || '').trim().toUpperCase();

  // Mặc định ẩn dữ liệu khi vừa vào Dashboard, chỉ tải khi người dùng nhấn "Xem dữ liệu 1 năm gần nhất"
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [dashboardData, setDashboardData] = useState({
    summary: {
      leadsCount: 0,
      todayLeadsCount: 0,
      oppsCount: 0,
      openOppsCount: 0,
      closedWonOppsCount: 0,
      pipelineValue: 0,
      ordersCount: 0,
      totalRevenue: 0,
      todayRevenue: 0,
      productsCount: 0,
      totalStock: 0,
      categoriesCount: 0,
      campaignsCount: 0,
      activeCampaignsCount: 0,
      usersCount: 0,
      activeUsersCount: 0,
      inactiveUsersCount: 0,
      rolesCount: 0,
      yearTarget: 0,
      planCompletion: '0%',
      winRate: '0%',
    },
    personal: null,
    recentOrders: [],
    recentOpportunities: [],
    recentLeads: [],
    recentUsers: [],
  });

  const fetchDashboardStats = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg('');

    try {
      const res = await dashboardApi.getStats();
      if (res.data) {
        setDashboardData(res.data);
        setHasLoaded(true);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Không thể trích xuất dữ liệu tổng quan từ Database.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleHideData = () => {
    setHasLoaded(false);
  };

  const summary = dashboardData.summary;

  // Cấu hình KPI động lấy 100% từ Database
  const getRoleKPIs = () => {
    if (currentRole === 'ADMIN') {
      return [
        {
          label: 'Tổng Tài Khoản Nhân Viên',
          value: summary.usersCount,
          change: `${summary.activeUsersCount} đang hoạt động trong DB`,
          icon: Users,
          color: 'from-purple-600 to-indigo-600',
        },
        {
          label: 'Tài Khoản Đang Kích Hoạt',
          value: summary.activeUsersCount,
          change: 'Sẵn sàng đăng nhập & tác vụ',
          icon: ShieldCheck,
          color: 'from-emerald-500 to-teal-600',
        },
        {
          label: 'Tài Khoản Bị Khóa',
          value: summary.inactiveUsersCount,
          change: summary.inactiveUsersCount === 0 ? 'Không có tài khoản bị khóa' : 'Cần kiểm tra trạng thái',
          icon: Activity,
          color: 'from-rose-500 to-pink-600',
        },
        {
          label: 'Cấu Trúc Phân Quyền (RBAC)',
          value: `${summary.rolesCount} Vai trò`,
          change: 'ADMIN, SALE_MANAGER, SALESMAN',
          icon: DollarSign,
          color: 'from-blue-600 to-cyan-600',
        },
      ];
    }

    if (currentRole === 'SALE_MANAGER') {
      return [
        {
          label: 'Sản Phẩm & Kho Hàng',
          value: summary.productsCount,
          change: `${summary.totalStock.toLocaleString()} sản phẩm tồn kho`,
          icon: Package,
          color: 'from-indigo-600 to-blue-600',
        },
        {
          label: 'Tổng Doanh Thu Đã Chốt',
          value: formatVND(summary.totalRevenue),
          change: `Từ ${summary.ordersCount} đơn hàng thực tế`,
          icon: ShoppingCart,
          color: 'from-emerald-600 to-teal-600',
        },
        {
          label: 'Chiến Dịch Tiếp Thị',
          value: summary.campaignsCount,
          change: `${summary.activeCampaignsCount} chiến dịch đang hoạt động`,
          icon: Megaphone,
          color: 'from-pink-600 to-rose-600',
        },
        {
          label: 'Tiến Độ Kế Hoạch 12 Tháng',
          value: summary.planCompletion,
          change: `Chỉ tiêu: ${formatVND(summary.yearTarget)}`,
          icon: TrendingUp,
          color: 'from-purple-600 to-indigo-600',
        },
      ];
    }

    // Mặc định vai trò SALESMAN
    return [
      {
        label: 'Khách Tiềm Năng (Leads)',
        value: summary.leadsCount,
        change: `${summary.todayLeadsCount} lead mới phát sinh hôm nay`,
        icon: Users,
        color: 'from-blue-600 to-indigo-600',
      },
      {
        label: 'Cơ Hội Đang Chăm Sóc',
        value: summary.openOppsCount,
        change: `Pipeline: ${formatVND(summary.pipelineValue)}`,
        icon: TrendingUp,
        color: 'from-amber-500 to-orange-600',
      },
      {
        label: 'Đơn Hàng Hoàn Tất',
        value: summary.ordersCount,
        change: `Doanh số: ${formatVND(summary.totalRevenue)}`,
        icon: ShoppingCart,
        color: 'from-emerald-500 to-teal-600',
      },
      {
        label: 'Tỷ Lệ Chốt Deal (Win Rate)',
        value: summary.winRate,
        change: `${summary.closedWonOppsCount}/${summary.oppsCount} cơ hội chốt thành công`,
        icon: DollarSign,
        color: 'from-purple-600 to-pink-600',
      },
    ];
  };

  const kpis = getRoleKPIs();

  // Lối tắt phân quyền
  const quickActions = [
    {
      title: 'Khách tiềm năng',
      desc: 'Quản lý thông tin & nguồn khách hàng mới (SRS 3.1 - 3.5)',
      path: '/leads',
      roles: ['SALESMAN', 'SALE_MANAGER'],
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      title: 'Cơ hội bán hàng',
      desc: 'Theo dõi tiến trình đàm phán & nhật ký Follow-up (SRS 3.6 - 3.11)',
      path: '/opportunities',
      roles: ['SALESMAN', 'SALE_MANAGER'],
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      title: 'Đơn hàng (Orders)',
      desc: 'Xem hóa đơn bán hàng & lịch sử chốt đơn (SRS 3.12)',
      path: '/orders',
      roles: ['SALESMAN', 'SALE_MANAGER'],
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      title: 'Quản lý Sản phẩm',
      desc: 'Quản trị kho hàng, đơn giá & cơ hội theo SP (SRS 3.15 - 3.17)',
      path: '/products',
      roles: ['SALE_MANAGER'],
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      title: 'Chiến dịch Tiếp thị',
      desc: 'Lập kế hoạch & đo lường hiệu quả ROI tiếp thị (SRS 3.18 - 3.19)',
      path: '/campaigns',
      roles: ['SALE_MANAGER'],
      color: 'text-pink-600 bg-pink-50 border-pink-200',
    },
    {
      title: 'Kế hoạch Doanh số',
      desc: 'Chỉ tiêu 12 tháng & Báo cáo đối soát thực tế (SRS 3.20 - 3.21)',
      path: '/forecast/setup',
      roles: ['SALE_MANAGER'],
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    },
    {
      title: 'Báo cáo Bán hàng',
      desc: 'Báo cáo Lead, Đơn & Doanh số theo Sản phẩm (SRS 2.1)',
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
      {/* Top Controls: Nút thao tác nhanh khi đã nạp dữ liệu */}
      {hasLoaded && (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#EAF5EC] text-[#2E7D32] text-xs font-semibold border border-[#DDF0E2]">
              <span className="h-2 w-2 rounded-full bg-[#3CB371] animate-pulse" />
              Dữ liệu 1 năm gần nhất (PostgreSQL)
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              id="btn-refresh-dashboard"
              onClick={() => fetchDashboardStats(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 text-xs font-medium text-[#4B5563] transition-colors border border-gray-200 cursor-pointer shadow-2xs"
              title="Làm mới dữ liệu từ Database"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#3CB371] ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Đang tải...' : 'Làm mới số liệu'}</span>
            </button>
            <button
              id="btn-hide-dashboard-data"
              onClick={handleHideData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-xs font-medium text-[#6B7280] hover:text-rose-600 transition-colors border border-gray-200 cursor-pointer shadow-2xs"
              title="Ẩn dữ liệu bảng điều khiển"
            >
              <EyeOff className="h-3.5 w-3.5" />
              <span>Ẩn dữ liệu</span>
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 text-rose-700 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Khung Trạng Thái Mặc Định: Chưa Tải Dữ Liệu */}
      {!hasLoaded && !loading && (
        <div className="bg-white rounded-2xl border border-[#DDF0E2] p-8 sm:p-12 text-center shadow-xs space-y-5">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-[#EAF5EC] border border-[#DDF0E2] flex items-center justify-center text-[#3CB371] shadow-xs">
            <Database className="h-8 w-8 text-[#3CB371]" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF5EC] text-[#2E7D32] text-xs font-semibold border border-[#DDF0E2]">
              <Calendar className="h-3.5 w-3.5 text-[#3CB371]" />
              Chế độ tối ưu hóa: Mặc định không hiện dữ liệu
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight">
              Dữ Liệu Bảng Điều Khiển Đang Ở Chế Độ Chờ
            </h2>
            <p className="text-[#6B7280] text-sm leading-relaxed">
              Theo quy tắc tối ưu hóa hiệu năng, Bảng điều khiển (Dashboard) mặc định không tải trước dữ liệu. Nhấn vào nút bên dưới để trích xuất và hiển thị toàn bộ chỉ số KPI, đơn hàng, cơ hội bán hàng và khách hàng tiềm năng trong <strong>1 năm gần nhất</strong> từ cơ sở dữ liệu PostgreSQL.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              id="btn-view-dashboard-data"
              onClick={() => fetchDashboardStats(false)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3CB371] hover:bg-[#38A169] active:bg-[#2E7D32] text-white font-semibold text-sm shadow-md shadow-[#3CB371]/25 hover:shadow-lg hover:shadow-[#3CB371]/35 transition-all transform active:scale-98 cursor-pointer"
            >
              <Eye className="h-4 w-4" />
              <span>Xem dữ liệu 1 năm gần nhất</span>
            </button>
          </div>
        </div>
      )}

      {/* Trạng Thái Đang Tải Dữ Liệu */}
      {loading && !hasLoaded && (
        <div className="bg-white rounded-2xl border border-[#DDF0E2] p-12 text-center shadow-xs space-y-4">
          <div className="mx-auto w-12 h-12 rounded-xl bg-[#EAF5EC] flex items-center justify-center text-[#3CB371]">
            <RefreshCw className="h-6 w-6 animate-spin text-[#3CB371]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-[#1F2937] text-base">Đang tải dữ liệu 1 năm gần nhất...</h3>
            <p className="text-xs text-[#6B7280]">
              Hệ thống đang truy vấn số liệu KPI, đơn hàng và cơ hội kinh doanh từ cơ sở dữ liệu PostgreSQL.
            </p>
          </div>
        </div>
      )}

      {/* Khi đã kích hoạt xem dữ liệu: Hiển thị đầy đủ KPI Cards & Bảng số liệu 1 năm gần nhất */}
      {hasLoaded && (
        <>
          {/* KPI Cards (Được tính toán động từ DB) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {kpis.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:shadow-sm transition-all relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#6B7280]">{kpi.label}</span>
                    <div
                      className="h-9 w-9 rounded-xl bg-[#EAF5EC] text-[#3CB371] flex items-center justify-center shadow-2xs"
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="mt-3">
                    {loading ? (
                      <div className="h-8 w-24 bg-slate-100 rounded animate-pulse" />
                    ) : (
                      <div className="text-2xl font-bold text-[#1F2937] tracking-tight">{kpi.value}</div>
                    )}
                    <div className="mt-1 flex items-center gap-1 text-xs text-[#6B7280]">
                      <ArrowUpRight className="h-3.5 w-3.5 text-[#3CB371]" />
                      <span>{kpi.change}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid 2 Cột: Bảng Đơn Hàng Mới Nhất & Cơ Hội Bán Hàng Gần Đây từ Database */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Khối 1: Đơn Hàng Mới Nhất từ Database */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-[#3CB371]" />
                  <h3 className="font-bold text-[#1F2937] text-base">Đơn Hàng Mới Nhất</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EAF5EC] text-[#2E7D32] font-semibold border border-[#DDF0E2]">
                    {dashboardData.recentOrders.length} đơn
                  </span>
                </div>

                {(currentRole === 'SALE_MANAGER' || currentRole === 'SALESMAN') && (
                  <Link
                    to="/orders"
                    className="text-xs text-[#2E7D32] hover:text-[#38A169] font-medium flex items-center gap-1 group"
                  >
                    Xem tất cả
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-medium">
                      <th className="pb-2.5 font-medium">Mã đơn</th>
                      <th className="pb-2.5 font-medium">Khách hàng</th>
                      <th className="pb-2.5 font-medium">Sản phẩm</th>
                      <th className="pb-2.5 font-medium text-right">Tổng tiền</th>
                      <th className="pb-2.5 font-medium text-right">Ngày chốt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {dashboardData.recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          Chưa có đơn hàng nào trong cơ sở dữ liệu.
                        </td>
                      </tr>
                    ) : (
                      dashboardData.recentOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#EAF5EC]/40 transition-colors">
                          <td className="py-2.5 font-semibold text-[#2E7D32] font-mono">
                            <Link to={`/orders/${ord.id}`} className="hover:underline">
                              {ord.order_code}
                            </Link>
                          </td>
                          <td className="py-2.5 text-[#1F2937] font-medium max-w-[120px] truncate">
                            {ord.lead_id ? (
                              <Link to={`/leads/${ord.lead_id}`} className="hover:text-[#3CB371] hover:underline">
                                {ord.customer_name || 'Khách hàng'}
                              </Link>
                            ) : (
                              ord.customer_name || 'Khách hàng'
                            )}
                          </td>
                          <td className="py-2.5 text-[#6B7280] max-w-[140px] truncate" title={ord.product_name}>
                            {ord.product_id ? (
                              <Link to={`/products/${ord.product_id}`} className="hover:text-[#3CB371] hover:underline">
                                {ord.product_name}
                              </Link>
                            ) : (
                              ord.product_name
                            )}
                          </td>
                          <td className="py-2.5 text-right font-bold text-slate-900">
                            {formatVND(ord.total_amount)}
                          </td>
                          <td className="py-2.5 text-right text-slate-500 whitespace-nowrap" title={formatDateTime(ord.order_date)}>
                            {formatDate(ord.order_date)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Khối 2: Cơ Hội Bán Hàng Tiềm Năng Mới từ Database */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                  <h3 className="font-bold text-[#1F2937] text-base">Cơ Hội Bán Hàng Đang Xử Lý</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                    {dashboardData.recentOpportunities.length} deal
                  </span>
                </div>

                {(currentRole === 'SALE_MANAGER' || currentRole === 'SALESMAN') && (
                  <Link
                    to="/opportunities"
                    className="text-xs text-[#2E7D32] hover:text-[#38A169] font-medium flex items-center gap-1 group"
                  >
                    Xem tất cả
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-medium">
                      <th className="pb-2.5 font-medium">Khách hàng</th>
                      <th className="pb-2.5 font-medium">Sản phẩm</th>
                      <th className="pb-2.5 font-medium text-right">SL</th>
                      <th className="pb-2.5 font-medium text-right">Dự kiến (VNĐ)</th>
                      <th className="pb-2.5 font-medium text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {dashboardData.recentOpportunities.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          Chưa có cơ hội bán hàng nào trong cơ sở dữ liệu.
                        </td>
                      </tr>
                    ) : (
                      dashboardData.recentOpportunities.map((opp) => (
                        <tr key={opp.id} className="hover:bg-[#EAF5EC]/40 transition-colors">
                          <td className="py-2.5 text-[#1F2937] font-semibold max-w-[120px] truncate">
                            <Link to={`/opportunities/${opp.id}`} className="hover:text-[#3CB371] hover:underline">
                              {opp.lead_name}
                            </Link>
                          </td>
                          <td className="py-2.5 text-[#6B7280] max-w-[130px] truncate" title={opp.product_name}>
                            {opp.product_id ? (
                              <Link to={`/products/${opp.product_id}`} className="hover:text-[#3CB371] hover:underline">
                                {opp.product_name}
                              </Link>
                            ) : (
                              opp.product_name
                            )}
                          </td>
                          <td className="py-2.5 text-right font-medium text-slate-700">
                            x{opp.quantity}
                          </td>
                          <td className="py-2.5 text-right font-bold text-slate-900">
                            {formatVND(opp.estimated_value)}
                          </td>
                          <td className="py-2.5 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${OPP_STATUS_COLORS[opp.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                            >
                              {OPP_STATUS_LABELS[opp.status] || opp.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Grid 2: Khách Hàng Tiềm Năng Mới & (Nếu là Admin: Nhân Sự Mới) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Khối 3: Khách hàng tiềm năng mới tiếp cận (Leads) */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#3CB371]" />
                  <h3 className="font-bold text-[#1F2937] text-base">Khách Tiềm Năng Mới Nhập</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EAF5EC] text-[#2E7D32] font-semibold border border-[#DDF0E2]">
                    {dashboardData.recentLeads.length} khách hàng
                  </span>
                </div>

                {(currentRole === 'SALE_MANAGER' || currentRole === 'SALESMAN') && (
                  <Link
                    to="/leads"
                    className="text-xs text-[#2E7D32] hover:text-[#38A169] font-medium flex items-center gap-1 group"
                  >
                    Xem danh sách Lead
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-medium">
                      <th className="pb-2.5 font-medium">Họ và tên</th>
                      <th className="pb-2.5 font-medium">Số điện thoại</th>
                      <th className="pb-2.5 font-medium">Email</th>
                      <th className="pb-2.5 font-medium">Nguồn chiến dịch</th>
                      <th className="pb-2.5 font-medium text-right">Ngày nhập</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {dashboardData.recentLeads.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          Chưa có khách hàng tiềm năng nào.
                        </td>
                      </tr>
                    ) : (
                      dashboardData.recentLeads.map((l) => (
                        <tr key={l.id} className="hover:bg-[#EAF5EC]/40 transition-colors">
                          <td className="py-2.5 font-semibold text-[#1F2937]">
                            <Link to={`/leads/${l.id}`} className="hover:text-[#3CB371] hover:underline">
                              {l.name}
                            </Link>
                          </td>
                          <td className="py-2.5 text-[#6B7280] font-mono">
                            {l.phone}
                          </td>
                          <td className="py-2.5 text-[#6B7280] max-w-[130px] truncate" title={l.email}>
                            {l.email}
                          </td>
                          <td className="py-2.5 text-[#6B7280] max-w-[120px] truncate">
                            {l.campaign_id ? (
                              <Link to={`/campaigns/${l.campaign_id}/report`} className="hover:text-[#3CB371] hover:underline">
                                {l.campaign_name}
                              </Link>
                            ) : (
                              l.campaign_name || 'Tiếp cận trực tiếp'
                            )}
                          </td>
                          <td className="py-2.5 text-right text-slate-500 whitespace-nowrap" title={formatDateTime(l.entered_date)}>
                            {formatDate(l.entered_date)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Khối 4: Nếu là Admin -> Hiển thị danh sách Nhân sự hệ thống; Nếu là Manager/Salesman -> Hiển thị Thống Kê Nhanh Kho & Tiếp Thị */}
            {currentRole === 'ADMIN' ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-purple-600" />
                    <h3 className="font-bold text-[#1F2937] text-base">Tài Khoản Nhân Sự Gần Đây</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                      {dashboardData.recentUsers.length} tài khoản
                    </span>
                  </div>

                  <Link
                    to="/admin/users"
                    className="text-xs text-[#2E7D32] hover:text-[#38A169] font-medium flex items-center gap-1 group"
                  >
                    Quản lý User
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-medium">
                        <th className="pb-2.5 font-medium">Username</th>
                        <th className="pb-2.5 font-medium">Họ và tên</th>
                        <th className="pb-2.5 font-medium">Vai trò</th>
                        <th className="pb-2.5 font-medium text-center">Trạng thái</th>
                        <th className="pb-2.5 font-medium text-right">Ngày tạo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {dashboardData.recentUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            Chưa có tài khoản nào.
                          </td>
                        </tr>
                      ) : (
                        dashboardData.recentUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 font-semibold text-slate-800 font-mono">
                              {u.username}
                            </td>
                            <td className="py-2.5 text-slate-600 font-medium">
                              {u.full_name}
                            </td>
                            <td className="py-2.5">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${u.role_name === 'ADMIN'
                                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                                    : u.role_name === 'SALE_MANAGER'
                                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  }`}
                              >
                                {u.role_name}
                              </span>
                            </td>
                            <td className="py-2.5 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${u.is_active
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-rose-50 text-rose-700'
                                  }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`}
                                />
                                {u.is_active ? 'Active' : 'Khóa'}
                              </span>
                            </td>
                            <td className="py-2.5 text-right text-slate-500 whitespace-nowrap">
                              {formatDate(u.created_at)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-[#3CB371]" />
                    <h3 className="font-bold text-[#1F2937] text-base">Tổng Quan Vận Hành Bán Hàng</h3>
                  </div>
                  <span className="text-xs text-[#6B7280] font-medium">Dữ liệu PostgreSQL</span>
                </div>

                <div className="grid grid-cols-2 gap-3.5 pt-1">
                  <div className="p-3.5 rounded-xl bg-[#EAF5EC] border border-[#DDF0E2]">
                    <span className="text-xs text-[#2E7D32] font-semibold block">Danh Mục Sản Phẩm</span>
                    <span className="text-xl font-bold text-[#1F2937] mt-1 block">
                      {summary.categoriesCount} nhóm hàng
                    </span>
                    <span className="text-[11px] text-[#6B7280] mt-0.5 block">
                      {summary.productsCount} mặt hàng đang bán
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-pink-50/60 border border-pink-100">
                    <span className="text-xs text-pink-600 font-medium block">Chiến Dịch Tiếp Thị</span>
                    <span className="text-xl font-bold text-slate-900 mt-1 block">
                      {summary.activeCampaignsCount} đang chạy
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Ngân sách: {formatVND(summary.totalBudget)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <span className="text-xs text-emerald-600 font-medium block">Tồn Kho Sản Phẩm</span>
                    <span className="text-xl font-bold text-slate-900 mt-1 block">
                      {summary.totalStock.toLocaleString()} đơn vị
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Sẵn sàng xuất đơn (SRS 3.12)
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100">
                    <span className="text-xs text-purple-600 font-medium block">Chỉ Tiêu Năm 2026</span>
                    <span className="text-xl font-bold text-slate-900 mt-1 block">
                      {summary.planCompletion}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">
                      Mục tiêu: {formatVND(summary.yearTarget)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Role-Based Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-[#1F2937] text-base">
                Chức Năng Nghiệp Vụ Được Phép Quản Lý
              </h3>
            </div>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Phân quyền thông minh cho vai trò{' '}
              <strong className="text-[#2E7D32] font-semibold">{currentRole}</strong> (Chức năng không thuộc quyền hạn được ẩn theo chuẩn RBAC).
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EAF5EC] text-[#2E7D32] self-start sm:self-auto border border-[#DDF0E2]">
            {allowedActions.length} phân hệ khả dụng
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {allowedActions.map((action, idx) => (
            <Link
              key={idx}
              to={action.path}
              className="group p-4 rounded-xl border border-[#DDF0E2] hover:border-[#3CB371] hover:shadow-md transition-all flex flex-col justify-between bg-white hover:bg-[#EAF5EC]/40"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1F2937] group-hover:text-[#2E7D32] transition-colors text-sm">
                    {action.title}
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#6B7280] group-hover:text-[#2E7D32] group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">
                  {action.desc}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-[#DDF0E2] flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">
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
    </div>
  );
}
