import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export default function ForgotPassword() {
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
      setError(err?.message || 'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAF5EC] to-[#DDF0E2] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-[#DDF0E2] space-y-6">
          <div>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#1F2937] mb-3"
            >
              <ArrowLeft className="h-4 w-4" /> Quay lại Đăng nhập
            </Link>
            <h3 className="text-xl font-bold text-[#1F2937]">Quên mật khẩu?</h3>
            <p className="text-xs text-[#6B7280] mt-1">
              Nhập email đã đăng ký tài khoản nhân viên để nhận liên kết đặt lại mật khẩu.
            </p>
          </div>

          {success ? (
            <div className="p-4 rounded-xl bg-[#EAF5EC] border border-[#DDF0E2] text-[#2E7D32] text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-[#2E7D32]">
                <CheckCircle2 className="h-5 w-5 text-[#3CB371]" />
                <span>Đã gửi email khôi phục</span>
              </div>
              <p>
                Nếu email tồn tại trong hệ thống, bạn sẽ nhận được đường dẫn khôi phục mật khẩu có hiệu lực trong 15 phút.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="font-semibold text-[#2E7D32] underline"
                >
                  Quay lại đăng nhập ngay
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
                  Email nhân viên
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
                  <span>Đang xử lý...</span>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Gửi liên kết đặt lại mật khẩu</span>
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
