import { useState, useEffect } from 'react';
import axiosClient from './api/axiosClient';
import { AuthProvider } from './context/AuthContext';
import {
  Activity,
  Server,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Users,
  Briefcase,
  TrendingUp,
  Package,
  Megaphone,
} from 'lucide-react';

function AppContent() {
  const [healthStatus, setHealthStatus] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    axiosClient
      .get('/health')
      .then((res) => {
        setHealthStatus({ loading: false, data: res, error: null });
      })
      .catch((err) => {
        setHealthStatus({ loading: false, data: null, error: err.message || 'Không thể kết nối đến Backend API' });
      });
  }, []);

  const modules = [
    { title: 'Quản trị Người dùng (Admin)', icon: Users, desc: 'RBAC 3 vai trò: Admin, Manager, Salesman (SRS 2.1)' },
    { title: 'Khách hàng Tiềm năng (Leads)', icon: Users, desc: 'Phân trang 20 dòng, chống trùng SĐT/Email (SRS 3.1-3.5)' },
    { title: 'Cơ hội & Follow-up', icon: TrendingUp, desc: 'Nhật ký chăm sóc khách hàng & Make Order (SRS 3.6-3.12)' },
    { title: 'Sản phẩm & Danh mục', icon: Package, desc: 'Quản lý tồn kho, danh mục sản phẩm (SRS 3.15-3.17)' },
    { title: 'Chiến dịch & Báo cáo', icon: Megaphone, desc: 'Theo dõi hiệu quả chiến dịch bán hàng (SRS 3.18-3.19)' },
    { title: 'Kế hoạch & Doanh số (Forecast)', icon: Briefcase, desc: 'Setup Plan 12 tháng & Đối soát Actual (SRS 3.20-3.21)' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center text-white shadow-md font-bold text-xl">
              Z
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">Zen CRM</h1>
              <p className="text-xs text-slate-500">Enterprise Full-Stack CRM Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Environment Ready
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/20 text-blue-200 text-xs font-semibold backdrop-blur-sm border border-blue-400/20">
              <Layers className="h-4 w-4" /> Kiến trúc Clean MVC + React 18 Component-Based
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Hệ thống Zen CRM đã sẵn sàng hoạt động
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Khung dự án Full-Stack đã được thiết lập chuẩn công nghiệp. Backend Express.js hoạt động tại cổng 5001 và Frontend Vite React hoạt động tại cổng 5173 theo đúng đặc tả SRS v1.1.
            </p>
          </div>
        </div>

        {/* Backend Connectivity Status Box */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-base">Backend API Health Status</h3>
                <p className="text-xs text-slate-500">Kiểm tra kết nối tới Express.js:5001 qua Axios Interceptor</p>
              </div>
            </div>

            {healthStatus.loading && (
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Activity className="h-4 w-4 animate-spin text-blue-600" /> Đang kiểm tra...
              </span>
            )}

            {!healthStatus.loading && healthStatus.data && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="h-4 w-4" /> Kết nối thành công (200 OK)
              </span>
            )}

            {!healthStatus.loading && healthStatus.error && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                Cần chạy Backend server (:5001)
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-xs text-slate-500 font-medium">Frontend Dev Server</div>
              <div className="font-semibold text-slate-800 mt-1">http://localhost:5173</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-xs text-slate-500 font-medium">Backend RESTful API</div>
              <div className="font-semibold text-slate-800 mt-1">http://localhost:5001/api</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="text-xs text-slate-500 font-medium">Session Timeout Security</div>
              <div className="font-semibold text-slate-800 mt-1 flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> 30 Phút Tự động Logout
              </div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Các phân hệ nghiệp vụ theo chuẩn SRS v1.1</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {modules.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="font-semibold text-slate-900 text-base">{m.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{m.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-medium text-indigo-600">
                    Sẵn sàng triển khai →
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          Zen CRM Engineering Framework &bull; Tuân thủ tuyệt đối Definition of Done &bull; 2026
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
