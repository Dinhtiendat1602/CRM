import { useState, useEffect } from 'react';
import {
  UserPlus,
  RefreshCw,
  KeyRound,
  Shield,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  UserCheck,
  UserX,
} from 'lucide-react';
import adminApi from '../../api/adminApi';
import { useAuth } from '../../context/authContextDef';
import Pagination from '../../components/Common/Pagination';
import SearchInput from '../../components/Common/SearchInput';
import Modal from '../../components/Common/Modal';
import ConfirmDialog from '../../components/Common/ConfirmDialog';

export default function UserManagement() {
  const { user: currentUser } = useAuth();

  // State danh sách & phân trang
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // State bộ lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // State thông báo
  const [alertInfo, setAlertInfo] = useState(null); // { type: 'success' | 'error', message: '' }

  // State các Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [resetPwModalOpen, setResetPwModalOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);

  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);
  const [userToToggleStatus, setUserToToggleStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  // Form tạo user mới
  const [createUserForm, setCreateUserForm] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    role_id: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Form đặt lại mật khẩu trực tiếp
  const [resetPwForm, setResetPwForm] = useState({ newPassword: '' });
  const [resetPwLoading, setResetPwLoading] = useState(false);
  const [resetPwError, setResetPwError] = useState(null);

  // Tự động ẩn thông báo sau 4 giây
  useEffect(() => {
    if (alertInfo) {
      const timer = setTimeout(() => setAlertInfo(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [alertInfo]);

  // Tải danh sách vai trò hệ thống
  useEffect(() => {
    let cancelled = false;
    adminApi
      .getRoles()
      .then((res) => {
        if (!cancelled && res?.data) {
          setRoles(res.data);
          if (res.data.length > 0) {
            setCreateUserForm((prev) => ({
              ...prev,
              role_id: prev.role_id || res.data[0].id,
            }));
          }
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  // Tải danh sách người dùng phân trang
  useEffect(() => {
    let cancelled = false;

    const params = {
      page: pagination.page,
      limit: 20,
    };
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (selectedRole) params.role_id = selectedRole;
    if (selectedStatus !== '') params.is_active = selectedStatus;

    adminApi
      .getUsers(params)
      .then((res) => {
        if (!cancelled && res?.data) {
          setUsers(res.data);
          setPagination({
            page: res.pagination?.page || 1,
            limit: res.pagination?.limit || 20,
            total: res.pagination?.total || 0,
            totalPages: res.pagination?.totalPages || 1,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setAlertInfo({
            type: 'error',
            message: err?.message || 'Không thể tải danh sách người dùng',
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pagination.page, searchTerm, selectedRole, selectedStatus, reloadKey]);

  // Xử lý tạo nhân viên mới
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError(null);

    if (!createUserForm.username.trim() || !createUserForm.full_name.trim() || !createUserForm.email.trim()) {
      setCreateError('Vui lòng điền đầy đủ các trường bắt buộc (*)');
      return;
    }

    setCreateLoading(true);
    try {
      await adminApi.createUser({
        username: createUserForm.username.trim(),
        full_name: createUserForm.full_name.trim(),
        email: createUserForm.email.trim(),
        phone: createUserForm.phone.trim() || null,
        role_id: parseInt(createUserForm.role_id, 10),
      });

      setAlertInfo({
        type: 'success',
        message: `Tạo tài khoản "${createUserForm.username}" thành công! Mật khẩu khởi tạo: 11111111`,
      });
      setCreateModalOpen(false);
      setCreateUserForm({
        username: '',
        full_name: '',
        email: '',
        phone: '',
        role_id: roles[0]?.id || '',
      });
      setLoading(true);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setCreateError(err?.message || 'Không thể tạo tài khoản nhân viên');
    } finally {
      setCreateLoading(false);
    }
  };

  // Mở confirm toggle trạng thái Active / De-active
  const promptToggleStatus = (u) => {
    if (u.id === currentUser?.id) {
      setAlertInfo({
        type: 'error',
        message: 'Bạn không thể tự vô hiệu hóa tài khoản quản trị viên của chính mình!',
      });
      return;
    }
    setUserToToggleStatus(u);
    setConfirmStatusOpen(true);
  };

  // Xác nhận toggle status
  const confirmToggleStatus = async () => {
    if (!userToToggleStatus) return;
    setStatusLoading(true);
    try {
      const newStatus = !userToToggleStatus.is_active;
      await adminApi.updateUserStatus(userToToggleStatus.id, newStatus);
      setAlertInfo({
        type: 'success',
        message: `${newStatus ? 'Kích hoạt' : 'Khóa'} tài khoản ${userToToggleStatus.username} thành công!`,
      });
      setConfirmStatusOpen(false);
      setUserToToggleStatus(null);
      setLoading(true);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setAlertInfo({
        type: 'error',
        message: err?.message || 'Không thể cập nhật trạng thái tài khoản',
      });
    } finally {
      setStatusLoading(false);
    }
  };

  // Đổi role trực tiếp trên dropdown của dòng
  const handleChangeRole = async (targetUser, newRoleId) => {
    try {
      await adminApi.updateUserRole(targetUser.id, parseInt(newRoleId, 10));
      setAlertInfo({
        type: 'success',
        message: `Đã cập nhật vai trò cho ${targetUser.username}`,
      });
      setLoading(true);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setAlertInfo({
        type: 'error',
        message: err?.message || 'Không thể cập nhật vai trò',
      });
    }
  };

  // Xử lý Reset Mật khẩu cho nhân viên (SRS 2.1)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPwForm.newPassword || resetPwForm.newPassword.length < 8) {
      setResetPwError('Mật khẩu mới phải có tối thiểu 8 ký tự');
      return;
    }

    setResetPwLoading(true);
    setResetPwError(null);
    try {
      await adminApi.resetUserPassword(selectedUserForReset.id, resetPwForm.newPassword);
      setAlertInfo({
        type: 'success',
        message: `Đã đặt lại mật khẩu thành công cho ${selectedUserForReset.username}!`,
      });
      setResetPwModalOpen(false);
      setSelectedUserForReset(null);
      setResetPwForm({ newPassword: '' });
    } catch (err) {
      setResetPwError(err?.message || 'Không thể đặt lại mật khẩu');
    } finally {
      setResetPwLoading(false);
    }
  };

  // Badge màu theo vai trò
  const getRoleBadge = (roleName) => {
    switch (roleName) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SALE_MANAGER':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SALESMAN':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {alertInfo && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center justify-between shadow-xs animate-fade-in ${
            alertInfo.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {alertInfo.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{alertInfo.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlertInfo(null)}
            className="text-xs font-semibold underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
              SRS 2.1 &bull; Administration Side
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-100 text-slate-600">
              feat-007
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Quản trị Người dùng & Phân quyền
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý tài khoản nhân viên, gán vai trò RBAC, kiểm soát kích hoạt và đặt lại mật khẩu trực tiếp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setReloadKey((k) => k + 1);
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Thêm nhân viên mới</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <SearchInput
          defaultValue={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          placeholder="Tìm theo username, họ tên hoặc email..."
        />

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">Tất cả vai trò</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.role_name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang kích hoạt</option>
            <option value="false">Đã khóa</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Nhân viên</th>
                <th className="py-3.5 px-4">Liên hệ</th>
                <th className="py-3.5 px-4">Vai trò (Role)</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4">Ngày tạo</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Đang tải danh sách nhân viên...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500">
                    Không tìm thấy tài khoản nhân viên nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const initial = (u.full_name || u.username || 'U').charAt(0).toUpperCase();

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/70 transition-colors text-slate-700"
                    >
                      {/* Name & Username */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs">
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.full_name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 font-mono">
                              @{u.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact: Email & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[160px]">{u.email}</span>
                          </div>
                          {u.phone && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{u.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Role selection dropdown */}
                      <td className="py-3.5 px-4">
                        <select
                          value={u.role_id}
                          disabled={isCurrent}
                          onChange={(e) => handleChangeRole(u, e.target.value)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${getRoleBadge(
                            u.role_name
                          )} disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.role_name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Status Toggle Button */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => promptToggleStatus(u)}
                          disabled={isCurrent}
                          title={
                            isCurrent
                              ? 'Không thể tự khóa tài khoản của bạn'
                              : u.is_active
                              ? 'Bấm để khóa tài khoản'
                              : 'Bấm để mở kích hoạt'
                          }
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            u.is_active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-200'
                          }`}
                        >
                          {u.is_active ? (
                            <>
                              <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Đang hoạt động</span>
                            </>
                          ) : (
                            <>
                              <UserX className="h-3.5 w-3.5 text-red-600" />
                              <span>Đã khóa</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Created date */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '—'}
                      </td>

                      {/* Actions: Reset Password */}
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserForReset(u);
                            setResetPwModalOpen(true);
                            setResetPwError(null);
                            setResetPwForm({ newPassword: '' });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Đặt lại mật khẩu trực tiếp"
                        >
                          <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                          <span>Reset pass</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang 20 dòng chuẩn */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={20}
          onPageChange={(newPage) => setPagination((prev) => ({ ...prev, page: newPage }))}
        />
      </div>

      {/* Modal 1: Tạo nhân viên mới */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Thêm nhân viên mới"
        subtitle="Quản trị viên tạo tài khoản nhân viên và gán vai trò ban đầu (SRS 2.1)"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
            <Shield className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Mật khẩu khởi tạo tự động:</span> Mọi tài khoản mới được gán mật khẩu mặc định là <code className="bg-white px-1.5 py-0.5 rounded border border-blue-300 font-mono font-bold">11111111</code>. Nhân viên có thể tự đổi sau khi đăng nhập.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tài khoản (Username) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={createUserForm.username}
                onChange={(e) => setCreateUserForm({ ...createUserForm, username: e.target.value })}
                placeholder="vd: sales01"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={createUserForm.full_name}
                onChange={(e) => setCreateUserForm({ ...createUserForm, full_name: e.target.value })}
                placeholder="vd: Nguyễn Văn A"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email công việc <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={createUserForm.email}
                onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                placeholder="name@company.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={createUserForm.phone}
                onChange={(e) => setCreateUserForm({ ...createUserForm, phone: e.target.value })}
                placeholder="vd: 0912345678"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Vai trò ban đầu (Role) <span className="text-red-500">*</span>
            </label>
            <select
              value={createUserForm.role_id}
              onChange={(e) => setCreateUserForm({ ...createUserForm, role_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.role_name} — {r.description || 'Quyền hạn hệ thống'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {createLoading ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Đặt lại mật khẩu trực tiếp cho nhân viên */}
      <Modal
        isOpen={resetPwModalOpen}
        onClose={() => setResetPwModalOpen(false)}
        title={`Đặt lại mật khẩu cho ${selectedUserForReset?.username || ''}`}
        subtitle="Quản trị viên can thiệp đặt lại mật khẩu trực tiếp khi nhân viên quên mật khẩu (SRS 2.1)"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          {resetPwError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{resetPwError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Mật khẩu mới (Tối thiểu 8 ký tự) <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={resetPwForm.newPassword}
              onChange={(e) => setResetPwForm({ newPassword: e.target.value })}
              placeholder="Nhập mật khẩu mới..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setResetPwModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={resetPwLoading}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {resetPwLoading ? 'Đang cập nhật...' : 'Xác nhận đặt lại mật khẩu'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog: Khóa / Kích hoạt tài khoản */}
      <ConfirmDialog
        isOpen={confirmStatusOpen}
        onClose={() => setConfirmStatusOpen(false)}
        onConfirm={confirmToggleStatus}
        loading={statusLoading}
        title={userToToggleStatus?.is_active ? 'Khóa tài khoản nhân viên' : 'Kích hoạt lại tài khoản'}
        message={
          userToToggleStatus?.is_active
            ? `Bạn có chắc chắn muốn khóa tài khoản "${userToToggleStatus?.username}"? Nhân viên này sẽ không thể đăng nhập vào hệ thống Zen CRM cho đến khi được kích hoạt lại.`
            : `Bạn có muốn mở lại quyền truy cập cho tài khoản "${userToToggleStatus?.username}"?`
        }
        confirmText={userToToggleStatus?.is_active ? 'Khóa tài khoản' : 'Kích hoạt ngay'}
        isDangerous={userToToggleStatus?.is_active}
      />
    </div>
  );
}
