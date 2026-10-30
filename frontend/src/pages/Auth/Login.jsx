import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, User, ArrowRight, AlertCircle, ShieldCheck, Globe } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useAuth } from '../../context/authContextDef';
import { useLanguage } from '../../context/LanguageContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { isEn, toggleLanguage } = useLanguage();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password) {
      setError(
        isEn
          ? 'Please enter both username and password'
          : 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu'
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await axiosClient.post('/auth/login', {
        username: formData.username.trim(),
        password: formData.password,
      });

      // API trả về chuẩn { success: true, message, data: { token, user } }
      const token = res.data?.token || res.token;
      const user = res.data?.user || res.user;

      if (token && user) {
        login(user, token);
        navigate(from, { replace: true });
      } else {
        setError(
          isEn ? 'Invalid server response.' : 'Phản hồi từ máy chủ không hợp lệ'
        );
      }
    } catch (err) {
      setError(
        err?.message ||
          (isEn
            ? 'Sign in failed. Please check your credentials.'
            : 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAF5EC] via-[#EAF5EC] to-[#DDF0E2] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative">
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

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo */}
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-3xl bg-gradient-to-br from-[#3CB371] to-[#2E7D32] flex items-center justify-center text-white shadow-xl shadow-[#3CB371]/25 ring-4 ring-white/80">
            <svg
              className="w-8 h-8"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.5 6C4.5 5.17 5.17 4.5 6 4.5H18C18.83 4.5 19.5 5.17 19.5 6C19.5 6.55 19.2 7.05 18.73 7.32L9.2 12.8H18C18.83 12.8 19.5 13.47 19.5 14.3C19.5 15.13 18.83 15.8 18 15.8H6C5.17 15.8 4.5 15.13 4.5 14.3C4.5 13.75 4.8 13.25 5.27 12.98L14.8 7.5H6C5.17 7.5 4.5 6.83 4.5 6Z"
                fill="currentColor"
              />
              <circle cx="18" cy="5.5" r="2.2" fill="#A7F3D0" />
            </svg>
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-[#1F2937] tracking-tight">
          Zen CRM Platform
        </h2>
        <p className="mt-1 text-center text-xs text-[#6B7280]">
          {isEn
            ? 'Enterprise Customer Relationship Management System'
            : 'Hệ thống Quản trị Quan hệ Khách hàng Doanh nghiệp'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-[#DDF0E2] space-y-6">
          <div className="border-b border-[#DDF0E2] pb-4">
            <h3 className="text-lg font-bold text-[#1F2937]">
              {isEn ? 'Account Login' : 'Đăng nhập tài khoản'}
            </h3>
            <p className="text-xs text-[#6B7280]">
              {isEn
                ? 'Enter staff credentials to begin your session'
                : 'Nhập thông tin nhân viên để bắt đầu phiên làm việc'}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider mb-1">
                {isEn ? 'Username or Email' : 'Tài khoản hoặc Email'}
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B7280]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder={isEn ? 'Email or username' : 'Email hoặc tên đăng nhập'}
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#F3F4F6] border border-[#DDF0E2] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3CB371]/30 focus:border-[#3CB371] focus:bg-white transition-all text-[#1F2937]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#1F2937] uppercase tracking-wider">
                  {isEn ? 'Password' : 'Mật khẩu'}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#2E7D32] hover:text-[#38A169] font-medium"
                >
                  {isEn ? 'Forgot password?' : 'Quên mật khẩu?'}
                </Link>
              </div>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6B7280]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder={isEn ? 'Password' : 'Mật khẩu'}
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#F3F4F6] border border-[#DDF0E2] rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3CB371]/30 focus:border-[#3CB371] focus:bg-white transition-all text-[#1F2937]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#3CB371] hover:bg-[#38A169] shadow-md shadow-[#3CB371]/20 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#3CB371] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>{isEn ? 'Authenticating...' : 'Đang xác thực...'}</span>
              ) : (
                <>
                  <span>{isEn ? 'Sign In to System' : 'Đăng nhập hệ thống'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-xs text-[#6B7280] flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-[#3CB371]" />
          <span>
            {isEn
              ? 'Secure session automatically expires after 30 minutes of inactivity'
              : 'Phiên làm việc bảo mật tự động hết hạn sau 30 phút'}
          </span>
        </div>
      </div>
    </div>
  );
}

