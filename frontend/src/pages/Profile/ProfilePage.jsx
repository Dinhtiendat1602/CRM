import { useState, useEffect } from 'react';
import {
  User,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Save,
  Phone,
  Mail,
  Lock,
} from 'lucide-react';
import authApi from '../../api/authApi';
import { useAuth } from '../../context/authContextDef';

export default function ProfilePage() {
  const { user: authUser, login, token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    role_name: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [profileMsg, setProfileMsg] = useState(null); // { type, text }
  const [passwordMsg, setPasswordMsg] = useState(null);

  // Tải thông tin người dùng từ GET /api/auth/me
  useEffect(() => {
    authApi
      .getMe()
      .then((res) => {
        if (res?.data) {
          setProfileForm({
            username: res.data.username || '',
            full_name: res.data.full_name || '',
            email: res.data.email || '',
            phone: res.data.phone || '',
            role_name: res.data.role_name || '',
          });
        }
      })
      .catch(() => {
        // Fallback sang thông tin từ localStorage / context
        if (authUser) {
          setProfileForm({
            username: authUser.username || '',
            full_name: authUser.full_name || '',
            email: authUser.email || '',
            phone: authUser.phone || '',
            role_name: authUser.role_name || '',
          });
        }
      });
  }, [authUser]);

  // Cập nhật thông tin cá nhân
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(null);
    setLoading(true);

    try {
      const res = await authApi.updateProfile({
        full_name: profileForm.full_name.trim(),
        phone: profileForm.phone.trim() || null,
      });

      if (res?.data) {
        // Cập nhật context & localStorage để Header phản ánh ngay họ tên mới
        login(res.data, token);
        setProfileMsg({
          type: 'success',
          text: 'Cập nhật thông tin cá nhân thành công!',
        });
      }
    } catch (err) {
      setProfileMsg({
        type: 'error',
        text: err?.message || 'Không thể cập nhật hồ sơ cá nhân.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (passwordForm.new_password.length < 8) {
      setPasswordMsg({
        type: 'error',
        text: 'Mật khẩu mới phải có tối thiểu 8 ký tự.',
      });
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordMsg({
        type: 'error',
        text: 'Mật khẩu xác nhận không trùng khớp.',
      });
      return;
    }

    setLoading(true);
    try {
      await authApi.updateProfile({
        old_password: passwordForm.old_password,
        new_password: passwordForm.new_password,
      });

      setPasswordMsg({
        type: 'success',
        text: 'Đổi mật khẩu thành công! Hãy sử dụng mật khẩu mới cho các lần đăng nhập tiếp theo.',
      });
      setPasswordForm({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err) {
      setPasswordMsg({
        type: 'error',
        text: err?.message || 'Mật khẩu cũ không chính xác hoặc không hợp lệ.',
      });
    } finally {
      setLoading(false);
    }
  };

  const initial = (profileForm.full_name || profileForm.username || 'U')
    .charAt(0)
    .toUpperCase();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-indigo-500/20 shrink-0">
            {initial}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                SRS 3.13 &bull; User Profile
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {profileForm.role_name || 'Member'}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {profileForm.full_name || profileForm.username}
            </h1>
            <p className="text-xs text-slate-400 font-mono">@{profileForm.username}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form 1: Thông tin cá nhân */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Thông tin cá nhân</h2>
          </div>

          {profileMsg && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {profileMsg.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              )}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tài khoản đăng nhập (Không thể đổi)
              </label>
              <input
                type="text"
                disabled
                value={profileForm.username}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Địa chỉ Email công việc (Không thể đổi)
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  disabled
                  value={profileForm.email}
                  className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Họ và tên hiển thị <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Số điện thoại liên lạc
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="0912345678"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Đang lưu...' : 'Lưu thông tin cá nhân'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Form 2: Đổi mật khẩu cá nhân */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">Đổi mật khẩu tài khoản</h2>
          </div>

          {passwordMsg && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {passwordMsg.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={passwordForm.old_password}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, old_password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Mật khẩu mới (Tối thiểu 8 ký tự) <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={passwordForm.new_password}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, new_password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={passwordForm.confirm_password}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
              >
                <KeyRound className="h-4 w-4" />
                <span>{loading ? 'Đang đổi mật khẩu...' : 'Cập nhật mật khẩu mới'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
