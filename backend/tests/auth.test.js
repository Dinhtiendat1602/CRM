const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

test.after(async () => {
  await pool.end();
});

test('POST /api/auth/login - Should fail when fields are missing', async () => {
  const res = await request(app).post('/api/auth/login').send({ username: 'admin' });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
});

test('POST /api/auth/login - Should fail with incorrect password', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'wrongpassword' });
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, 'Tên đăng nhập hoặc mật khẩu không chính xác.');
});

test('POST /api/auth/login - Should fail with non-existent user', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'non_existent_user', password: '11111111' });
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
});

test('POST /api/auth/login - Should succeed with Admin credentials and return JWT with ADMIN role', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: '11111111' });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.token, 'Token must be present in response');
  assert.strictEqual(res.body.data.user.username, 'admin');
  assert.strictEqual(res.body.data.user.role, 'ADMIN');
});

test('POST /api/auth/login - Should succeed with Salesman credentials', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'salesman', password: '11111111' });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.user.role, 'SALESMAN');
});

test('POST /api/auth/login - Should succeed with Email identifier', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'manager@zencrm.com', password: '11111111' });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.user.role, 'SALE_MANAGER');
});

test('GET /api/auth/me - Should reject unauthenticated requests', async () => {
  const res = await request(app).get('/api/auth/me');
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
});

test('GET /api/auth/me - Should reject invalid/tampered token', async () => {
  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', 'Bearer invalid.token.payload');
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
});

test('GET /api/auth/me - Should return profile for authenticated user', async () => {
  // Login first as admin
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: '11111111' });
  const token = loginRes.body.data.token;

  const profileRes = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${token}`);

  assert.strictEqual(profileRes.status, 200);
  assert.strictEqual(profileRes.body.success, true);
  assert.strictEqual(profileRes.body.data.username, 'admin');
  assert.strictEqual(profileRes.body.data.role, 'ADMIN');
  assert.strictEqual(profileRes.body.data.password_hash, undefined, 'password_hash should never be exposed');
});

test('PUT /api/auth/profile - Should update profile information', async () => {
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'salesman', password: '11111111' });
  const token = loginRes.body.data.token;

  const updateRes = await request(app)
    .put('/api/auth/profile')
    .set('Authorization', `Bearer ${token}`)
    .send({ full_name: 'Tran Thi Salesman Updated', phone: '0909999888' });

  assert.strictEqual(updateRes.status, 200);
  assert.strictEqual(updateRes.body.success, true);
  assert.strictEqual(updateRes.body.data.full_name, 'Tran Thi Salesman Updated');
  assert.strictEqual(updateRes.body.data.phone, '0909999888');
});

test('RBAC Authorization: Admin can access /api/auth/test-role-admin', async () => {
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: '11111111' });
  const adminToken = adminLogin.body.data.token;

  const res = await request(app)
    .get('/api/auth/test-role-admin')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
});

test('RBAC Authorization: Salesman is blocked (403 Forbidden) from /api/auth/test-role-admin', async () => {
  const salesLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'salesman', password: '11111111' });
  const salesToken = salesLogin.body.data.token;

  const res = await request(app)
    .get('/api/auth/test-role-admin')
    .set('Authorization', `Bearer ${salesToken}`);

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, 'Bạn không có quyền thực hiện thao tác này.');
});
