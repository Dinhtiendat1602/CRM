const { test, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');
const { getAdminToken, getManagerToken, getSalesmanToken } = require('./helpers/test-auth');

let adminToken;
let managerToken;
let salesmanToken;

let createdCategoryId;
let createdProductId;

before(async () => {
  adminToken = await getAdminToken(app);
  managerToken = await getManagerToken(app);
  salesmanToken = await getSalesmanToken(app);

  assert.ok(adminToken && managerToken && salesmanToken, 'Phải có token của cả 3 roles');
});

after(async () => {
  // Dọn dẹp dữ liệu test
  if (createdProductId) {
    await pool.query('DELETE FROM products WHERE id = $1', [createdProductId]);
  }
  await pool.query("DELETE FROM products WHERE product_code LIKE 'TEST_%'");
  if (createdCategoryId) {
    await pool.query('DELETE FROM product_categories WHERE id = $1', [createdCategoryId]);
  }
  await pool.query("DELETE FROM product_categories WHERE name LIKE 'Danh mục Test %'");
});

// 1. RBAC Tests
test('RBAC: Chặn unauthenticated truy cập /api/products và /api/categories (HTTP 401)', async () => {
  const pRes = await request(app).get('/api/products');
  assert.strictEqual(pRes.status, 401);

  const cRes = await request(app).get('/api/categories');
  assert.strictEqual(cRes.status, 401);
});

test('RBAC: Salesman bị chặn tạo/sửa/xóa sản phẩm và danh mục (HTTP 403 Forbidden)', async () => {
  const catRes = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({ name: 'Hacker Category' });
  assert.strictEqual(catRes.status, 403);

  const prodRes = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({ product_code: 'HACK_01', name: 'Hacked Product', unit_price: 100 });
  assert.strictEqual(prodRes.status, 403);
});

test('RBAC: Salesman được phép xem danh sách sản phẩm và danh mục (HTTP 200)', async () => {
  const catRes = await request(app)
    .get('/api/categories')
    .set('Authorization', `Bearer ${salesmanToken}`);
  assert.strictEqual(catRes.status, 200);
  assert.ok(Array.isArray(catRes.body.categories));

  const prodRes = await request(app)
    .get('/api/products')
    .set('Authorization', `Bearer ${salesmanToken}`);
  assert.strictEqual(prodRes.status, 200);
  assert.ok(Array.isArray(prodRes.body.products));
});

// 2. Categories CRUD Tests
test('POST /api/categories - Sale Manager tạo danh mục mới thành công (HTTP 201)', async () => {
  const res = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      name: `Danh mục Test ${Date.now()}`,
      description: 'Mô tả danh mục kiểm thử tự động',
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.category.id);
  createdCategoryId = res.body.category.id;
});

test('POST /api/categories - Chống trùng tên danh mục (HTTP 409 Conflict)', async () => {
  // Lấy 1 danh mục đã có
  const catList = await request(app)
    .get('/api/categories')
    .set('Authorization', `Bearer ${adminToken}`);
  const existingName = catList.body.categories[0].name;

  const res = await request(app)
    .post('/api/categories')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: existingName });

  assert.strictEqual(res.status, 409);
  assert.strictEqual(res.body.success, false);
});

test('PUT /api/categories/:id - Cập nhật danh mục thành công', async () => {
  const res = await request(app)
    .put(`/api/categories/${createdCategoryId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: `Danh mục Test Updated ${Date.now()}`,
      description: 'Mô tả đã được sửa đổi',
    });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.category.description, 'Mô tả đã được sửa đổi');
});

// 3. Products CRUD & Business Rules Tests
test('GET /api/products - Phân trang mặc định 20 bản ghi (BR-03, SRS 3.15)', async () => {
  const res = await request(app)
    .get('/api/products')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.pagination.limit, 20);
  assert.ok(res.body.products.length >= 2, 'Cơ sở dữ liệu phải có ít nhất 2 sản phẩm mẫu');
});

test('POST /api/products - Thất bại khi thiếu trường bắt buộc hoặc giá âm (HTTP 400)', async () => {
  // Thiếu mã sản phẩm
  const res1 = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Sản phẩm không mã', unit_price: 100 });
  assert.strictEqual(res1.status, 400);

  // Đơn giá âm
  const res2 = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ product_code: 'TEST_NEG', name: 'Sản phẩm giá âm', unit_price: -50 });
  assert.strictEqual(res2.status, 400);
});

test('POST /api/products - Tạo sản phẩm mới thành công (HTTP 201)', async () => {
  const code = `TEST_${Date.now()}`;
  const res = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      product_code: code,
      name: 'Phần mềm Quản lý Kho Pro',
      description: 'Giải pháp kiểm kê tự động bằng mã vạch',
      category_id: createdCategoryId,
      unit_price: 2500,
      stock_qty: 50,
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.product.product_code, code);
  assert.strictEqual(Number(res.body.product.unit_price), 2500);
  assert.strictEqual(res.body.product.stock_qty, 50);
  createdProductId = res.body.product.id;
});

test('POST /api/products - Chống trùng mã sản phẩm product_code (HTTP 409 Conflict)', async () => {
  // Thử tạo lại với cùng createdProductId product_code
  const prod = await request(app)
    .get(`/api/products/${createdProductId}`)
    .set('Authorization', `Bearer ${adminToken}`);
  const existingCode = prod.body.product.product_code;

  const res = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      product_code: existingCode,
      name: 'Trùng mã',
      unit_price: 100,
    });

  assert.strictEqual(res.status, 409);
  assert.strictEqual(res.body.success, false);
});

test('GET /api/products - Tìm kiếm theo tên hoặc mã sản phẩm (SRS 3.15)', async () => {
  const res = await request(app)
    .get('/api/products?search=Quản lý Kho')
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 200);
  assert.ok(res.body.products.length >= 1);
  assert.ok(res.body.products.some((p) => p.id === createdProductId));
});

test('GET /api/products - Lọc theo danh mục category_id', async () => {
  const res = await request(app)
    .get(`/api/products?category_id=${createdCategoryId}`)
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 200);
  assert.ok(res.body.products.every((p) => p.category_id === createdCategoryId));
});

test('PUT /api/products/:id - Cập nhật thông tin sản phẩm thành công', async () => {
  const res = await request(app)
    .put(`/api/products/${createdProductId}`)
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      name: 'Phần mềm Quản lý Kho Pro v2.0',
      unit_price: 2800,
      stock_qty: 60,
    });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.product.name, 'Phần mềm Quản lý Kho Pro v2.0');
  assert.strictEqual(Number(res.body.product.unit_price), 2800);
  assert.strictEqual(res.body.product.stock_qty, 60);
});

// 4. APIs đặc thù SRS 3.16 và SRS 3.17
test('GET /api/products/:id/opportunities - Xem các cơ hội liên quan đến sản phẩm (SRS 3.16)', async () => {
  // Sản phẩm mẫu ID 1 trong seed data đã có 1 cơ hội
  const res = await request(app)
    .get('/api/products/1/opportunities')
    .set('Authorization', `Bearer ${managerToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.opportunities));
  assert.ok(res.body.opportunities.length >= 1, 'Sản phẩm 1 phải có ít nhất 1 cơ hội trong seed data');
  assert.ok(res.body.opportunities[0].lead_id, 'Cơ hội phải chứa thông tin Lead');
});

test('GET /api/products/:id/orders - Xem các đơn hàng đã xuất bán sản phẩm (SRS 3.17)', async () => {
  const res = await request(app)
    .get('/api/products/1/orders')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.orders));
});

test('DELETE /api/products/:id - Chặn xóa sản phẩm khi đã có cơ hội hoặc đơn hàng (HTTP 400)', async () => {
  // Sản phẩm 1 đã có cơ hội trong seed data
  const res = await request(app)
    .delete('/api/products/1')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
});

test('DELETE /api/products/:id - Xóa thành công sản phẩm chưa có liên kết ràng buộc', async () => {
  const res = await request(app)
    .delete(`/api/products/${createdProductId}`)
    .set('Authorization', `Bearer ${adminToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  createdProductId = null; // Đã xóa xong
});

test('DELETE /api/categories/:id - Xóa thành công danh mục khi không còn sản phẩm', async () => {
  const res = await request(app)
    .delete(`/api/categories/${createdCategoryId}`)
    .set('Authorization', `Bearer ${adminToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  createdCategoryId = null; // Đã xóa xong
});
