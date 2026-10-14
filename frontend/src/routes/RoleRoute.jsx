import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/authContextDef';

/**
 * RoleRoute Component (RBAC Route Guard)
 * Chặn truy cập người dùng không đủ quyền hạn vai trò, chuyển hướng về /403
 * 
 * @param {Object} props
 * @param {string[]} props.allowedRoles - Danh sách mã vai trò được phép (ví dụ ['ADMIN', 'SALE_MANAGER'])
 */
export default function RoleRoute({ allowedRoles = [] }) {
  const { user, role } = useAuth();

  const currentRole = role || user?.role_name || user?.role;

  // Nếu không chỉ định allowedRoles hoặc currentRole nằm trong danh sách cho phép
  if (!allowedRoles.length || (currentRole && allowedRoles.includes(currentRole))) {
    return <Outlet />;
  }

  // Nếu không đủ thẩm quyền, chuyển hướng tới trang 403 Forbidden
  return <Navigate to="/403" replace />;
}
