import { Link } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../context/authContextDef';

export default function Forbidden() {
  const { user, role } = useAuth();
  const currentRole = role || user?.role_name || user?.role || 'Khách';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAF5EC] to-[#DDF0E2] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-[#DDF0E2] p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner">
          <ShieldX className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 tracking-wide">
            HTTP 403 &bull; Access Denied
          </span>
          <h1 className="text-2xl font-bold text-[#1F2937]">
            Truy cập bị từ chối
          </h1>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            Tài khoản của bạn không có đủ quyền hạn để truy cập vào phân hệ này theo chính sách bảo mật RBAC.
          </p>
        </div>

        <div className="p-3 bg-[#F3F4F6] rounded-xl border border-slate-200 text-xs text-[#6B7280] flex items-center justify-between">
          <span className="font-medium text-[#6B7280]">Vai trò hiện tại:</span>
          <span className="font-bold text-[#1F2937] bg-white px-2.5 py-1 rounded-md border border-[#DDF0E2] shadow-2xs">
            {currentRole}
          </span>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại
          </button>
          <Link
            to="/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#3CB371] hover:bg-[#38A169] active:bg-[#2E7D32] text-white text-sm font-semibold shadow-md transition-colors"
          >
            <Home className="h-4 w-4" /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
