const { test, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/db');

let salesmanToken;
let managerToken;
let createdOppIds = [];
let createdOrderIds = [];
let orderedOppId;
let testProductId;
let testLeadId;
let initialStock;

before(async () => {
  // Lấy token đăng nhập của Salesman (hỗ trợ tài khoản thật sale1 hoặc salesman)
  let salesRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'sale1', password: '11111111' });
  if (!salesRes.body.data?.token) {
    salesRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'salesman', password: '11111111' });
  }
  salesmanToken = salesRes.body.data?.token;
  assert.ok(salesmanToken, 'Cần JWT Token của salesman (sale1 hoặc salesman)');

  // Lấy token đăng nhập của Sale Manager (hỗ trợ tài khoản thật manager1: 11111111 / 22222222 hoặc manager: 11111111)
  let mgrRes = await request(app)
    .post('/api/auth/login')
    .send({ username: 'manager1', password: '11111111' });
  if (!mgrRes.body.data?.token) {
    mgrRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'manager1', password: '22222222' });
  }
  if (!mgrRes.body.data?.token) {
    mgrRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'manager', password: '11111111' });
  }
  managerToken = mgrRes.body.data?.token;
  assert.ok(managerToken, 'Cần JWT Token của manager (manager1 hoặc manager)');

  // Lấy một sản phẩm mẫu có sẵn để dùng trong test
  const prodRes = await pool.query(
    'SELECT id, name, unit_price, stock_qty FROM products ORDER BY id ASC LIMIT 1'
  );
  assert.ok(prodRes.rows.length > 0, 'Cần ít nhất 1 sản phẩm mẫu trong DB');
  testProductId = prodRes.rows[0].id;
  initialStock = prodRes.rows[0].stock_qty;

  // Lấy một lead mẫu có sẵn trong DB
  const leadRes = await pool.query('SELECT id FROM leads ORDER BY id ASC LIMIT 1');
  assert.ok(leadRes.rows.length > 0, 'Cần ít nhất 1 lead mẫu trong DB');
  testLeadId = leadRes.rows[0].id;
});

after(async () => {
  // Dọn dẹp dữ liệu test phát sinh
  if (createdOrderIds.length > 0) {
    await pool.query('DELETE FROM orders WHERE id = ANY($1::int[])', [createdOrderIds]);
  }
  if (createdOppIds.length > 0) {
    await pool.query('DELETE FROM opportunities WHERE id = ANY($1::int[])', [createdOppIds]);
  }
  // Khôi phục tồn kho sản phẩm về ban đầu
  if (testProductId && initialStock !== undefined) {
    await pool.query('UPDATE products SET stock_qty = $1 WHERE id = $2', [initialStock, testProductId]);
  }
  await pool.end();
});

test('RBAC: Chặn truy cập unauthenticated khi không có token (HTTP 401)', async () => {
  const res1 = await request(app).get('/api/orders');
  assert.strictEqual(res1.status, 401);

  const res2 = await request(app).post('/api/opportunities/1/make-order').send({
    payment_info: 'Tiền mặt',
    shipping_address: 'Hà Nội',
  });
  assert.strictEqual(res2.status, 401);
});

test('POST /api/opportunities/:id/make-order - Bắt lỗi thiếu payment_info (HTTP 400, SRS 3.12.3 REQ-1)', async () => {
  // Tạo 1 cơ hội tạm thời
  const oppRes = await pool.query(
    `INSERT INTO opportunities (lead_id, product_id, quantity, status, notes)
     VALUES ($1, $2, 1, 'CONTACTED', 'TEST_MAKE_ORDER_VALIDATION')
     RETURNING id`,
    [testLeadId, testProductId]
  );
  const oppId = oppRes.rows[0].id;
  createdOppIds.push(oppId);

  const res = await request(app)
    .post(`/api/opportunities/${oppId}/make-order`)
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({
      shipping_address: '123 Đường ABC, Quận 1, TP.HCM',
    });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /thanh toán/i);
});

test('POST /api/opportunities/:id/make-order - Bắt lỗi thiếu shipping_address (HTTP 400, SRS 3.12.3 REQ-1)', async () => {
  const oppId = createdOppIds[0];
  const res = await request(app)
    .post(`/api/opportunities/${oppId}/make-order`)
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({
      payment_info: 'Chuyển khoản ngân hàng',
    });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /giao hàng/i);
});

test('POST /api/opportunities/:id/make-order - Bắt lỗi cơ hội không tồn tại (HTTP 404)', async () => {
  const res = await request(app)
    .post('/api/opportunities/999999/make-order')
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({
      payment_info: 'Thẻ tín dụng',
      shipping_address: 'Hà Nội',
    });

  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.success, false);
});

test('POST /api/opportunities/:id/make-order - Rollback ACID khi tồn kho không đủ (HTTP 400, AC-08, BR-03)', async () => {
  // Kiểm tra tồn kho hiện tại
  const stockRes = await pool.query('SELECT stock_qty FROM products WHERE id = $1', [testProductId]);
  const currentStock = stockRes.rows[0].stock_qty;

  // Tạo cơ hội với số lượng vượt quá tồn kho (ví dụ: tồn kho + 100)
  const excessiveQty = currentStock + 100;
  const oppRes = await pool.query(
    `INSERT INTO opportunities (lead_id, product_id, quantity, status, notes)
     VALUES ($1, $2, $3, 'PROPOSAL', 'TEST_EXCESSIVE_STOCK')
     RETURNING id`,
    [testLeadId, testProductId, excessiveQty]
  );
  const oppId = oppRes.rows[0].id;
  createdOppIds.push(oppId);

  const res = await request(app)
    .post(`/api/opportunities/${oppId}/make-order`)
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({
      payment_info: 'Chuyển khoản Techcombank',
      shipping_address: '456 Lê Lợi, TP. Đà Nẵng',
    });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /tồn kho không đủ/i);

  // Xác minh Transaction ROLLBACK:
  // 1. Tồn kho sản phẩm không bị thay đổi
  const stockAfterRes = await pool.query('SELECT stock_qty FROM products WHERE id = $1', [testProductId]);
  assert.strictEqual(stockAfterRes.rows[0].stock_qty, currentStock);

  // 2. Trạng thái cơ hội vẫn là PROPOSAL (chưa bị đổi thành ORDERED)
  const oppAfterRes = await pool.query('SELECT status FROM opportunities WHERE id = $1', [oppId]);
  assert.strictEqual(oppAfterRes.rows[0].status, 'PROPOSAL');

  // 3. Không có bản ghi order nào được tạo
  const orderCheck = await pool.query('SELECT id FROM orders WHERE opportunity_id = $1', [oppId]);
  assert.strictEqual(orderCheck.rows.length, 0);
});

test('POST /api/opportunities/:id/make-order - Chốt đơn thành công với Transaction ACID (HTTP 201, SRS 3.12, BR-07)', async () => {
  // Đảm bảo sản phẩm có đủ tồn kho ít nhất 10 chiếc
  await pool.query('UPDATE products SET stock_qty = 50 WHERE id = $1', [testProductId]);

  const orderQty = 3;
  const oppRes = await pool.query(
    `INSERT INTO opportunities (lead_id, product_id, quantity, status, notes)
     VALUES ($1, $2, $3, 'QUALIFIED', 'TEST_MAKE_ORDER_SUCCESS')
     RETURNING id`,
    [testLeadId, testProductId, orderQty]
  );
  const oppId = oppRes.rows[0].id;
  createdOppIds.push(oppId);
  orderedOppId = oppId;

  const res = await request(app)
    .post(`/api/opportunities/${oppId}/make-order`)
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({
      payment_info: 'Chuyển khoản Vietcombank',
      shipping_address: '789 Trần Hưng Đạo, Q5, TP.HCM',
      notes: 'Giao hàng giờ hành chính',
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data);

  const order = res.body.data;
  createdOrderIds.push(order.id);

  // Kiểm tra mã đơn hàng chuẩn format ORD-YYYYMMDD-XXXX
  assert.match(order.order_code, /^ORD-\d{8}-[A-Z0-9]+$/);
  assert.strictEqual(order.opportunity_id, oppId);
  assert.strictEqual(order.quantity, orderQty);
  assert.strictEqual(order.status, 'COMPLETED');
  assert.strictEqual(order.payment_info, 'Chuyển khoản Vietcombank');
  assert.strictEqual(order.shipping_address, '789 Trần Hưng Đạo, Q5, TP.HCM');

  // Kiểm tra đơn giá và tổng tiền
  const prodCheck = await pool.query('SELECT unit_price, stock_qty FROM products WHERE id = $1', [testProductId]);
  const expectedUnitPrice = parseFloat(prodCheck.rows[0].unit_price);
  const expectedTotal = orderQty * expectedUnitPrice;
  assert.strictEqual(parseFloat(order.unit_price), expectedUnitPrice);
  assert.strictEqual(parseFloat(order.total_amount), expectedTotal);

  // Kiểm tra trừ tồn kho chính xác: 50 - 3 = 47
  assert.strictEqual(prodCheck.rows[0].stock_qty, 47);

  // Kiểm tra trạng thái Cơ hội bán hàng đã cập nhật thành ORDERED
  const oppCheck = await pool.query('SELECT status FROM opportunities WHERE id = $1', [oppId]);
  assert.strictEqual(oppCheck.rows[0].status, 'ORDERED');

  // Kiểm tra tự động ghi nhận nhật ký Follow-up (SRS 3.11)
  const followUpCheck = await pool.query(
    'SELECT * FROM follow_ups WHERE opportunity_id = $1 ORDER BY id DESC LIMIT 1',
    [oppId]
  );
  assert.strictEqual(followUpCheck.rows.length, 1);
  assert.match(followUpCheck.rows[0].content, /Chốt đơn hàng thành công/);
  assert.match(followUpCheck.rows[0].content, new RegExp(order.order_code));
});

test('Chặn chốt đơn lại lần 2 đối với cơ hội đã ORDERED (HTTP 400, SRS 3.12)', async () => {
  const oppId = createdOppIds[createdOppIds.length - 1]; // Cơ hội vừa chốt đơn ở test trên

  const res = await request(app)
    .post(`/api/opportunities/${oppId}/make-order`)
    .set('Authorization', `Bearer ${salesmanToken}`)
    .send({
      payment_info: 'Tiền mặt',
      shipping_address: 'TP.HCM',
    });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /đã được chốt đơn|đã liên kết/i);
});

test('POST /api/orders - Chốt đơn thành công qua endpoint /api/orders (HTTP 201)', async () => {
  const oppRes = await pool.query(
    `INSERT INTO opportunities (lead_id, product_id, quantity, status, notes)
     VALUES ($1, $2, 1, 'CONTACTED', 'TEST_MAKE_ORDER_VIA_ORDERS_ROUTE')
     RETURNING id`,
    [testLeadId, testProductId]
  );
  const oppId = oppRes.rows[0].id;
  createdOppIds.push(oppId);

  const res = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${managerToken}`)
    .send({
      opportunity_id: oppId,
      payment_info: 'Thanh toán trực tiếp tại quầy',
      shipping_address: 'Nhận tại showroom Zen CRM',
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.order_code);
  createdOrderIds.push(res.body.data.id);
});

test('GET /api/orders - Lấy danh sách đơn hàng phân trang mặc định 20 dòng (HTTP 200, BR-03)', async () => {
  const res = await request(app)
    .get('/api/orders')
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.pagination);
  assert.strictEqual(res.body.pagination.limit, 20);
  assert.ok(res.body.pagination.total >= 2);
  assert.ok(res.body.summary);
  assert.ok(res.body.summary.totalRevenue > 0);
  assert.ok(res.body.summary.totalOrders >= 2);
});

test('GET /api/orders - Tìm kiếm đơn hàng theo mã đơn order_code (HTTP 200)', async () => {
  const latestOrderId = createdOrderIds[0];
  const orderRes = await pool.query('SELECT order_code FROM orders WHERE id = $1', [latestOrderId]);
  const code = orderRes.rows[0].order_code;

  const res = await request(app)
    .get(`/api/orders?search=${code}`)
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data.length >= 1);
  assert.strictEqual(res.body.data[0].order_code, code);
});

test('GET /api/orders - Lọc đơn hàng theo khoảng ngày (HTTP 200, BR-05)', async () => {
  const today = new Date().toISOString().split('T')[0];
  const res = await request(app)
    .get(`/api/orders?from_date=${today}&to_date=${today}`)
    .set('Authorization', `Bearer ${managerToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.data.length >= 1);
});

test('GET /api/orders/:id - Lấy chi tiết đơn hàng theo ID (HTTP 200, SRS 3.12)', async () => {
  const orderId = createdOrderIds[0];
  const res = await request(app)
    .get(`/api/orders/${orderId}`)
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.ok(res.body.data);
  assert.strictEqual(res.body.data.id, orderId);
  assert.ok(res.body.data.lead_name);
  assert.ok(res.body.data.product_name);
  assert.ok(res.body.data.opportunity_status);
  assert.strictEqual(res.body.data.opportunity_status, 'ORDERED');
});

test('GET /api/orders/:code - Lấy chi tiết đơn hàng theo order_code chuỗi (HTTP 200)', async () => {
  const orderId = createdOrderIds[0];
  const orderRes = await pool.query('SELECT order_code FROM orders WHERE id = $1', [orderId]);
  const code = orderRes.rows[0].order_code;

  const res = await request(app)
    .get(`/api/orders/${code}`)
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.data.order_code, code);
});

test('GET /api/orders/999999 - Trả về HTTP 404 khi đơn hàng không tồn tại', async () => {
  const res = await request(app)
    .get('/api/orders/999999')
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.success, false);
});

test('DELETE /api/opportunities/:id - Chặn xóa cơ hội đã chuyển thành đơn hàng ORDERED (HTTP 400, SRS 3.10)', async () => {
  const oppId = orderedOppId; // Cơ hội đã chốt đơn ở test thành công
  const res = await request(app)
    .delete(`/api/opportunities/${oppId}`)
    .set('Authorization', `Bearer ${salesmanToken}`);

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.success, false);
  assert.match(res.body.message, /chuyển đổi thành đơn hàng|đơn hàng/i);
});
