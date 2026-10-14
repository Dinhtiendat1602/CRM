const { test, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const { getSalesmanToken } = require('./helpers/test-auth');

let salesmanToken;
let createdLeadId;

before(async () => {
  salesmanToken = await getSalesmanToken(app);
  assert.ok(salesmanToken, 'Cần có JWT Token của salesman để chạy test');
});

after(async () => {
  // Dọn dẹp bản ghi test nếu còn sót
  if (createdLeadId) {
    await pool.query('DELETE FROM leads WHERE id = $1', [createdLeadId]);
  }
  // Xóa các lead test tạo ra trong test suite
  await pool.query("DELETE FROM leads WHERE email LIKE '%@leadtest.com'");
  await pool.end();
});

test('RBAC: Chặn truy cập unauthenticated khi không có token (HTTP 401)', async () => {
  const res = await request(app).get('/api/leads');
  assert.strictEqual(res.status, 401);
});

test('GET /api/leads - Phân trang mặc định 20 bản ghi (BR-03, SRS 3.2.3 REQ-1)', async () => {
  const res = await request(app)
    .get('/api/leads')
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.strictEqual(res.body.pagination.limit, 20);
  assert.strictEqual(res.body.pagination.page, 1);
  assert.ok(res.body.pagination.total >= 2);
});

test('POST /api/leads - Thất bại khi thiếu các trường bắt buộc (HTTP 400)', async () => {
  const res = await request(app)
    .post('/api/leads')
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({ first_name: 'Nguyen' }); // thiếu last_name, email, phone

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert.ok(res.body.message.includes('bắt buộc'));
});

test('POST /api/leads - Thất bại khi email không đúng định dạng (HTTP 400)', async () => {
  const res = await request(app)
    .post('/api/leads')
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({
      first_name: 'Van',
      last_name: 'Nguyen',
      email: 'not-an-email',
      phone: '0901234567',
    });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert.ok(res.body.message.includes('email không hợp lệ'));
});

test('POST /api/leads - Tạo Khách tiềm năng mới thành công (HTTP 201)', async () => {
  const res = await request(app)
    .post('/api/leads')
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({
      first_name: 'Dũng',
      last_name: 'Trần Văn',
      email: 'dung.tran@leadtest.com',
      phone: '0988776655',
      date_of_birth: '1995-05-15',
      career: 'Giám đốc Công nghệ',
      address: '123 Đường Cầu Giấy, Hà Nội',
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.id);
  assert.strictEqual(res.body.data.email, 'dung.tran@leadtest.com');
  createdLeadId = res.body.data.id;
});

test('POST /api/leads - Chống trùng lặp: Từ chối khi trùng Email (HTTP 409)', async () => {
  const res = await request(app)
    .post('/api/leads')
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({
      first_name: 'Khác',
      last_name: 'Họ',
      email: 'dung.tran@leadtest.com', // trùng email vừa tạo
      phone: '0911223344',
    });

  assert.strictEqual(res.status, 409);
  assert.strictEqual(res.body.success, false);
  assert.ok(res.body.message.includes('trùng lặp'));
});

test('POST /api/leads - Chống trùng lặp: Từ chối khi trùng Số điện thoại (HTTP 409)', async () => {
  const res = await request(app)
    .post('/api/leads')
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({
      first_name: 'Khác',
      last_name: 'Họ',
      email: 'other.person@leadtest.com',
      phone: '0988776655', // trùng SĐT của lead vừa tạo
    });

  assert.strictEqual(res.status, 409);
  assert.strictEqual(res.body.success, false);
  assert.ok(res.body.message.includes('trùng lặp'));
});

test('GET /api/leads/check-duplicate - Kiểm tra phát hiện trùng realtime', async () => {
  // Trùng email
  const res1 = await request(app)
    .get('/api/leads/check-duplicate?email=dung.tran@leadtest.com')
    .set('Authorization', `Bearer ${salesmanToken}`);
  assert.strictEqual(res1.status, 200);
  assert.strictEqual(res1.body.isDuplicate, true);

  // Không trùng
  const res2 = await request(app)
    .get('/api/leads/check-duplicate?email=unique.never.exist@leadtest.com')
    .set('Authorization', `Bearer ${salesmanToken}`);
  assert.strictEqual(res2.status, 200);
  assert.strictEqual(res2.body.isDuplicate, false);
});

test('GET /api/leads - Tìm kiếm theo tên (SRS 3.3)', async () => {
  const res = await request(app)
    .get('/api/leads?search=Dũng')
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 200);
  assert.ok(res.body.data.length >= 1);
  assert.ok(res.body.data.some((l) => l.first_name === 'Dũng'));
});

test('GET /api/leads - Sắp xếp & Lọc theo ngày nhập (BR-04, BR-05)', async () => {
  const res = await request(app)
    .get('/api/leads?sortBy=entered_date&sortOrder=ASC&limit=5')
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 200);
  assert.ok(res.body.data.length >= 1);
});

test('GET /api/leads/:id - Xem chi tiết Lead kèm danh sách Opportunities (SRS 3.2.3 REQ-4)', async () => {
  // Xem lead có id = 1 (seed data có gắn cơ hội)
  const res = await request(app)
    .get('/api/leads/1')
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.id, 1);
  assert.ok(Array.isArray(res.body.data.opportunities), 'Phải có mảng danh sách cơ hội');
});

test('GET /api/leads/:id - Trả về 404 khi ID không tồn tại', async () => {
  const res = await request(app)
    .get('/api/leads/999999')
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.success, false);
});

test('PUT /api/leads/:id - Cập nhật thông tin Lead thành công (SRS 3.4)', async () => {
  const res = await request(app)
    .put(`/api/leads/${createdLeadId}`)
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({
      first_name: 'Dũng Đã Cập Nhật',
      last_name: 'Trần Văn',
      email: 'dung.tran@leadtest.com',
      phone: '0988776655',
      career: 'Phó Tổng Giám Đốc',
    });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.first_name, 'Dũng Đã Cập Nhật');
  assert.strictEqual(res.body.data.career, 'Phó Tổng Giám Đốc');
});

test('PUT /api/leads/:id - Chống trùng: Từ chối đổi sang Email của Lead khác (HTTP 409)', async () => {
  // Lấy email của lead 1
  const lead1Res = await request(app)
    .get('/api/leads/1')
    .set('Authorization', `Bearer ${salesmanToken}`);

  const lead1Email = lead1Res.body.data.email;

  // Thử cập nhật lead mới tạo có email trùng lead 1
  const res = await request(app)
    .put(`/api/leads/${createdLeadId}`)
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({
      first_name: 'Dũng',
      last_name: 'Trần',
      email: lead1Email, // Trùng email của lead 1
      phone: '0988776655',
    });

  assert.strictEqual(res.status, 409);
  assert.strictEqual(res.body.success, false);
});

test('DELETE /api/leads/:id - Xóa Khách tiềm năng thành công (SRS 3.5)', async () => {
  const res = await request(app)
    .delete(`/api/leads/${createdLeadId}`)
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);

  // Xác nhận sau khi xóa, GET /api/leads/:id trả về 404
  const getDeleted = await request(app)
    .get(`/api/leads/${createdLeadId}`)
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(getDeleted.status, 404);
  createdLeadId = null; // Đã xóa, không cần dọn trong after()
});
