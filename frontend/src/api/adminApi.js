import axiosClient from './axiosClient';

/**
 * Service API Quản trị Người dùng & Phân quyền (SRS 2.1)
 */
export const adminApi = {
  // Lấy danh sách vai trò hệ thống
  getRoles: () => axiosClient.get('/admin/roles'),

  // Lấy danh sách nhân viên phân trang (mặc định 20 dòng) kèm bộ lọc
  getUsers: (params = {}) => axiosClient.get('/admin/users', { params }),

  // Tạo tài khoản nhân viên mới (gán role, mật khẩu mặc định 11111111)
  createUser: (userData) => axiosClient.post('/admin/users', userData),

  // Bật/Tắt kích hoạt tài khoản nhân viên
  updateUserStatus: (id, is_active) =>
    axiosClient.patch(`/admin/users/${id}/status`, { is_active }),

  // Cập nhật/gán vai trò nhân viên
  updateUserRole: (id, role_id) =>
    axiosClient.patch(`/admin/users/${id}/role`, { role_id }),

  // Đặt lại mật khẩu trực tiếp cho nhân viên
  resetUserPassword: (id, new_password) =>
    axiosClient.post(`/admin/users/${id}/reset-password`, { new_password }),
};

export default adminApi;
