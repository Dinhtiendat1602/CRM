const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { getAdminToken, getSalesmanToken } = require('./helpers/test-auth');

let adminToken;
let salesmanToken;
let managerToken;

test.before(async () => {
  adminToken = await getAdminToken(app);
  salesmanToken = await getSalesmanToken(app);

  const mgrRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'manager', password: '11111111' });
  managerToken = mgrRes.body.data?.token;
});

test('GET /api/dashboard/stats - Chặn truy cập unauthenticated (HTTP 401)', async () => {
  const res = await request(app).get('/api/dashboard/stats');
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.success, false);
});

test('GET /api/dashboard/stats - Admin trích xuất toàn bộ dữ liệu thực tế từ database', async () => {
  const res = await request(app)
    .get('/api/dashboard/stats')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.summary);
  assert.ok(res.body.data.summary.leadsCount >= 20);
  assert.ok(res.body.data.summary.oppsCount >= 20);
  assert.ok(res.body.data.summary.ordersCount >= 20);
  assert.ok(res.body.data.summary.usersCount >= 20);
  assert.ok(res.body.data.summary.productsCount >= 20);

  assert.ok(Array.isArray(res.body.data.recentOrders));
  assert.ok(res.body.data.recentOrders.length >= 1);
  assert.ok(Array.isArray(res.body.data.recentOpportunities));
  assert.ok(res.body.data.recentOpportunities.length >= 1);
  assert.ok(Array.isArray(res.body.data.recentLeads));
  assert.ok(res.body.data.recentLeads.length >= 1);
  assert.ok(Array.isArray(res.body.data.recentUsers));
  assert.ok(res.body.data.recentUsers.length >= 1);
});

test('GET /api/dashboard/stats - Sale Manager trích xuất dữ liệu vận hành kinh doanh từ DB', async () => {
  assert.ok(managerToken, 'Cần token của Manager');
  const res = await request(app)
    .get('/api/dashboard/stats')
    .set('Authorization', `Bearer ${managerToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.summary.productsCount >= 20);
  assert.strictEqual(res.body.data.summary.categoriesCount, 5);
  assert.ok(res.body.data.summary.campaignsCount >= 18);
  assert.ok(res.body.data.summary.planCompletion);
  assert.strictEqual(res.body.data.recentUsers.length, 0); // Manager không xem danh sách user admin
});

test('GET /api/dashboard/stats - Salesman trích xuất dữ liệu cá nhân và hoạt động bán hàng', async () => {
  const res = await request(app)
    .get('/api/dashboard/stats')
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.personal);
  assert.strictEqual(typeof res.body.data.personal.myLeadsCount, 'number');
  assert.strictEqual(typeof res.body.data.personal.myOppsCount, 'number');
  assert.strictEqual(typeof res.body.data.personal.myOrdersCount, 'number');
});
