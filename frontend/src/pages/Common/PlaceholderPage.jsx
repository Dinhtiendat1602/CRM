import { Layers, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/authContextDef';

/**
 * Component hiển thị giao diện phân hệ đang kết nối
 * Cho phép kiểm tra điều hướng, phân quyền, layout mượt mà trước khi gắn dữ liệu chi tiết
 */
export default function PlaceholderPage({ title, srsRef, description, featureId }) {
  const { user, role } = useAuth();
  const currentRole = role || user?.role_name || user?.role;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              {srsRef || 'SRS v1.1'}
            </span>
            {featureId && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-100 text-slate-600">
                {featureId}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Đã xác thực ({currentRole})
          </span>
        </div>
      </div>

      {/* Module Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Layers className="h-7 w-7" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h2 className="text-lg font-bold text-slate-900">
            Khung giao diện phân hệ đã sẵn sàng
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Hệ thống Admin UI, Breadcrumbs, Sidebar Navigation và Role Guard đã được thiết lập chuẩn mực. Dữ liệu bảng biểu và thao tác CRUD sẽ được kích hoạt theo kế hoạch triển khai.
          </p>
        </div>

        <div className="pt-4 flex items-center justify-center gap-2 text-xs font-medium text-emerald-600">
          <CheckCircle2 className="h-4 w-4" /> Tuyệt đối tuân thủ nguyên tắc "One feature at a time"
        </div>
      </div>
    </div>
  );
}
