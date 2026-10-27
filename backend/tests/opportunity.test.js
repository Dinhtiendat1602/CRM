const { test, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const { getSalesmanToken } = require('./helpers/test-auth');

let salesmanToken;
let testOppId;
let duplicateOppId;

before(async () => {
  salesmanToken = await getSalesmanToken(app);
  assert.ok(salesmanToken, 'Cần có JWT Token của salesman để chạy test');
});

after(async () => {
  // Dọn dẹp các bản ghi test
  if (testOppId) {
    await pool.query('DELETE FROM opportunities WHERE id = $1', [testOppId]);
  }
  if (duplicateOppId) {
    await pool.query('DELETE FROM opportunities WHERE id = $1', [duplicateOppId]);
  }
  await pool.query("DELETE FROM opportunities WHERE notes LIKE '%TEST_OPPORTUNITY%'");
  await pool.end();
});

test('RBAC: Chặn truy cập unauthenticated khi không có token (HTTP 401)', async () => {
  const res = await request(app).get('/api/opportunities');
  assert.strictEqual(res.status, 401);
});

test('GET /api/opportunities/statuses - Lấy danh mục trạng thái cơ hội (HTTP 200)', async () => {
  const res = await request(app)
    .get('/api/opportunities/statuses')
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  const codes = res.body.data.map((s) => s.code);
  assert.ok(codes.includes('NEW'));
  assert.ok(codes.includes('CONTACTED'));
  assert.ok(codes.includes('ORDERED'));
});

test('GET /api/opportunities - Phân trang mặc định 20 bản ghi (BR-03, SRS 3.7.3 REQ-1)', async () => {
  const res = await request(app)
    .get('/api/opportunities')
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.strictEqual(res.body.pagination.limit, 20);
  assert.strictEqual(res.body.pagination.page, 1);
  assert.ok(res.body.pagination.total >= 1);
});

test('POST /api/opportunities - Thất bại khi thiếu lead_id hoặc product_id (HTTP 400)', async () => {
  const res = await request(app)
    .post('/api/opportunities')
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({ quantity: 2 });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert.ok(res.body.message.includes('bắt buộc'));
});

test('POST /api/opportunities - Thất bại khi số lượng quantity <= 0 (HTTP 400)', async () => {
  const res = await request(app)
    .post('/api/opportunities')
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({
      lead_id: 2,
      product_id: 2,
      quantity: 0,
    });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert.ok(res.body.message.includes('nguyên dương'));
});

test('POST /api/opportunities - Tạo cơ hội mới thành công (HTTP 201, SRS 3.6)', async () => {
  const res = await request(app)
    .post('/api/opportunities')
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({
      lead_id: 2,
      product_id: 2,
      quantity: 3,
      expected_close_date: '2026-12-15',
      status: 'NEW',
      notes: 'TEST_OPPORTUNITY Khách hàng quan tâm iPhone 16 Pro Max',
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.lead_id, 2);
  assert.strictEqual(res.body.data.product_id, 2);
  assert.strictEqual(res.body.data.quantity, 3);
  assert.strictEqual(res.body.data.status, 'NEW');

  testOppId = res.body.data.id;
});

test('POST /api/opportunities - Chống trùng lặp trả về HTTP 409 Conflict khi tạo cùng cặp Lead-Product chưa đóng (BR-02, SRS 3.6.2 REQ-4)', async () => {
  const res = await request(app)
    .post('/api/opportunities')
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({
      lead_id: 2,
      product_id: 2,
      quantity: 1,
      notes: 'TEST_OPPORTUNITY Trùng lặp',
    });

  assert.strictEqual(res.status, 409);
  assert.strictEqual(res.body.success, false);
  assert.strictEqual(res.body.isDuplicate, true);
  assert.ok(res.body.message.includes('đang xử lý'));
});

test('GET /api/opportunities/check-duplicate - Kiểm tra trùng lặp phát hiện cơ hội đang mở (BR-02)', async () => {
  const res = await request(app)
    .get('/api/opportunities/check-duplicate?lead_id=2&product_id=2')
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.isDuplicate, true);
  assert.ok(res.body.existingOpportunity);
});

test('POST /api/opportunities - Cho phép tạo cơ hội trùng lặp khi có confirm_duplicate = true', async () => {
  const res = await request(app)
    .post('/api/opportunities')
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({
      lead_id: 2,
      product_id: 2,
      quantity: 1,
      confirm_duplicate: true,
      notes: 'TEST_OPPORTUNITY Được xác nhận trùng',
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  duplicateOppId = res.body.data.id;
});

test('GET /api/opportunities - Tìm kiếm theo tên Lead hoặc Sản phẩm (SRS 3.8)', async () => {
  const detail = await request(app)
    .get(`/api/opportunities/${testOppId}`)
    .set('Authorization', `Bearer ${salesmanToken}`);
  const keyword = detail.body.data?.product_name?.split(' ')[0] || 'Canon';

  const res = await request(app)
    .get(`/api/opportunities?search=${encodeURIComponent(keyword)}`)
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.length >= 1);
  const found = res.body.data.some((opp) => opp.product_name.includes(keyword));
  assert.ok(found, `Phải tìm thấy cơ hội chứa sản phẩm ${keyword}`);
});

test('GET /api/opportunities/:id - Xem chi tiết Cơ hội kèm lịch sử Follow-up (SRS 3.7.3 REQ-4)', async () => {
  const res = await request(app)
    .get(`/api/opportunities/${testOppId}`)
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.id, testOppId);
  assert.ok(res.body.data.product_name);
  assert.ok(res.body.data.lead_name);
  assert.ok(Array.isArray(res.body.data.follow_ups));
});

test('PUT /api/opportunities/:id - Cập nhật Cơ hội thành công (SRS 3.9)', async () => {
  const res = await request(app)
    .put(`/api/opportunities/${testOppId}`)
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({
      quantity: 5,
      status: 'QUALIFIED',
      notes: 'TEST_OPPORTUNITY Đã xác nhận nhu cầu 5 máy',
    });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.quantity, 5);
  assert.strictEqual(res.body.data.status, 'QUALIFIED');
});

test('POST /api/opportunities/:id/follow-ups - Thất bại khi thiếu nội dung content (HTTP 400)', async () => {
  const res = await request(app)
    .post(`/api/opportunities/${testOppId}/follow-ups`)
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({ contact_method: 'PHONE' }); // Thiếu content

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert.ok(res.body.message.includes('bắt buộc'));
});

test('POST /api/opportunities/:id/follow-ups - Ghi nhận nhật ký chăm sóc thành công (HTTP 201, SRS 3.11)', async () => {
  const res = await request(app)
    .post(`/api/opportunities/${testOppId}/follow-ups`)
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({
      contact_method: 'PHONE',
      content: 'Gọi điện trao đổi cấu hình và số lượng 5 máy',
      customer_response: 'Khách hàng đồng ý báo giá, muốn xem hợp đồng mẫu',
      next_plan: 'Gửi báo giá chính thức và hợp đồng qua email trước ngày mai',
      new_status: 'PROPOSAL',
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.opportunity_id, testOppId);
  assert.strictEqual(res.body.data.contact_method, 'PHONE');
  assert.strictEqual(res.body.opportunity_status, 'PROPOSAL');
});

test('GET /api/opportunities/:id/follow-ups - Lấy danh sách nhật ký chăm sóc (SRS 3.11)', async () => {
  const res = await request(app)
    .get(`/api/opportunities/${testOppId}/follow-ups`)
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.data.length >= 1);
  assert.ok(res.body.data[0].content.includes('Gọi điện trao đổi cấu hình'));
});

test('DELETE /api/opportunities/:id - Chặn xóa cơ hội khi trạng thái là ORDERED (HTTP 400)', async () => {
  // Cập nhật trạng thái cơ hội thành ORDERED để kiểm tra chặn xóa
  await pool.query("UPDATE opportunities SET status = 'ORDERED' WHERE id = $1", [testOppId]);

  const res = await request(app)
    .delete(`/api/opportunities/${testOppId}`)
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert.ok(res.body.message.includes('chuyển đổi thành đơn hàng'));

  // Phục hồi lại trạng thái PROPOSAL để test xóa thành công
  await pool.query("UPDATE opportunities SET status = 'PROPOSAL' WHERE id = $1", [testOppId]);
});

test('DELETE /api/opportunities/:id - Xóa cơ hội bán hàng thành công (SRS 3.10)', async () => {
  const res = await request(app)
    .delete(`/api/opportunities/${testOppId}`)
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);

  // Đánh dấu đã xóa để hook after không xóa lại
  testOppId = null;
});

test('POST /api/opportunities - Chặn Salesman tạo cơ hội cho sản phẩm chưa được phân quyền (HTTP 403 Forbidden)', async () => {
  // Lấy 1 sản phẩm mà salesman không được gán (hoặc tạm gỡ 1 sản phẩm)
  const unassignedRes = await pool.query(
    'SELECT id FROM products WHERE id NOT IN (SELECT product_id FROM salesman_products WHERE user_id = 3) LIMIT 1'
  );
  if (unassignedRes.rows.length > 0) {
    const unassignedProductId = unassignedRes.rows[0].id;
    const res = await request(app)
      .post('/api/opportunities')
      .set('Authorization', `Bearer ${salesmanToken}`)
      .send({
        lead_id: 2,
        product_id: unassignedProductId,
        quantity: 1,
        notes: 'TEST_OPPORTUNITY Sản phẩm chưa được cấp phép',
      });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.message.includes('phân quyền bán sản phẩm này'));
  }
});
