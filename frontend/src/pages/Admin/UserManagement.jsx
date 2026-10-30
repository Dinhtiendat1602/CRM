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
  Trash2,
} from 'lucide-react';
import adminApi from '../../api/adminApi';
import { useAuth } from '../../context/authContextDef';
import { useLanguage } from '../../context/LanguageContext';
import Pagination from '../../components/Common/Pagination';
import SearchInput from '../../components/Common/SearchInput';
import Modal from '../../components/Common/Modal';
import ConfirmDialog from '../../components/Common/ConfirmDialog';

export default function UserManagement() {
  const { isEn } = useLanguage();
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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // State xác nhận xóa user (SRS 2.1)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
            message: err?.message || (isEn ? 'Cannot load staff user list' : 'Không thể tải danh sách người dùng'),
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pagination.page, searchTerm, selectedRole, selectedStatus, reloadKey, isEn]);

  // Xử lý tạo nhân viên mới
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError(null);

    if (!createUserForm.username.trim() || !createUserForm.full_name.trim() || !createUserForm.email.trim()) {
      setCreateError(isEn ? 'Please fill in all required fields (*)' : 'Vui lòng điền đầy đủ các trường bắt buộc (*)');
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
        message: isEn ? `Created account "${createUserForm.username}" successfully! Default password: 11111111` : `Tạo tài khoản "${createUserForm.username}" thành công! Mật khẩu khởi tạo: 11111111`,
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
      setCreateError(err?.message || (isEn ? 'Cannot create staff account' : 'Không thể tạo tài khoản nhân viên'));
    } finally {
      setCreateLoading(false);
    }
  };

  // Mở confirm toggle trạng thái Active / De-active
  const promptToggleStatus = (u) => {
    if (u.id === currentUser?.id) {
      setAlertInfo({
        type: 'error',
        message: isEn ? 'You cannot deactivate your own administrator account!' : 'Bạn không thể tự vô hiệu hóa tài khoản quản trị viên của chính mình!',
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
        message: isEn ? `${newStatus ? 'Activated' : 'Locked'} account ${userToToggleStatus.username} successfully!` : `${newStatus ? 'Kích hoạt' : 'Khóa'} tài khoản ${userToToggleStatus.username} thành công!`,
      });
      setConfirmStatusOpen(false);
      setUserToToggleStatus(null);
      setLoading(true);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setAlertInfo({
        type: 'error',
        message: err?.message || (isEn ? 'Cannot update account status' : 'Không thể cập nhật trạng thái tài khoản'),
      });
    } finally {
      setStatusLoading(false);
    }
  };

  // Mở modal xác nhận xóa tài khoản nhân viên (SRS 2.1)
  const promptDeleteUser = (u) => {
    if (u.id === currentUser?.id) {
      setAlertInfo({
        type: 'error',
        message: isEn ? 'You cannot delete your own administrator account.' : 'Bạn không thể tự xóa tài khoản quản trị của chính mình.',
      });
      return;
    }
    if (u.username?.toLowerCase() === 'admin') {
      setAlertInfo({
        type: 'error',
        message: isEn ? 'Cannot delete system default administrator account (admin).' : 'Không thể xóa tài khoản Quản trị viên hệ thống mặc định (admin).',
      });
      return;
    }
    setUserToDelete(u);
    setConfirmDeleteOpen(true);
  };

  // Xác nhận thực hiện xóa tài khoản
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);
    try {
      await adminApi.deleteUser(userToDelete.id);
      setAlertInfo({
        type: 'success',
        message: isEn ? `Deleted account "${userToDelete.full_name || userToDelete.username}" (@${userToDelete.username}) successfully!` : `Đã xóa tài khoản "${userToDelete.full_name || userToDelete.username}" (@${userToDelete.username}) thành công!`,
      });
      setConfirmDeleteOpen(false);
      setUserToDelete(null);
      setLoading(true);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setAlertInfo({
        type: 'error',
        message: err?.message || (isEn ? 'Cannot delete staff account' : 'Không thể xóa tài khoản người dùng'),
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Đổi role trực tiếp trên dropdown của dòng
  const handleChangeRole = async (targetUser, newRoleId) => {
    try {
      await adminApi.updateUserRole(targetUser.id, parseInt(newRoleId, 10));
      setAlertInfo({
        type: 'success',
        message: isEn ? `Updated role for ${targetUser.username}` : `Đã cập nhật vai trò cho ${targetUser.username}`,
      });
      setLoading(true);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setAlertInfo({
        type: 'error',
        message: err?.message || (isEn ? 'Cannot update role' : 'Không thể cập nhật vai trò'),
      });
    }
  };

  // Xử lý Reset Mật khẩu cho nhân viên (SRS 2.1)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPwForm.newPassword || resetPwForm.newPassword.length < 8) {
      setResetPwError(isEn ? 'New password must be at least 8 characters' : 'Mật khẩu mới phải có tối thiểu 8 ký tự');
      return;
    }

    setResetPwLoading(true);
    setResetPwError(null);
    try {
      await adminApi.resetUserPassword(selectedUserForReset.id, resetPwForm.newPassword);
      setAlertInfo({
        type: 'success',
        message: isEn ? `Reset password successfully for ${selectedUserForReset.username}!` : `Đã đặt lại mật khẩu thành công cho ${selectedUserForReset.username}!`,
      });
      setResetPwModalOpen(false);
      setSelectedUserForReset(null);
      setResetPwForm({ newPassword: '' });
    } catch (err) {
      setResetPwError(err?.message || (isEn ? 'Cannot reset password' : 'Không thể đặt lại mật khẩu'));
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
        return 'bg-[#EAF5EC] text-[#2E7D32] border-[#DDF0E2]';
      case 'SALESMAN':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Nhãn hiển thị cho vai trò (SRS 2.1)
  const getRoleLabel = (roleName) => {
    switch (roleName) {
      case 'ADMIN':
        return isEn ? 'System Admin (ADMIN)' : 'Quản trị viên (ADMIN)';
      case 'SALE_MANAGER':
        return isEn ? 'Sales Manager (SALE_MANAGER)' : 'Quản lý bán hàng (SALE_MANAGER)';
      case 'SALESMAN':
        return isEn ? 'Salesman (SALESMAN)' : 'Nhân viên bán hàng (SALESMAN)';
      default:
        return roleName || (isEn ? 'Unassigned Role' : 'Chưa gán vai trò');
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
            {isEn ? 'Close' : 'Đóng'}
          </button>
        </div>
      )}

      {/* Top Action Bar (Không lặp lại tiêu đề vì đã có trên Header) */}
      <div className="flex items-center justify-between gap-4">
        <div className="text-xs text-[#6B7280]">
          {isEn ? 'Total:' : 'Tổng cộng:'} <strong className="text-[#1F2937]">{pagination.total}</strong> {isEn ? 'staff accounts' : 'tài khoản nhân sự'}
        </div>

        <div className="flex items-center gap-2.5 ml-auto">
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setReloadKey((k) => k + 1);
            }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-[#4B5563] text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            title={isEn ? 'Refresh list' : 'Làm mới danh sách'}
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#3CB371] ${loading ? 'animate-spin' : ''}`} />
            <span>{isEn ? 'Refresh' : 'Làm mới'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3CB371] hover:bg-[#38A169] active:bg-[#2E7D32] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>{isEn ? 'Add new staff' : 'Thêm nhân viên mới'}</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#DDF0E2] p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <SearchInput
          defaultValue={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          placeholder={isEn ? 'Search by username, full name or email...' : 'Tìm theo username, họ tên hoặc email...'}
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
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] cursor-pointer min-w-[170px]"
          >
            <option value="">{isEn ? 'All roles' : 'Tất cả vai trò'}</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {getRoleLabel(r.role_name || r.name)}
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
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] cursor-pointer"
          >
            <option value="">{isEn ? 'All statuses' : 'Tất cả trạng thái'}</option>
            <option value="true">{isEn ? 'Active' : 'Đang kích hoạt'}</option>
            <option value="false">{isEn ? 'Locked' : 'Đã khóa'}</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-white rounded-2xl border border-[#DDF0E2] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#F3F4F6] border-b border-[#DDF0E2] text-[#6B7280] uppercase text-[11px] font-semibold tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">{isEn ? 'Staff User' : 'Nhân viên'}</th>
                <th className="py-3.5 px-4">{isEn ? 'Contact' : 'Liên hệ'}</th>
                <th className="py-3.5 px-4">{isEn ? 'System Role' : 'Vai trò (Role)'}</th>
                <th className="py-3.5 px-4 text-center">{isEn ? 'Status' : 'Trạng thái'}</th>
                <th className="py-3.5 px-4">{isEn ? 'Created At' : 'Ngày tạo'}</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">{isEn ? 'Actions' : 'Thao tác'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-[#3CB371]" />
                    <span>{isEn ? 'Loading staff user list...' : 'Đang tải danh sách nhân viên...'}</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-[#6B7280]">
                    {isEn ? 'No staff user accounts match the current filter.' : 'Không tìm thấy tài khoản nhân viên nào phù hợp với bộ lọc.'}
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const initial = (u.full_name || u.username || 'U').charAt(0).toUpperCase();

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-[#EAF5EC]/40 transition-colors text-slate-700"
                    >
                      {/* Name & Username */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-[#3CB371] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs">
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-[#1F2937] flex items-center gap-1.5">
                              <span>{u.full_name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#EAF5EC] text-[#2E7D32] border border-[#DDF0E2]">
                                  {isEn ? 'You' : 'Bạn'}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-[#6B7280] font-mono">
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
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer min-w-[190px] shadow-2xs ${getRoleBadge(
                            u.role_name
                          )} disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                          {roles.map((r) => (
                            <option key={r.id} value={r.id} className="bg-white text-slate-900 font-medium py-1">
                              {getRoleLabel(r.role_name || r.name)}
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
                              ? (isEn ? 'Cannot lock your own account' : 'Không thể tự khóa tài khoản của bạn')
                              : u.is_active
                              ? (isEn ? 'Click to lock account' : 'Bấm để khóa tài khoản')
                              : (isEn ? 'Click to activate account' : 'Bấm để mở kích hoạt')
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
                              <span>{isEn ? 'Active' : 'Đang hoạt động'}</span>
                            </>
                          ) : (
                            <>
                              <UserX className="h-3.5 w-3.5 text-red-600" />
                              <span>{isEn ? 'Locked' : 'Đã khóa'}</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Created date */}
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap" title={formatDateTime(u.created_at)}>
                        {formatDateTime(u.created_at)}
                      </td>

                      {/* Actions: Reset Password & Delete User */}
                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserForReset(u);
                              setResetPwModalOpen(true);
                              setResetPwError(null);
                              setResetPwForm({ newPassword: '' });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium hover:bg-[#EAF5EC] hover:text-[#2E7D32] transition-colors cursor-pointer"
                            title={isEn ? 'Reset password directly' : 'Đặt lại mật khẩu trực tiếp'}
                          >
                            <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                            <span>{isEn ? 'Reset pass' : 'Reset pass'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => promptDeleteUser(u)}
                            disabled={isCurrent || u.username?.toLowerCase() === 'admin'}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title={
                              isCurrent
                                ? (isEn ? 'Cannot delete your own account' : 'Không thể xóa tài khoản của chính bạn')
                                : u.username?.toLowerCase() === 'admin'
                                ? (isEn ? 'Cannot delete default admin account' : 'Không thể xóa tài khoản admin mặc định')
                                : (isEn ? 'Delete staff account' : 'Xóa tài khoản nhân viên')
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                            <span>{isEn ? 'Delete' : 'Xóa'}</span>
                          </button>
                        </div>
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
        title={isEn ? 'Add New Staff' : 'Thêm nhân viên mới'}
        subtitle={isEn ? 'Administrator creates a staff account and assigns initial role' : 'Quản trị viên tạo tài khoản nhân viên và gán vai trò ban đầu'}
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {createError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div className="p-3 bg-[#EAF5EC] border border-[#DDF0E2] rounded-xl text-xs text-[#2E7D32] flex items-start gap-2">
            <Shield className="h-4 w-4 text-[#3CB371] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">{isEn ? 'Automatic Default Password:' : 'Mật khẩu khởi tạo tự động:'}</span> {isEn ? 'Every new account is assigned default password' : 'Mọi tài khoản mới được gán mật khẩu mặc định là'} <code className="bg-white px-1.5 py-0.5 rounded border border-[#DDF0E2] font-mono font-bold">11111111</code>. {isEn ? 'Staff can change it after signing in.' : 'Nhân viên có thể tự đổi sau khi đăng nhập.'}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {isEn ? 'Username' : 'Tài khoản (Username)'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={createUserForm.username}
                onChange={(e) => setCreateUserForm({ ...createUserForm, username: e.target.value })}
                placeholder={isEn ? 'e.g. sales01' : 'vd: sales01'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] focus:bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {isEn ? 'Full Name' : 'Họ và tên'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={createUserForm.full_name}
                onChange={(e) => setCreateUserForm({ ...createUserForm, full_name: e.target.value })}
                placeholder={isEn ? 'e.g. John Doe' : 'vd: Nguyễn Văn A'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] focus:bg-white text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {isEn ? 'Work Email' : 'Email công việc'} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={createUserForm.email}
                onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                placeholder="name@company.com"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] focus:bg-white text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {isEn ? 'Phone Number' : 'Số điện thoại'}
              </label>
              <input
                type="tel"
                value={createUserForm.phone}
                onChange={(e) => setCreateUserForm({ ...createUserForm, phone: e.target.value })}
                placeholder={isEn ? 'e.g. 0912345678' : 'vd: 0912345678'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] focus:bg-white text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {isEn ? 'Initial Role' : 'Vai trò ban đầu (Role)'} <span className="text-red-500">*</span>
            </label>
            <select
              value={createUserForm.role_id}
              onChange={(e) => setCreateUserForm({ ...createUserForm, role_id: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] focus:bg-white text-slate-900 cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {getRoleLabel(r.role_name || r.name)} — {r.description || (isEn ? 'System permission' : 'Quyền hạn hệ thống')}
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
              {isEn ? 'Cancel' : 'Hủy bỏ'}
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-4 py-2 rounded-xl bg-[#3CB371] hover:bg-[#38A169] active:bg-[#2E7D32] text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {createLoading ? (isEn ? 'Creating...' : 'Đang tạo...') : (isEn ? 'Create Account' : 'Tạo tài khoản')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Đặt lại mật khẩu trực tiếp cho nhân viên */}
      <Modal
        isOpen={resetPwModalOpen}
        onClose={() => setResetPwModalOpen(false)}
        title={isEn ? `Reset Password for ${selectedUserForReset?.username || ''}` : `Đặt lại mật khẩu cho ${selectedUserForReset?.username || ''}`}
        subtitle={isEn ? 'Administrator resets password directly when staff forgets credentials' : 'Quản trị viên can thiệp đặt lại mật khẩu trực tiếp khi nhân viên quên mật khẩu'}
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
              {isEn ? 'New Password (Minimum 8 characters)' : 'Mật khẩu mới (Tối thiểu 8 ký tự)'} <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              required
              value={resetPwForm.newPassword}
              onChange={(e) => setResetPwForm({ newPassword: e.target.value })}
              placeholder={isEn ? 'Enter new password...' : 'Nhập mật khẩu mới...'}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#3CB371]/20 focus:border-[#3CB371] focus:bg-white text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setResetPwModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              {isEn ? 'Cancel' : 'Hủy'}
            </button>
            <button
              type="submit"
              disabled={resetPwLoading}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {resetPwLoading ? (isEn ? 'Updating...' : 'Đang cập nhật...') : (isEn ? 'Confirm Password Reset' : 'Xác nhận đặt lại mật khẩu')}
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
        title={
          userToToggleStatus?.is_active
            ? (isEn ? 'Lock Staff Account' : 'Khóa tài khoản nhân viên')
            : (isEn ? 'Reactivate Account' : 'Kích hoạt lại tài khoản')
        }
        message={
          userToToggleStatus?.is_active
            ? (isEn
                ? `Are you sure you want to lock account "${userToToggleStatus?.username}"? This staff member will not be able to log in to Zen CRM until reactivated.`
                : `Bạn có chắc chắn muốn khóa tài khoản "${userToToggleStatus?.username}"? Nhân viên này sẽ không thể đăng nhập vào hệ thống Zen CRM cho đến khi được kích hoạt lại.`)
            : (isEn
                ? `Do you want to re-enable access for account "${userToToggleStatus?.username}"?`
                : `Bạn có muốn mở lại quyền truy cập cho tài khoản "${userToToggleStatus?.username}"?`)
        }
        confirmText={
          userToToggleStatus?.is_active
            ? (isEn ? 'Lock Account' : 'Khóa tài khoản')
            : (isEn ? 'Activate Now' : 'Kích hoạt ngay')
        }
        cancelText={isEn ? 'Cancel' : 'Hủy'}
        isDangerous={userToToggleStatus?.is_active}
      />

      {/* Confirm Dialog: Xóa vĩnh viễn tài khoản nhân viên (SRS 2.1) */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => {
          if (!deleteLoading) {
            setConfirmDeleteOpen(false);
            setUserToDelete(null);
          }
        }}
        onConfirm={handleConfirmDeleteUser}
        loading={deleteLoading}
        title={isEn ? 'Confirm Delete Staff Account' : 'Xác nhận xóa tài khoản nhân viên'}
        message={
          userToDelete
            ? (isEn
                ? `Are you sure you want to permanently delete account "${userToDelete.full_name || userToDelete.username}" (@${userToDelete.username}) from Zen CRM? This action cannot be undone.`
                : `Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${userToDelete.full_name || userToDelete.username}" (@${userToDelete.username}) khỏi hệ thống Zen CRM? Thao tác này không thể hoàn tác.`)
            : ''
        }
        confirmText={isEn ? 'Confirm Delete' : 'Xác nhận xóa'}
        cancelText={isEn ? 'Cancel' : 'Hủy bỏ'}
        isDangerous={true}
      />
    </div>
  );
}
