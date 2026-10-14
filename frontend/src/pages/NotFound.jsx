import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
          <Compass className="h-8 w-8 animate-spin" style={{ animationDuration: '8s' }} />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 tracking-wide">
            HTTP 404 &bull; Page Not Found
          </span>
          <h1 className="text-2xl font-bold text-slate-900">
            Không tìm thấy trang
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển trong hệ thống Zen CRM.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-colors w-full"
          >
            <Home className="h-4 w-4" /> Quay về Trang chủ / Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
