const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const { getManagerToken, getAdminToken, getSalesmanToken } = require('./helpers/test-auth');

/**
 * Integration Test Suite cho Module Kế hoạch Doanh số 12 Tháng & Đối soát Performance
 * Tuân thủ SRS v1.1 Mục 3.20, 3.21 và Business Rule BR-07 (Toán tử so sánh Plan vs Actual)
 */
describe('Sales Forecast & Performance Module Tests (feat-018 - SRS 3.20, 3.21)', () => {
  let managerToken;
  let adminToken;
  let salesmanToken;

  const testYear = 2026;

  before(async () => {
    managerToken = await getManagerToken(app);
    adminToken = await getAdminToken(app);
    salesmanToken = await getSalesmanToken(app);

    assert.ok(managerToken, 'Cần có token Quản lý bán hàng (Sale Manager)');
    assert.ok(adminToken, 'Cần có token Quản trị viên (Admin)');
    assert.ok(salesmanToken, 'Cần có token Nhân viên bán hàng (Salesman)');

    // Dọn dẹp dữ liệu test cũ của năm 2026 nếu có
    await db.query('DELETE FROM sale_forecasts WHERE fiscal_year = $1', [testYear]);
  });

  describe('1. Phân quyền RBAC & Xác thực bảo mật', () => {
    it('chặn truy cập khi không có Bearer Token (HTTP 401 Unauthorized)', async () => {
      const res = await request(app).get('/api/forecasts/performance');
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    it('chặn Nhân viên bán hàng (SALESMAN) truy cập API kế hoạch doanh số (HTTP 403 Forbidden)', async () => {
      const res1 = await request(app)
        .post('/api/forecasts/setup')
        .set('Authorization', `Bearer ${salesmanToken}`)
        .send({ fiscal_year: testYear, plans: [{ month: 1, target_amount: 1000000 }] });
      assert.strictEqual(res1.status, 403);

      const res2 = await request(app)
        .get(`/api/forecasts/performance?fiscal_year=${testYear}`)
        .set('Authorization', `Bearer ${salesmanToken}`);
      assert.strictEqual(res2.status, 403);
    });

    it('cho phép Quản lý bán hàng (SALE_MANAGER) và Quản trị viên (ADMIN) truy cập', async () => {
      const resManager = await request(app)
        .get(`/api/forecasts/plans?fiscal_year=${testYear}`)
        .set('Authorization', `Bearer ${managerToken}`);
      assert.strictEqual(resManager.status, 200);

      const resAdmin = await request(app)
        .get(`/api/forecasts/plans?fiscal_year=${testYear}`)
        .set('Authorization', `Bearer ${adminToken}`);
      assert.strictEqual(resAdmin.status, 200);
    });
  });

  describe('2. Thiết lập Kế hoạch Doanh số 12 Tháng (POST /api/forecasts/setup - SRS 3.20)', () => {
    it('từ chối khi năm tài chính (fiscal_year) không hợp lệ', async () => {
      const res = await request(app)
        .post('/api/forecasts/setup')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ fiscal_year: 1890, plans: [{ month: 1, target_amount: 5000000 }] });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('Năm tài chính'));
    });

    it('từ chối khi danh sách kế hoạch (plans) rỗng', async () => {
      const res = await request(app)
        .post('/api/forecasts/setup')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ fiscal_year: testYear, plans: [] });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    it('từ chối khi chỉ tiêu doanh thu là số âm (target_amount < 0)', async () => {
      const res = await request(app)
        .post('/api/forecasts/setup')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          fiscal_year: testYear,
          plans: [{ month: 3, target_amount: -5000000 }],
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.message.includes('lớn hơn hoặc bằng 0'));
    });

    it('thiết lập kế hoạch thành công cho 12 tháng với dạng mảng (Array of Plans)', async () => {
      const samplePlans = [
        { month: 1, target_amount: 100000000 },
        { month: 2, target_amount: 120000000 },
        { month: 3, target_amount: 110000000 },
        { month: 4, target_amount: 130000000 },
        { month: 5, target_amount: 140000000 },
        { month: 6, target_amount: 150000000 },
        { month: 7, target_amount: 160000000 },
        { month: 8, target_amount: 170000000 },
        { month: 9, target_amount: 180000000 },
        { month: 10, target_amount: 190000000 },
        { month: 11, target_amount: 200000000 },
        { month: 12, target_amount: 250000000 },
      ];

      const res = await request(app)
        .post('/api/forecasts/setup')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          fiscal_year: testYear,
          plans: samplePlans,
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.fiscal_year, testYear);
      assert.strictEqual(res.body.data.plans.length, 12);
      // Tổng kế hoạch = 1900000000 (1.9 tỷ)
      assert.strictEqual(res.body.data.total_plan, 1900000000);
    });

    it('hỗ trợ cập nhật (UPSERT) chỉ tiêu của tháng mà không bị lỗi trùng lặp dòng', async () => {
      // Cập nhật lại chỉ tiêu Tháng 1 thành 200 triệu
      const res = await request(app)
        .post('/api/forecasts/setup')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          fiscal_year: testYear,
          plans: [{ month: 1, target_amount: 200000000 }],
        });

      assert.strictEqual(res.status, 200);
      const updatedMonth1 = res.body.data.plans.find((p) => p.month === 1);
      assert.strictEqual(updatedMonth1.target_amount, 200000000);
    });

    it('hỗ trợ thiết lập qua object targets { "1": value, "2": value }', async () => {
      const res = await request(app)
        .post('/api/forecasts/setup')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          fiscal_year: testYear,
          targets: {
            1: 150000000,
            2: 160000000,
          },
        });

      assert.strictEqual(res.status, 200);
      const m1 = res.body.data.plans.find((p) => p.month === 1);
      assert.strictEqual(m1.target_amount, 150000000);
    });
  });

  describe('3. Lấy Kế hoạch theo Năm tài chính (GET /api/forecasts/plans - SRS 3.20)', () => {
    it('trả về đủ 12 tháng kể cả tháng chưa nhập chỉ tiêu', async () => {
      const nextYear = testYear + 1;
      const res = await request(app)
        .get(`/api/forecasts/plans?fiscal_year=${nextYear}`)
        .set('Authorization', `Bearer ${managerToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.fiscal_year, nextYear);
      assert.strictEqual(res.body.data.plans.length, 12);
      assert.strictEqual(res.body.data.total_plan, 0);
      assert.strictEqual(res.body.data.plans[0].target_amount, 0);
    });

    it('trả về dữ liệu chính xác cho năm đã lập kế hoạch', async () => {
      const res = await request(app)
        .get(`/api/forecasts/plans?fiscal_year=${testYear}`)
        .set('Authorization', `Bearer ${managerToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.fiscal_year, testYear);
      assert.strictEqual(res.body.data.plans.length, 12);
      assert.ok(res.body.data.total_plan > 0);
    });
  });

  describe('4. Báo cáo Đối soát Kế hoạch vs Thực tế 12 Tháng (GET /api/forecasts/performance - SRS 3.21, BR-07)', () => {
    it('trả về đầy đủ bảng đối soát 12 tháng với các cột Month | Plan | Actually | % theo SRS 3.21.3 REQ-1', async () => {
      const res = await request(app)
        .get(`/api/forecasts/performance?fiscal_year=${testYear}`)
        .set('Authorization', `Bearer ${managerToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.summary);
      assert.strictEqual(res.body.data.months.length, 12);

      const firstMonth = res.body.data.months[0];
      assert.ok('month' in firstMonth);
      assert.ok('month_label' in firstMonth);
      assert.ok('plan' in firstMonth);
      assert.ok('actually_value' in firstMonth);
      assert.ok('orders_count' in firstMonth);
      assert.ok('percentage' in firstMonth);
      assert.ok('variance' in firstMonth);
    });

    it('tính toán tỷ lệ % hoàn thành chính xác theo BR-07: % = (Actually / Plan) * 100', async () => {
      const res = await request(app)
        .get(`/api/forecasts/performance?fiscal_year=${testYear}`)
        .set('Authorization', `Bearer ${managerToken}`);

      assert.strictEqual(res.status, 200);
      for (const m of res.body.data.months) {
        if (m.plan > 0) {
          const expectedPct = Number(((m.actually_value / m.plan) * 100).toFixed(2));
          assert.strictEqual(m.percentage, expectedPct);
        } else {
          // Khi Plan = 0 thì % = 0 theo BR-07
          assert.strictEqual(m.percentage, 0);
        }
      }
    });

    it('tính toán khối tổng kết năm summary (total_plan, total_actual, variance, overall_percentage)', async () => {
      const res = await request(app)
        .get(`/api/forecasts/performance?fiscal_year=${testYear}`)
        .set('Authorization', `Bearer ${managerToken}`);

      assert.strictEqual(res.status, 200);
      const summary = res.body.data.summary;

      const sumPlan = res.body.data.months.reduce((acc, m) => acc + m.plan, 0);
      const sumActual = res.body.data.months.reduce((acc, m) => acc + m.actually_value, 0);

      assert.strictEqual(summary.total_plan, sumPlan);
      assert.strictEqual(summary.total_actual, sumActual);
      assert.strictEqual(summary.variance, sumActual - sumPlan);

      if (sumPlan > 0) {
        const expectedOverall = Number(((sumActual / sumPlan) * 100).toFixed(2));
        assert.strictEqual(summary.overall_percentage, expectedOverall);
      }
    });
  });

  describe('5. Danh sách các năm khả dụng (GET /api/forecasts/years)', () => {
    it('trả về danh sách các năm được sắp xếp giảm dần và chứa năm hiện tại', async () => {
      const res = await request(app)
        .get('/api/forecasts/years')
        .set('Authorization', `Bearer ${managerToken}`);

      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length >= 2);
      assert.ok(res.body.data.includes(new Date().getFullYear()));
    });
  });
});
