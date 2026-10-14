const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const { pool } = require('../src/config/db');

const FP_TEST_USER = 'test_fp_user';
const FP_TEST_EMAIL = 'test_fp_user@zencrm.com';
const INITIAL_PASS = 'initialPass123';

test.before(async () => {
  // Tạo tài khoản test chuyên biệt cho kiểm thử forgot-password
  const hash = await bcrypt.hash(INITIAL_PASS, 10);
  await pool.query(
    `INSERT INTO users (username, email, password_hash, full_name, phone, role_id, is_active)
     VALUES ($1, $2, $3, 'Test Forgot Password User', '0999999999', 2, true)
     ON CONFLICT (username) DO UPDATE SET email = $2, password_hash = $3, is_active = true`,
    [FP_TEST_USER, FP_TEST_EMAIL, hash]
  );
});

test.after(async () => {
  // Dọn dẹp tài khoản test
  await pool.query('DELETE FROM users WHERE username = $1', [FP_TEST_USER]);
  await pool.end();
});

test('POST /api/auth/forgot-password - Should fail with missing or invalid email', async () => {
  const res1 = await request(app).post('/api/auth/forgot-password').send({});
  assert.strictEqual(res1.status, 400);
  assert.strictEqual(res1.body.success, false);

  const res2 = await request(app).post('/api/auth/forgot-password').send({ email: 'not-an-email' });
  assert.strictEqual(res2.status, 400);
  assert.strictEqual(res2.body.success, false);
});

test('POST /api/auth/forgot-password - Should return 404 for non-existent email', async () => {
  const res = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'doesnotexist@zencrm.com' });

  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.message, 'Email không tồn tại trong hệ thống.');
});

test('POST /api/auth/forgot-password - Should generate reset token and update DB for existing email', async () => {
  const res = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: FP_TEST_EMAIL });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);

  // Verify in PostgreSQL database
  const dbUser = await pool.query(
    'SELECT reset_password_token, reset_password_expires FROM users WHERE email = $1',
    [FP_TEST_EMAIL]
  );
  assert.strictEqual(dbUser.rows.length, 1);
  assert.ok(dbUser.rows[0].reset_password_token, 'reset_password_token must exist in DB');
  assert.ok(new Date(dbUser.rows[0].reset_password_expires) > new Date());
});

test('GET /api/auth/verify-reset-token/:token - Should validate correct token', async () => {
  const dbUser = await pool.query(
    'SELECT reset_password_token FROM users WHERE email = $1',
    [FP_TEST_EMAIL]
  );
  const token = dbUser.rows[0].reset_password_token;

  const validRes = await request(app).get(`/api/auth/verify-reset-token/${token}`);
  assert.strictEqual(validRes.status, 200);
  assert.strictEqual(validRes.body.success, true);
  assert.strictEqual(validRes.body.data.email, FP_TEST_EMAIL);

  const invalidRes = await request(app).get('/api/auth/verify-reset-token/randomfakeinvalidtoken');
  assert.strictEqual(invalidRes.status, 400);
  assert.strictEqual(invalidRes.body.success, false);
});

test('POST /api/auth/reset-password - Should fail with short password (< 6 chars)', async () => {
  const res = await request(app)
    .post('/api/auth/reset-password')
    .send({ token: 'anytoken', new_password: '123' });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
});

test('POST /api/auth/reset-password - Should update password, revoke token, and allow login with new password', async () => {
  const newPassword = 'newSecretPassword2026';

  // 1. Get current valid token
  const dbUser = await pool.query(
    'SELECT reset_password_token FROM users WHERE email = $1',
    [FP_TEST_EMAIL]
  );
  const token = dbUser.rows[0].reset_password_token;
  assert.ok(token);

  // 2. Reset password
  const resetRes = await request(app)
    .post('/api/auth/reset-password')
    .send({ token, new_password: newPassword });

  assert.strictEqual(resetRes.status, 200);
  assert.strictEqual(resetRes.body.success, true);

  // 3. Token must be cleared in DB (single-use)
  const afterResetUser = await pool.query(
    'SELECT reset_password_token, reset_password_expires FROM users WHERE email = $1',
    [FP_TEST_EMAIL]
  );
  assert.strictEqual(afterResetUser.rows[0].reset_password_token, null);
  assert.strictEqual(afterResetUser.rows[0].reset_password_expires, null);

  // 4. Old password should fail
  const oldLoginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: FP_TEST_USER, password: INITIAL_PASS });
  assert.strictEqual(oldLoginRes.status, 401);

  // 5. New password should succeed
  const newLoginRes = await request(app)
    .post('/api/auth/login')
    .send({ username: FP_TEST_USER, password: newPassword });
  assert.strictEqual(newLoginRes.status, 200);
  assert.strictEqual(newLoginRes.body.success, true);

  // 6. Reuse of same token must be rejected
  const reuseRes = await request(app)
    .post('/api/auth/reset-password')
    .send({ token, new_password: 'anotherPassword' });
  assert.strictEqual(reuseRes.status, 400);
});
