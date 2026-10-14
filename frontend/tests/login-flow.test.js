import { describe, it } from 'node:test';
import assert from 'node:assert';

const BACKEND_URL = 'http://localhost:8888/api';

describe('End-to-End Login Flow & RBAC Integration Tests', () => {
  it('1. Đăng nhập sai mật khẩu -> trả về HTTP 401 và thông báo lỗi rõ ràng', async () => {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin1', password: 'wrongpassword' }),
    });

    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.message.includes('không chính xác'));
  });

  it('2. Đăng nhập Admin thành công -> nhận JWT Token và quyền ADMIN', async () => {
    let res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin1', password: '11111111' }),
    });
    if (res.status !== 200) {
      res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: '11111111' }),
      });
    }

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.token, 'Phải có JWT Token');
    assert.strictEqual(body.data.user.role, 'ADMIN');

    // Dùng token vừa nhận để truy cập API bảo vệ /api/auth/me
    const meRes = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${body.data.token}` },
    });
    assert.strictEqual(meRes.status, 200);
    const meBody = await meRes.json();
    assert.strictEqual(meBody.data.role_name, 'ADMIN');

    // Admin có quyền truy cập /api/admin/users
    const adminUsersRes = await fetch(`${BACKEND_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${body.data.token}` },
    });
    assert.strictEqual(adminUsersRes.status, 200);
  });

  it('3. Đăng nhập Salesman thành công -> nhận role SALESMAN và bị chặn các route Admin (403)', async () => {
    let res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'sale1', password: '11111111' }),
    });
    if (res.status !== 200) {
      res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'salesman', password: '11111111' }),
      });
    }

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.user.role, 'SALESMAN');

    // Salesman truy cập /api/admin/users phải bị chặn 403 Forbidden theo RBAC
    const adminUsersRes = await fetch(`${BACKEND_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${body.data.token}` },
    });
    assert.strictEqual(adminUsersRes.status, 403);
  });

  it('4. Đăng nhập Manager thành công -> nhận role SALE_MANAGER', async () => {
    let res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'manager1', password: '22222222' }),
    });
    if (res.status !== 200) {
      res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'manager', password: '11111111' }),
      });
    }

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.user.role, 'SALE_MANAGER');
  });

  it('5. Từ chối truy cập khi không có Bearer Token (HTTP 401)', async () => {
    const res = await fetch(`${BACKEND_URL}/auth/me`);
    assert.strictEqual(res.status, 401);
  });
});
