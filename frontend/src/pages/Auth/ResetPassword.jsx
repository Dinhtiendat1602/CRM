import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle2, AlertCircle, Globe } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useLanguage } from '../../context/LanguageContext';

export default function ResetPassword() {
  const { isEn, toggleLanguage } = useLanguage();
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError(
        isEn
          ? 'New password must be at least 8 characters long.'
          : 'Mật khẩu mới phải có độ dài tối thiểu 8 ký tự'
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(
        isEn
          ? 'Confirmation password does not match.'
          : 'Mật khẩu xác nhận không khớp'
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axiosClient.post('/auth/reset-password', {
        token,
        new_password: newPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err?.message ||
          (isEn
            ? 'Password reset link is invalid or has expired.'
            : 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAF5EC] to-[#DDF0E2] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative">
      {/* Top right language switcher */}
      <div className="absolute top-4 right-4">
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 hover:bg-white text-slate-700 shadow-sm border border-[#DDF0E2] transition-colors cursor-pointer"
          title={isEn ? 'Chuyển sang Tiếng Việt' : 'Switch to English'}
        >
          <Globe className="h-3.5 w-3.5 text-[#3CB371]" />
          <span>{isEn ? 'English' : 'Tiếng Việt'}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-[#DDF0E2] space-y-6">
          <div className="border-b border-[#DDF0E2] pb-4">
            <h3 className="text-xl font-bold text-[#1F2937]">
              {isEn ? 'Set New Password' : 'Thiết lập mật khẩu mới'}
            </h3>
            <p className="text-xs text-[#6B7280] mt-1">
              {isEn
                ? 'Enter a secure new password for your account.'
                : 'Nhập mật khẩu mới an toàn cho tài khoản của bạn.'}
            </p>
          </div>

          {success ? (
            <div className="p-4 rounded-xl bg-[#EAF5EC] border border-[#DDF0E2] text-[#2E7D32] text-xs space-y-3 text-center">
              <CheckCircle2 className="h-10 w-10 text-[#3CB371] mx-auto" />
              <p className="font-bold text-sm text-[#2E7D32]">
                {isEn ? 'Password Reset Successfully!' : 'Đặt lại mật khẩu thành công!'}
              </p>
              <p>
                {isEn
                  ? 'Your password has been updated securely in the database.'
                  : 'Mật khẩu của bạn đã được cập nhật an toàn trong cơ sở dữ liệu.'}
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-white bg-[#3CB371] hover:bg-[#38A169] active:bg-[#2E7D32] transition-colors"
                >
                  {isEn ? 'Sign in now' : 'Đăng nhập ngay'} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {isEn ? 'New Password (min 8 characters)' : 'Mật khẩu mới (tối thiểu 8 ký tự)'}
                </label>
                <div className="relative rounded-xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {isEn ? 'Confirm New Password' : 'Xác nhận mật khẩu mới'}
                </label>
                <div className="relative rounded-xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#3CB371] hover:bg-[#38A169] active:bg-[#2E7D32] shadow-md focus:outline-hidden focus:ring-2 focus:ring-[#3CB371] cursor-pointer disabled:opacity-50"
              >
                {loading
                  ? isEn
                    ? 'Updating...'
                    : 'Đang cập nhật...'
                  : isEn
                  ? 'Update Password'
                  : 'Cập nhật mật khẩu'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

