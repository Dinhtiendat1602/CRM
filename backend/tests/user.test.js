const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

let adminToken;
let salesmanToken;

test.before(async () => {
  // Login as admin
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: '11111111' });
  adminToken = adminRes.body.data.token;

  // Login as salesman
  const salesRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'salesman', password: '11111111' });
  salesmanToken = salesRes.body.data.token;
});

test.after(async () => {
  // Clean up any test users created during testing
  await pool.query("DELETE FROM users WHERE username LIKE 'test_user_%';");
  await pool.end();
});

test('RBAC: Non-admin users cannot access GET /api/admin/users (403 Forbidden)', async () => {
  const res = await request(app)
    .get('/api/admin/users')
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.success, false);
});

test('RBAC: Unauthenticated requests cannot access GET /api/admin/users (401 Unauthorized)', async () => {
  const res = await request(app).get('/api/admin/users');
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
});

test('GET /api/admin/roles - Admin gets all system roles', async () => {
  const res = await request(app)
    .get('/api/admin/roles')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.strictEqual(res.body.data.length, 3);
  const roleNames = res.body.data.map((r) => r.name);
  assert.ok(roleNames.includes('ADMIN'));
  assert.ok(roleNames.includes('SALE_MANAGER'));
  assert.ok(roleNames.includes('SALESMAN'));
});

test('GET /api/admin/users - Admin gets paginated users with role names', async () => {
  const res = await request(app)
    .get('/api/admin/users?page=1&limit=10')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.pagination);
  assert.strictEqual(res.body.pagination.currentPage, 1);
  assert.ok(res.body.pagination.totalRecords >= 3);

  // Each user has role_name
  for (const u of res.body.data) {
    assert.ok(u.role_name);
    assert.strictEqual(u.password_hash, undefined);
  }
});

test('GET /api/admin/users - Admin searches users by keyword', async () => {
  const res = await request(app)
    .get('/api/admin/users?search=manager')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.some((u) => u.username === 'manager'));
});

test('POST /api/admin/users - Should fail with missing required fields', async () => {
  const res = await request(app)
    .post('/api/admin/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ username: 'incomplete' });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
});

test('POST /api/admin/users - Should fail with invalid role_id', async () => {
  const res = await request(app)
    .post('/api/admin/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      username: 'test_user_invalid_role',
      email: 'invalidrole@example.com',
      full_name: 'Test Invalid Role',
      role_id: 9999,
    });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
});

test('POST /api/admin/users - Admin creates new user and newly created user can log in', async () => {
  const newUser = {
    username: 'test_user_staff1',
    email: 'test_user_staff1@zencrm.com',
    full_name: 'Staff Test One',
    phone: '0912345678',
    role_id: 3, // SALESMAN
    password: 'staffPassword123',
  };

  const createRes = await request(app)
    .post('/api/admin/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(newUser);

  assert.strictEqual(createRes.status, 201);
  assert.strictEqual(createRes.body.success, true);
  assert.strictEqual(createRes.body.data.username, newUser.username);
  assert.strictEqual(createRes.body.data.role_name, 'SALESMAN');
  assert.strictEqual(createRes.body.data.password_hash, undefined);

  // New user can immediately log in
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: newUser.username, password: newUser.password });

  assert.strictEqual(loginRes.status, 200);
  assert.strictEqual(loginRes.body.data.user.role, 'SALESMAN');
});

test('POST /api/admin/users - Should reject duplicate username or email (409 Conflict)', async () => {
  const res = await request(app)
    .post('/api/admin/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      username: 'test_user_staff1', // already created above
      email: 'unique_new_email@zencrm.com',
      full_name: 'Duplicate Staff',
      role_id: 3,
    });

  assert.strictEqual(res.status, 409);
  assert.strictEqual(res.body.success, false);
});

test('PATCH /api/admin/users/:id/status - Toggle active/inactive and verify login block', async () => {
  // Find id of test_user_staff1
  const findRes = await pool.query("SELECT id FROM users WHERE username = 'test_user_staff1'");
  const targetId = findRes.rows[0].id;

  // 1. Deactivate user
  const deactRes = await request(app)
    .patch(`/api/admin/users/${targetId}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ is_active: false });

  assert.strictEqual(deactRes.status, 200);
  assert.strictEqual(deactRes.body.data.is_active, false);

  // 2. User cannot log in when inactive
  const blockedLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'test_user_staff1', password: 'staffPassword123' });
  assert.strictEqual(blockedLogin.status, 403);

  // 3. Reactivate user
  const reactRes = await request(app)
    .patch(`/api/admin/users/${targetId}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ is_active: true });

  assert.strictEqual(reactRes.status, 200);
  assert.strictEqual(reactRes.body.data.is_active, true);

  // 4. User can log in again
  const allowedLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'test_user_staff1', password: 'staffPassword123' });
  assert.strictEqual(allowedLogin.status, 200);
});

test('PATCH /api/admin/users/:id/status - Admin cannot deactivate their own account', async () => {
  const adminQuery = await pool.query("SELECT id FROM users WHERE username = 'admin'");
  const adminId = adminQuery.rows[0].id;

  const res = await request(app)
    .patch(`/api/admin/users/${adminId}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ is_active: false });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
});

test('PATCH /api/admin/users/:id/role - Admin assigns user role', async () => {
  const findRes = await pool.query("SELECT id FROM users WHERE username = 'test_user_staff1'");
  const targetId = findRes.rows[0].id;

  // Change from SALESMAN (3) to SALE_MANAGER (2)
  const roleRes = await request(app)
    .patch(`/api/admin/users/${targetId}/role`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ role_id: 2 });

  assert.strictEqual(roleRes.status, 200);
  assert.strictEqual(roleRes.body.data.role_name, 'SALE_MANAGER');

  // Verify login token has new role
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'test_user_staff1', password: 'staffPassword123' });
  assert.strictEqual(loginRes.body.data.user.role, 'SALE_MANAGER');
});

test('POST /api/admin/users/:id/reset-password - Admin resets staff password directly', async () => {
  const findRes = await pool.query("SELECT id FROM users WHERE username = 'test_user_staff1'");
  const targetId = findRes.rows[0].id;
  const newDirectPassword = 'newDirectAdminPass2026';

  const resetRes = await request(app)
    .post(`/api/admin/users/${targetId}/reset-password`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ new_password: newDirectPassword });

  assert.strictEqual(resetRes.status, 200);
  assert.strictEqual(resetRes.body.success, true);

  // Staff logs in with reset password
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'test_user_staff1', password: newDirectPassword });
  assert.strictEqual(loginRes.status, 200);
  assert.strictEqual(loginRes.body.success, true);
});
