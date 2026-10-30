import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, Globe } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useLanguage } from '../../context/LanguageContext';

export default function ForgotPassword() {
  const { isEn, toggleLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await axiosClient.post('/auth/forgot-password', { email: email.trim() });
      setSuccess(true);
    } catch (err) {
      setError(
        err?.message ||
          (isEn
            ? 'An error occurred while sending your request. Please try again.'
            : 'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.')
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
          <div>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#1F2937] mb-3"
            >
              <ArrowLeft className="h-4 w-4" /> {isEn ? 'Back to Sign In' : 'Quay lại Đăng nhập'}
            </Link>
            <h3 className="text-xl font-bold text-[#1F2937]">
              {isEn ? 'Forgot Password?' : 'Quên mật khẩu?'}
            </h3>
            <p className="text-xs text-[#6B7280] mt-1">
              {isEn
                ? 'Enter your registered employee email to receive a password reset link.'
                : 'Nhập email đã đăng ký tài khoản nhân viên để nhận liên kết đặt lại mật khẩu.'}
            </p>
          </div>

          {success ? (
            <div className="p-4 rounded-xl bg-[#EAF5EC] border border-[#DDF0E2] text-[#2E7D32] text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-[#2E7D32]">
                <CheckCircle2 className="h-5 w-5 text-[#3CB371]" />
                <span>{isEn ? 'Recovery Email Sent' : 'Đã gửi email khôi phục'}</span>
              </div>
              <p>
                {isEn
                  ? 'If your email exists in our system, you will receive a password reset link valid for 15 minutes.'
                  : 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được đường dẫn khôi phục mật khẩu có hiệu lực trong 15 phút.'}
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="font-semibold text-[#2E7D32] underline"
                >
                  {isEn ? 'Return to sign in now' : 'Quay lại đăng nhập ngay'}
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
                  {isEn ? 'Employee Email' : 'Email nhân viên'}
                </label>
                <div className="relative rounded-xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#3CB371] hover:bg-[#38A169] active:bg-[#2E7D32] shadow-md focus:outline-hidden focus:ring-2 focus:ring-[#3CB371] cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>{isEn ? 'Processing...' : 'Đang xử lý...'}</span>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>{isEn ? 'Send Password Reset Link' : 'Gửi liên kết đặt lại mật khẩu'}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

