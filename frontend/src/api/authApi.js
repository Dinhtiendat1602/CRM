import axiosClient from './axiosClient';

/**
 * Service API Xác thực và Hồ sơ cá nhân (SRS 3.13, 3.14)
 */
export const authApi = {
  // Đăng nhập hệ thống (username hoặc email + password)
  login: (credentials) => axiosClient.post('/auth/login', credentials),

  // Lấy thông tin tài khoản hiện tại
  getMe: () => axiosClient.get('/auth/me'),

  // Cập nhật thông tin cá nhân & đổi mật khẩu
  updateProfile: (data) => axiosClient.put('/auth/profile', data),

  // Yêu cầu liên kết đặt lại mật khẩu qua email
  forgotPassword: (email) => axiosClient.post('/auth/forgot-password', { email }),

  // Kiểm tra tính hợp lệ của token đặt lại mật khẩu
  verifyResetToken: (token) => axiosClient.get(`/auth/verify-reset-token/${token}`),

  // Đặt lại mật khẩu mới
  resetPassword: (token, new_password) =>
    axiosClient.post('/auth/reset-password', { token, new_password }),
};

export default authApi;
