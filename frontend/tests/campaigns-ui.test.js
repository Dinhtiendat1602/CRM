import { describe, it } from 'node:test';
import assert from 'node:assert';

/**
 * Test Suite Frontend Quản lý Chiến dịch Tiếp thị & Báo cáo Doanh số (Campaigns & Reports UI)
 * Tuân thủ SRS v1.1 Mục 3.18, 3.19, SRS 2.1, BR-03 (Phân trang 20 dòng), BR-05 (Lọc ngày)
 */

// 1. Logic Validation Form Chiến dịch (CampaignModal - SRS 3.18.1)
function validateCampaignForm({ name, start_date, end_date, budget }) {
  const errors = {};

  if (!name || !name.trim()) {
    errors.name = 'Vui lòng nhập tên chiến dịch tiếp thị.';
  }

  if (!start_date) {
    errors.start_date = 'Vui lòng chọn ngày bắt đầu chiến dịch.';
  }

  if (!end_date) {
    errors.end_date = 'Vui lòng chọn ngày kết thúc chiến dịch.';
  }

  if (start_date && end_date) {
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      errors.dates = 'Định dạng ngày không hợp lệ.';
    } else if (end < start) {
      errors.end_date = 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.';
    }
  }

  if (budget !== undefined && budget !== null && budget !== '') {
    const b = Number(budget);
    if (isNaN(b) || b < 0) {
      errors.budget = 'Ngân sách phải là số lớn hơn hoặc bằng 0.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// 2. Logic Tính toán Đo lường ROI & Tỷ lệ Chuyển đổi (CampaignReportPage - SRS 3.19)
function calculateCampaignMetrics({ budget = 0, revenue = 0, totalLeads = 0, totalOrders = 0 }) {
  const b = Math.max(0, parseFloat(budget) || 0);
  const rev = Math.max(0, parseFloat(revenue) || 0);
  const leads = Math.max(0, parseInt(totalLeads, 10) || 0);
  const orders = Math.max(0, parseInt(totalOrders, 10) || 0);

  // ROI = (Doanh thu - Chi phí) / Chi phí * 100%
  const roi = b > 0 ? Number((((rev - b) / b) * 100).toFixed(2)) : 0;

  // Conversion Rate = (Orders / Leads) * 100%
  const conversionRate = leads > 0 ? Number(((orders / leads) * 100).toFixed(2)) : 0;

  return {
    budget: b,
    revenue: rev,
    roi,
    isRoiPositive: roi >= 0,
    conversionRate,
  };
}

// 3. Logic Xây dựng Query Params cho CampaignListPage (BR-03, BR-05, SRS 3.18)
function buildCampaignQueryParams({
  page = 1,
  limit = 20,
  search = '',
  status = '',
  from_date = '',
  to_date = '',
  sortBy = 'created_at',
  sortOrder = 'DESC',
}) {
  const params = {
    page: Math.max(1, parseInt(page, 10) || 1),
    limit: 20, // Ràng buộc cố định chuẩn BR-03
  };

  if (search && search.trim()) {
    params.search = search.trim();
  }

  if (status && ['ACTIVE', 'UPCOMING', 'ENDED'].includes(status.toUpperCase())) {
    params.status = status.toUpperCase();
  }

  if (from_date) {
    params.from_date = from_date;
  }

  if (to_date) {
    params.to_date = to_date;
  }

  const allowedSortFields = ['created_at', 'start_date', 'end_date', 'budget', 'name'];
  params.sortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
  params.sortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  return params;
}

// 4. Logic Tính tỷ trọng % Doanh thu Báo cáo Bán hàng (GeneralReportsPage - SRS 2.1)
function calculateRevenueShare(itemRevenue, grandTotal) {
  const rev = Math.max(0, parseFloat(itemRevenue) || 0);
  const total = Math.max(0, parseFloat(grandTotal) || 0);

  if (total <= 0) return 0;
  return Number(((rev / total) * 100).toFixed(2));
}

// 5. Logic Tính tỷ lệ hoàn thành kế hoạch năm (Achievement Rate - SRS 2.1)
function calculateYearTargetAchievement(yearRevenue, yearTarget) {
  const rev = Math.max(0, parseFloat(yearRevenue) || 0);
  const target = Math.max(0, parseFloat(yearTarget) || 0);

  if (target <= 0) return 0;
  return Number(((rev / target) * 100).toFixed(2));
}

describe('Frontend - Quản lý Chiến dịch & Báo cáo Doanh số (feat-017)', () => {
  describe('1. Validation Biểu mẫu Chiến dịch (CampaignModal - SRS 3.18.1)', () => {
    it('chấp nhận biểu mẫu hợp lệ với đầy đủ thông tin chuẩn', () => {
      const res = validateCampaignForm({
        name: 'Chiến dịch Mùa Thu 2026',
        start_date: '2026-10-01',
        end_date: '2026-10-31',
        budget: 50000000,
      });

      assert.strictEqual(res.isValid, true);
      assert.strictEqual(Object.keys(res.errors).length, 0);
    });

    it('từ chối khi tên chiến dịch để trống hoặc chỉ có khoảng trắng', () => {
      const res = validateCampaignForm({
        name: '   ',
        start_date: '2026-10-01',
        end_date: '2026-10-31',
        budget: 10000000,
      });

      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.name.includes('tên chiến dịch'));
    });

    it('từ chối khi thiếu ngày bắt đầu hoặc ngày kết thúc', () => {
      const res1 = validateCampaignForm({
        name: 'Chiến dịch Test',
        start_date: '',
        end_date: '2026-10-31',
      });
      assert.strictEqual(res1.isValid, false);
      assert.ok(res1.errors.start_date);

      const res2 = validateCampaignForm({
        name: 'Chiến dịch Test',
        start_date: '2026-10-01',
        end_date: '',
      });
      assert.strictEqual(res2.isValid, false);
      assert.ok(res2.errors.end_date);
    });

    it('từ chối khi ngày kết thúc nhỏ hơn ngày bắt đầu (end_date < start_date)', () => {
      const res = validateCampaignForm({
        name: 'Chiến dịch Ngược Ngày',
        start_date: '2026-10-20',
        end_date: '2026-10-10',
      });

      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.end_date.includes('lớn hơn hoặc bằng ngày bắt đầu'));
    });

    it('chấp nhận khi ngày bắt đầu trùng ngày kết thúc (chiến dịch 1 ngày)', () => {
      const res = validateCampaignForm({
        name: 'Chiến dịch Flash Sale',
        start_date: '2026-10-15',
        end_date: '2026-10-15',
        budget: 5000000,
      });

      assert.strictEqual(res.isValid, true);
    });

    it('từ chối khi ngân sách là số âm', () => {
      const res = validateCampaignForm({
        name: 'Chiến dịch Budget Âm',
        start_date: '2026-10-01',
        end_date: '2026-10-31',
        budget: -1000000,
      });

      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.budget.includes('lớn hơn hoặc bằng 0'));
    });
  });

  describe('2. Đo lường Hiệu quả & Chỉ số ROI (CampaignReportPage - SRS 3.19)', () => {
    it('tính toán ROI dương chính xác khi Doanh thu vượt Ngân sách', () => {
      // Budget: 10,000,000 - Revenue: 35,000,000 -> ROI = (35M - 10M)/10M * 100 = 250%
      const metrics = calculateCampaignMetrics({
        budget: 10000000,
        revenue: 35000000,
        totalLeads: 20,
        totalOrders: 5,
      });

      assert.strictEqual(metrics.roi, 250);
      assert.strictEqual(metrics.isRoiPositive, true);
      assert.strictEqual(metrics.conversionRate, 25); // 5 orders / 20 leads = 25%
    });

    it('tính toán ROI âm chính xác khi Doanh thu thấp hơn Ngân sách', () => {
      // Budget: 20,000,000 - Revenue: 5,000,000 -> ROI = (5M - 20M)/20M * 100 = -75%
      const metrics = calculateCampaignMetrics({
        budget: 20000000,
        revenue: 5000000,
        totalLeads: 10,
        totalOrders: 1,
      });

      assert.strictEqual(metrics.roi, -75);
      assert.strictEqual(metrics.isRoiPositive, false);
      assert.strictEqual(metrics.conversionRate, 10);
    });

    it('xử lý an toàn khi ngân sách bằng 0 (tránh chia cho 0)', () => {
      const metrics = calculateCampaignMetrics({
        budget: 0,
        revenue: 15000000,
        totalLeads: 0,
        totalOrders: 0,
      });

      assert.strictEqual(metrics.roi, 0);
      assert.strictEqual(metrics.conversionRate, 0);
    });
  });

  describe('3. Xây dựng Query Params danh sách (CampaignListPage - BR-03, BR-05)', () => {
    it('luôn áp dụng phân trang chuẩn 20 dòng theo BR-03', () => {
      const params = buildCampaignQueryParams({ page: 2, limit: 50 });
      assert.strictEqual(params.page, 2);
      assert.strictEqual(params.limit, 20); // Phải cưỡng chế 20 dòng theo BR-03
    });

    it('xử lý bộ lọc trạng thái và khoảng ngày BR-05', () => {
      const params = buildCampaignQueryParams({
        page: 1,
        search: '  Thu Đông 2026  ',
        status: 'active',
        from_date: '2026-10-01',
        to_date: '2026-10-31',
        sortBy: 'budget',
        sortOrder: 'DESC',
      });

      assert.strictEqual(params.search, 'Thu Đông 2026');
      assert.strictEqual(params.status, 'ACTIVE');
      assert.strictEqual(params.from_date, '2026-10-01');
      assert.strictEqual(params.to_date, '2026-10-31');
      assert.strictEqual(params.sortBy, 'budget');
      assert.strictEqual(params.sortOrder, 'DESC');
    });
  });

  describe('4. Báo cáo Doanh số & Tỷ trọng % Đóng góp (GeneralReportsPage - SRS 2.1)', () => {
    it('tính tỷ trọng % doanh thu theo từng sản phẩm chính xác', () => {
      const grandTotal = 100000000; // 100 triệu
      const productARev = 45000000;  // 45 triệu -> 45%
      const productBRev = 35000000;  // 35 triệu -> 35%

      assert.strictEqual(calculateRevenueShare(productARev, grandTotal), 45);
      assert.strictEqual(calculateRevenueShare(productBRev, grandTotal), 35);
    });

    it('tính tỷ lệ hoàn thành chỉ tiêu doanh số năm tài chính', () => {
      const yearTarget = 1000000000; // 1 tỷ
      const yearRevenue = 750000000;  // 750 triệu -> 75%

      assert.strictEqual(calculateYearTargetAchievement(yearRevenue, yearTarget), 75);
    });

    it('xử lý an toàn khi tổng doanh thu hoặc chỉ tiêu bằng 0', () => {
      assert.strictEqual(calculateRevenueShare(5000000, 0), 0);
      assert.strictEqual(calculateYearTargetAchievement(5000000, 0), 0);
    });
  });
});
