import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/authContextDef';

/**
 * PrivateRoute Component
 * Chặn truy cập người dùng chưa đăng nhập, tự động chuyển hướng về /login
 */
export default function PrivateRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
