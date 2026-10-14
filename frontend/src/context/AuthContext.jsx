import { useState, useCallback } from 'react';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import { AuthContext } from './authContextDef';
import TimeoutWarning from '../components/TimeoutWarning';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  const login = useCallback((userData, jwtToken) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', jwtToken);
    setUser(userData);
    setToken(jwtToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }, []);

  // Xử lý khi hết hạn 30 phút không hoạt động (SRS 5.3)
  const handleTimeout = useCallback(() => {
    if (token) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
      alert('Phiên làm việc đã tự động kết thúc sau 30 phút không hoạt động (SRS 5.3). Vui lòng đăng nhập lại.');
      window.location.href = '/login';
    }
  }, [token]);

  // Hook theo dõi 30 phút bất hoạt (cảnh báo trước 2 phút)
  const { isWarning, remainingSeconds, resetTimer } = useIdleTimeout({
    onTimeout: handleTimeout,
    timeoutDuration: 30 * 60 * 1000, // 30 phút
    warnDuration: 2 * 60 * 1000,      // 2 phút đếm ngược
  });

  const stayLoggedIn = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const value = {
    user,
    token,
    role: user?.role_name || user?.role || null,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    stayLoggedIn,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Hiển thị modal cảnh báo Timeout khi người dùng đã đăng nhập */}
      {token && (
        <TimeoutWarning
          isOpen={isWarning}
          remainingSeconds={remainingSeconds}
          onStayLoggedIn={stayLoggedIn}
          onLogout={logout}
        />
      )}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
