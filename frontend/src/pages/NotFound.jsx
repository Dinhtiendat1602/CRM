import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function NotFound() {
  const { isEn } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAF5EC] to-[#DDF0E2] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-[#DDF0E2] p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-[#EAF5EC] text-[#2E7D32] flex items-center justify-center shadow-inner">
          <Compass className="h-8 w-8 animate-spin" style={{ animationDuration: '8s' }} />
        </div>

        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF5EC] text-[#2E7D32] border border-[#DDF0E2] tracking-wide">
            HTTP 404 &bull; {isEn ? 'Page Not Found' : 'Không Tìm Thấy Trang'}
          </span>
          <h1 className="text-2xl font-bold text-[#1F2937]">
            {isEn ? 'Page Not Found' : 'Không tìm thấy trang'}
          </h1>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            {isEn
              ? 'The requested URL does not exist or has been moved within Zen CRM.'
              : 'Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển trong hệ thống Zen CRM.'}
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#3CB371] hover:bg-[#38A169] active:bg-[#2E7D32] text-white text-sm font-semibold shadow-md transition-colors w-full"
          >
            <Home className="h-4 w-4" /> {isEn ? 'Back to Dashboard / Home' : 'Quay về Trang chủ / Dashboard'}
          </Link>
        </div>
      </div>
    </div>
  );
}

