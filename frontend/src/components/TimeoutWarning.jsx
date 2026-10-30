import { Clock, ShieldAlert, LogOut, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * TimeoutWarning Modal Component (SRS 5.3)
 * Cảnh báo đếm ngược 2 phút khi người dùng không tương tác trong hệ thống
 */
export default function TimeoutWarning({ isOpen, remainingSeconds, onStayLoggedIn, onLogout }) {
  const { isEn } = useLanguage();

  if (!isOpen) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="timeout-title"
      aria-describedby="timeout-desc"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden transform transition-all">
        {/* Header với icon cảnh báo */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-5 text-white flex items-center gap-3">
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-xs">
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 id="timeout-title" className="text-lg font-bold">
              {isEn ? 'Session Expiration Warning' : 'Cảnh báo hết hạn phiên'}
            </h3>
            <p className="text-xs text-amber-100">
              {isEn ? 'Zen CRM Session Security (SRS 5.3)' : 'Bảo mật phiên làm việc Zen CRM (SRS 5.3)'}
            </p>
          </div>
        </div>

        {/* Nội dung cảnh báo */}
        <div className="p-6 space-y-4">
          <p id="timeout-desc" className="text-sm text-slate-600 leading-relaxed">
            {isEn
              ? 'The system detected inactivity for nearly 30 minutes. To protect customer data security, your session will automatically log out in:'
              : 'Hệ thống nhận thấy bạn không có thao tác trong gần 30 phút qua. Nhằm bảo đảm an toàn dữ liệu khách hàng, phiên làm việc sẽ tự động đăng xuất sau:'}
          </p>

          {/* Đồng hồ đếm ngược */}
          <div className="flex items-center justify-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <Clock className="h-7 w-7 text-amber-600 animate-pulse" />
            <span className="text-3xl font-extrabold font-mono text-amber-900 tracking-wider">
              {formattedTime}
            </span>
          </div>

          <p className="text-xs text-slate-500 text-center">
            {isEn
              ? 'Would you like to extend your session and continue working?'
              : 'Bạn có muốn tiếp tục làm việc và gia hạn phiên đăng nhập không?'}
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" /> {isEn ? 'Log Out Now' : 'Đăng xuất ngay'}
            </button>
            <button
              type="button"
              onClick={onStayLoggedIn}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/25 transition-colors cursor-pointer"
            >
              <CheckCircle className="h-4 w-4" /> {isEn ? 'Stay Logged In' : 'Tiếp tục làm việc'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

