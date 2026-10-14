import { useState } from 'react';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import { AuthContext } from './authContextDef';

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

  const login = (userData, jwtToken) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', jwtToken);
    setUser(userData);
    setToken(jwtToken);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  // SRS 5.3: Tự động logout sau 30 phút không tương tác
  useIdleTimeout(() => {
    if (token) {
      logout();
      alert('Phiên làm việc đã hết hạn sau 30 phút không hoạt động. Vui lòng đăng nhập lại.');
      window.location.href = '/login';
    }
  }, 30 * 60 * 1000);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
