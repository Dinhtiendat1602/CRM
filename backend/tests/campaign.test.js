const { test, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const { getAdminToken, getManagerToken, getSalesmanToken } = require('./helpers/test-auth');

let adminToken;
let managerToken;
let salesmanToken;

let createdCampaignIds = [];
let testCampaignId;
let testProductId;

before(async () => {
  adminToken = await getAdminToken(app);
  managerToken = await getManagerToken(app);
  salesmanToken = await getSalesmanToken(app);

  assert.ok(adminToken && managerToken && salesmanToken, 'Phải có đủ JWT token của cả 3 roles');

  // Lấy một sản phẩm mẫu có sẵn trong DB để test gán sản phẩm vào chiến dịch
  const prodRes = await pool.query('SELECT id, campaign_id FROM products ORDER BY id ASC LIMIT 1');
  assert.ok(prodRes.rows.length > 0, 'Cần ít nhất 1 sản phẩm mẫu trong DB');
  testProductId = prodRes.rows[0].id;
  originalCampaignId = prodRes.rows[0].campaign_id;
});

let originalCampaignId = null;

after(async () => {
  // Dọn dẹp chiến dịch test phát sinh
  if (createdCampaignIds.length > 0) {
    await pool.query('UPDATE products SET campaign_id = NULL WHERE campaign_id = ANY($1::int[])', [createdCampaignIds]);
    await pool.query('UPDATE leads SET campaign_id = NULL WHERE campaign_id = ANY($1::int[])', [createdCampaignIds]);
    await pool.query('DELETE FROM campaigns WHERE id = ANY($1::int[])', [createdCampaignIds]);
  }
  // Khôi phục lại campaign_id ban đầu của sản phẩm test
  if (testProductId) {
    await pool.query('UPDATE products SET campaign_id = $1 WHERE id = $2', [originalCampaignId, testProductId]);
  }
});

// 1. RBAC Security Tests (SRS 2.1)
test('RBAC: Chặn unauthenticated truy cập /api/campaigns và /api/reports (HTTP 401)', async () => {
  const cRes = await request(app).get('/api/campaigns');
  assert.strictEqual(cRes.status, 401);

  const rRes = await request(app).get('/api/reports/summary');
  assert.strictEqual(rRes.status, 401);
});

test('RBAC: Salesman bị chặn tạo/sửa/xóa chiến dịch và xem báo cáo (HTTP 403 Forbidden)', async () => {
  // Thử tạo chiến dịch
  const createRes = await request(app)
    .post('/api/campaigns')
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({
      name: 'Salesman Hack Campaign',
      start_date: '2026-11-01',
      end_date: '2026-11-30',
    });
  assert.strictEqual(createRes.status, 403);

  // Thử xem báo cáo tổng hợp
  const reportRes = await request(app)
    .get('/api/reports/summary')
    .set('Authorization', `Bearer ${salesmanToken}`);
  assert.strictEqual(reportRes.status, 403);

  // Thử xem báo cáo doanh thu
  const revRes = await request(app)
    .get('/api/reports/revenue')
    .set('Authorization', `Bearer ${salesmanToken}`);
  assert.strictEqual(revRes.status, 403);
});

test('RBAC: Salesman được phép xem danh sách chiến dịch để chọn khi tạo Lead (HTTP 200)', async () => {
  const res = await request(app)
    .get('/api/campaigns')
    .set('Authorization', `Bearer ${salesmanToken}`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
});

// 2. Campaign Validation & Creation (SRS 3.18)
test('POST /api/campaigns - Thất bại khi thiếu tên chiến dịch (HTTP 400)', async () => {
  const res = await request(app)
    .post('/api/campaigns')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      name: '   ',
      start_date: '2026-11-01',
      end_date: '2026-11-30',
    });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
});

test('POST /api/campaigns - Thất bại khi thiếu ngày hoặc ngày kết thúc < ngày bắt đầu (HTTP 400)', async () => {
  // Thiếu ngày
  const res1 = await request(app)
    .post('/api/campaigns')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      name: 'Chiến dịch Test Ngày',
      start_date: '',
      end_date: '',
    });
  assert.strictEqual(res1.status, 400);

  // Ngày kết thúc trước ngày bắt đầu
  const res2 = await request(app)
    .post('/api/campaigns')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      name: 'Chiến dịch Ngược Ngày',
      start_date: '2026-12-01',
      end_date: '2026-11-01',
    });
  assert.strictEqual(res2.status, 400);
  assert.ok(res2.body.message.includes('lớn hơn hoặc bằng ngày bắt đầu'));
});

test('POST /api/campaigns - Sale Manager tạo chiến dịch tiếp thị mới thành công (HTTP 201, SRS 3.18)', async () => {
  const res = await request(app)
    .post('/api/campaigns')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      name: 'Chiến Dịch Black Friday 2026',
      description: 'Giảm giá cực sốc nhân dịp cuối năm cho thiết bị điện tử',
      start_date: '2026-11-20',
      end_date: '2026-11-30',
      budget: 150000000,
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.id);
  assert.strictEqual(res.body.data.name, 'Chiến Dịch Black Friday 2026');
  assert.strictEqual(parseFloat(res.body.data.budget), 150000000);

  testCampaignId = res.body.data.id;
  createdCampaignIds.push(testCampaignId);
});

// 3. Campaign Listing, Search & Details (SRS 3.18, BR-03, BR-05)
test('GET /api/campaigns - Phân trang mặc định 20 dòng theo BR-03', async () => {
  const res = await request(app)
    .get('/api/campaigns')
    .set('Authorization', `Bearer ${managerToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.pagination.limit, 20);
  assert.ok(res.body.pagination.total >= 1);
});

test('GET /api/campaigns - Tìm kiếm theo tên chiến dịch', async () => {
  const res = await request(app)
    .get('/api/campaigns?search=Black%20Friday')
    .set('Authorization', `Bearer ${managerToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.length >= 1);
  assert.ok(res.body.data.some((c) => c.name.includes('Black Friday')));
});

test('GET /api/campaigns/:id - Lấy chi tiết chiến dịch', async () => {
  const res = await request(app)
    .get(`/api/campaigns/${testCampaignId}`)
    .set('Authorization', `Bearer ${managerToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.id, testCampaignId);
  assert.ok(Array.isArray(res.body.data.products));
  assert.ok(typeof res.body.data.leads_count === 'number');
});

test('PUT /api/campaigns/:id - Cập nhật thông tin chiến dịch thành công (HTTP 200)', async () => {
  const res = await request(app)
    .put(`/api/campaigns/${testCampaignId}`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      name: 'Chiến Dịch Black Friday 2026 (Updated)',
      description: 'Mô tả đã được cập nhật ngân sách tăng',
      start_date: '2026-11-20',
      end_date: '2026-12-05',
      budget: 200000000,
    });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.name, 'Chiến Dịch Black Friday 2026 (Updated)');
  assert.strictEqual(parseFloat(res.body.data.budget), 200000000);
});

// 4. Assign & Remove Products to Campaign (SRS 3.18.1)
test('POST /api/campaigns/:id/products - Gán sản phẩm vào chiến dịch tiếp thị thành công (SRS 3.18.1)', async () => {
  const res = await request(app)
    .post(`/api/campaigns/${testCampaignId}/products`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({ product_ids: [testProductId] });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);

  // Kiểm tra sản phẩm đã nhận campaign_id
  const checkProd = await pool.query('SELECT campaign_id FROM products WHERE id = $1', [testProductId]);
  assert.strictEqual(checkProd.rows[0].campaign_id, testCampaignId);
});

test('DELETE /api/campaigns/:id/products/:productId - Gỡ sản phẩm khỏi chiến dịch', async () => {
  const res = await request(app)
    .delete(`/api/campaigns/${testCampaignId}/products/${testProductId}`)
    .set('Authorization', `Bearer ${managerToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);

  const checkProd = await pool.query('SELECT campaign_id FROM products WHERE id = $1', [testProductId]);
  assert.strictEqual(checkProd.rows[0].campaign_id, null);
});

// 5. Campaign Performance Report (SRS 3.19)
test('GET /api/campaigns/:id/report - Lấy báo cáo hiệu quả chiến dịch (Campaign Performance Report)', async () => {
  const res = await request(app)
    .get(`/api/campaigns/${testCampaignId}/report`)
    .set('Authorization', `Bearer ${managerToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.campaign);
  assert.ok(res.body.data.metrics);
  assert.strictEqual(typeof res.body.data.metrics.budget, 'number');
  assert.strictEqual(typeof res.body.data.metrics.total_leads, 'number');
  assert.strictEqual(typeof res.body.data.metrics.total_opportunities, 'number');
  assert.strictEqual(typeof res.body.data.metrics.total_orders, 'number');
  assert.strictEqual(typeof res.body.data.metrics.total_revenue, 'number');
  assert.strictEqual(typeof res.body.data.metrics.roi, 'number');
  assert.strictEqual(typeof res.body.data.metrics.conversion_rate, 'number');
  assert.ok(Array.isArray(res.body.data.leads));
  assert.ok(Array.isArray(res.body.data.products));
});

test('GET /api/campaigns/999999/report - Trả về 404 khi chiến dịch không tồn tại', async () => {
  const res = await request(app)
    .get('/api/campaigns/999999/report')
    .set('Authorization', `Bearer ${managerToken}`);

  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.success, false);
});

// 6. Sales & Business Reports (SRS 2.1)
test('GET /api/reports/summary - Trả về báo cáo tổng hợp KPI bán hàng nhanh (SRS 2.1)', async () => {
  const res = await request(app)
    .get('/api/reports/summary')
    .set('Authorization', `Bearer ${managerToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.today);
  assert.ok(res.body.data.month);
  assert.ok(res.body.data.year);
  assert.ok(res.body.data.pipeline);
  assert.strictEqual(typeof res.body.data.today.leads, 'number');
  assert.strictEqual(typeof res.body.data.month.revenue, 'number');
  assert.strictEqual(typeof res.body.data.year.achievement_rate, 'number');
});

test('GET /api/reports/leads - Báo cáo thống kê Leads theo chu kỳ & Nguồn chiến dịch (SRS 2.1)', async () => {
  const res = await request(app)
    .get('/api/reports/leads?period=month')
    .set('Authorization', `Bearer ${managerToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data.time_series));
  assert.ok(Array.isArray(res.body.data.by_campaign));
  assert.ok(Array.isArray(res.body.data.by_user));
});

test('GET /api/reports/orders - Báo cáo thống kê Đơn hàng theo chu kỳ & Trạng thái (SRS 2.1)', async () => {
  const res = await request(app)
    .get('/api/reports/orders?period=month')
    .set('Authorization', `Bearer ${managerToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data.time_series));
  assert.ok(Array.isArray(res.body.data.by_status));
  assert.ok(Array.isArray(res.body.data.by_staff));
});

test('GET /api/reports/revenue - Báo cáo thống kê Doanh thu theo Sản phẩm & Danh mục (SRS 2.1)', async () => {
  const res = await request(app)
    .get('/api/reports/revenue?period=month')
    .set('Authorization', `Bearer ${managerToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(typeof res.body.data.grand_total === 'number');
  assert.ok(Array.isArray(res.body.data.time_series));
  assert.ok(Array.isArray(res.body.data.by_product));
  assert.ok(Array.isArray(res.body.data.by_category));

  if (res.body.data.by_product.length > 0) {
    const item = res.body.data.by_product[0];
    assert.ok(typeof item.revenue_share === 'number');
  }
});

// 7. Safe Deletion (SRS 3.18)
test('DELETE /api/campaigns/:id - Xóa chiến dịch thành công và ngắt liên kết an toàn', async () => {
  const res = await request(app)
    .delete(`/api/campaigns/${testCampaignId}`)
    .set('Authorization', `Bearer ${managerToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);

  // Xác minh không còn trong DB
  const checkRes = await pool.query('SELECT id FROM campaigns WHERE id = $1', [testCampaignId]);
  assert.strictEqual(checkRes.rows.length, 0);

  // Loại khỏi danh sách dọn dẹp
  createdCampaignIds = createdCampaignIds.filter((id) => id !== testCampaignId);
});
