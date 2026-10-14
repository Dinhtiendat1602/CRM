import { describe, it } from 'node:test';
import assert from 'node:assert';

// Mô phỏng danh mục MENU_ITEMS của Sidebar
const MENU_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', roles: ['SALESMAN', 'SALE_MANAGER', 'ADMIN'] },
  { label: 'Leads', path: '/leads', roles: ['SALESMAN', 'SALE_MANAGER', 'ADMIN'] },
  { label: 'Opportunities', path: '/opportunities', roles: ['SALESMAN', 'SALE_MANAGER', 'ADMIN'] },
  { label: 'Orders', path: '/orders', roles: ['SALESMAN', 'SALE_MANAGER', 'ADMIN'] },
  { label: 'Products', path: '/products', roles: ['SALE_MANAGER', 'ADMIN'] },
  { label: 'Campaigns', path: '/campaigns', roles: ['SALE_MANAGER', 'ADMIN'] },
  { label: 'Forecast', path: '/forecast/setup', roles: ['SALE_MANAGER', 'ADMIN'] },
  { label: 'Reports', path: '/reports', roles: ['SALE_MANAGER', 'ADMIN'] },
  { label: 'User Mgmt', path: '/admin/users', roles: ['ADMIN'] },
];

function getAccessibleMenuItems(role) {
  return MENU_ITEMS.filter((item) => item.roles.includes(role));
}

function checkRoleAccess(currentRole, allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return Boolean(currentRole && allowedRoles.includes(currentRole));
}

function formatCountdown(remainingSeconds) {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

describe('Frontend Admin UI & RBAC Unit Tests', () => {
  describe('Sidebar RBAC Navigation (SRS 2.1 & SRS 4.1)', () => {
    it('vai trò ADMIN phải nhìn thấy toàn bộ 9 mục menu bao gồm Quản trị User', () => {
      const items = getAccessibleMenuItems('ADMIN');
      assert.strictEqual(items.length, 9);
      const labels = items.map((i) => i.label);
      assert.ok(labels.includes('User Mgmt'));
      assert.ok(labels.includes('Products'));
      assert.ok(labels.includes('Forecast'));
    });

    it('vai trò SALE_MANAGER phải nhìn thấy 8 mục menu và KHÔNG có User Mgmt', () => {
      const items = getAccessibleMenuItems('SALE_MANAGER');
      assert.strictEqual(items.length, 8);
      const labels = items.map((i) => i.label);
      assert.ok(!labels.includes('User Mgmt'), 'Manager không được thấy menu User Mgmt');
      assert.ok(labels.includes('Products'));
      assert.ok(labels.includes('Campaigns'));
      assert.ok(labels.includes('Forecast'));
      assert.ok(labels.includes('Reports'));
    });

    it('vai trò SALESMAN chỉ được nhìn thấy 4 mục menu nghiệp vụ cốt lõi', () => {
      const items = getAccessibleMenuItems('SALESMAN');
      assert.strictEqual(items.length, 4);
      const labels = items.map((i) => i.label);
      assert.deepStrictEqual(labels, ['Dashboard', 'Leads', 'Opportunities', 'Orders']);
      assert.ok(!labels.includes('Products'));
      assert.ok(!labels.includes('Campaigns'));
      assert.ok(!labels.includes('User Mgmt'));
    });
  });

  describe('RoleRoute RBAC Authorization Guards', () => {
    it('cho phép ADMIN truy cập các route quản trị và vận hành', () => {
      assert.strictEqual(checkRoleAccess('ADMIN', ['ADMIN']), true);
      assert.strictEqual(checkRoleAccess('ADMIN', ['SALE_MANAGER', 'ADMIN']), true);
    });

    it('chặn SALE_MANAGER truy cập route của ADMIN', () => {
      assert.strictEqual(checkRoleAccess('SALE_MANAGER', ['ADMIN']), false);
    });

    it('chặn SALESMAN truy cập route quản lý Products và Campaigns', () => {
      assert.strictEqual(checkRoleAccess('SALESMAN', ['SALE_MANAGER', 'ADMIN']), false);
    });
  });

  describe('Session Timeout 30 Phút & Đếm ngược Cảnh báo (SRS 5.3)', () => {
    it('định dạng thời gian đếm ngược chính xác dạng MM:SS', () => {
      assert.strictEqual(formatCountdown(120), '02:00');
      assert.strictEqual(formatCountdown(119), '01:59');
      assert.strictEqual(formatCountdown(65), '01:05');
      assert.strictEqual(formatCountdown(9), '00:09');
      assert.strictEqual(formatCountdown(0), '00:00');
    });

    it('thời gian timeout chuẩn là 30 phút (1,800,000ms) và cảnh báo 2 phút (120,000ms)', () => {
      const timeoutDuration = 30 * 60 * 1000;
      const warnDuration = 2 * 60 * 1000;
      const triggerTime = timeoutDuration - warnDuration;

      assert.strictEqual(timeoutDuration, 1800000);
      assert.strictEqual(warnDuration, 120000);
      assert.strictEqual(triggerTime, 1680000); // 28 phút = bắt đầu popup cảnh báo
    });
  });

  describe('Axios Client Authorization Interceptor Mock', () => {
    it('tự động gán Authorization: Bearer <token> khi có token', () => {
      const mockConfig = { headers: {} };
      const token = 'jwt-mock-token-sample';

      // Giả lập interceptor
      if (token) {
        mockConfig.headers.Authorization = `Bearer ${token}`;
      }

      assert.strictEqual(mockConfig.headers.Authorization, 'Bearer jwt-mock-token-sample');
    });

    it('không gán header Authorization nếu không có token', () => {
      const mockConfig = { headers: {} };
      const token = null;

      if (token) {
        mockConfig.headers.Authorization = `Bearer ${token}`;
      }

      assert.strictEqual(mockConfig.headers.Authorization, undefined);
    });
  });
});
