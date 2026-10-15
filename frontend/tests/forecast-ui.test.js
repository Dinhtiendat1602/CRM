import { describe, it } from 'node:test';
import assert from 'node:assert';

/**
 * Test Suite Frontend Lập Kế hoạch Doanh số & Báo cáo Đối soát Performance UI (feat-019)
 * Tuân thủ SRS v1.1 Mục 3.20 (Setup Plan), Mục 3.21 (Performance Report), BR-07 (% = Actually/Plan * 100)
 */

// 1. Logic Kiểm tra Tính hợp lệ của Năm tài chính và Chỉ tiêu (SRS 3.20)
function validateFiscalYear(year) {
  const y = parseInt(year, 10);
  if (isNaN(y) || y < 2000 || y > 2100) {
    return { isValid: false, message: 'Năm tài chính phải nằm trong khoảng từ 2000 đến 2100.' };
  }
  return { isValid: true, year: y };
}

function validateMonthlyTarget(amount) {
  const num = Number(amount);
  if (isNaN(num) || num < 0) {
    return { isValid: false, message: 'Chỉ tiêu doanh số phải là số lớn hơn hoặc bằng 0.' };
  }
  return { isValid: true, amount: num };
}

// 2. Logic Tính toán Kế hoạch (Tổng năm, Trung bình tháng, Phân bổ 4 Quý - SetupPlanPage)
function calculatePlanSummary(targets = {}) {
  let totalYear = 0;
  const quarterly = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 };

  for (let m = 1; m <= 12; m++) {
    const val = parseFloat(targets[m]) || 0;
    totalYear += val;

    if (m <= 3) quarterly.Q1 += val;
    else if (m <= 6) quarterly.Q2 += val;
    else if (m <= 9) quarterly.Q3 += val;
    else quarterly.Q4 += val;
  }

  const monthlyAverage = totalYear / 12;

  return {
    totalYear,
    monthlyAverage: Math.round(monthlyAverage),
    quarterly,
  };
}

// 3. Logic Tính Tỷ trọng % của từng tháng trong năm
function calculateMonthlyShare(monthTarget, totalYear) {
  const target = parseFloat(monthTarget) || 0;
  const total = parseFloat(totalYear) || 0;
  if (total <= 0) return 0;
  return Number(((target / total) * 100).toFixed(1));
}

// 4. Logic Công cụ Phân bổ Nhanh (Smart Allocation Tools)
function applyEvenSplit(totalAmount) {
  const total = parseFloat(totalAmount) || 0;
  if (total <= 0) return null;
  const perMonth = Math.round(total / 12);
  const targets = {};
  for (let m = 1; m <= 12; m++) {
    targets[m] = perMonth;
  }
  return targets;
}

function applyGrowth(targets = {}, percent = 10) {
  const factor = 1 + percent / 100;
  const newTargets = {};
  for (let m = 1; m <= 12; m++) {
    newTargets[m] = Math.round((parseFloat(targets[m]) || 0) * factor);
  }
  return newTargets;
}

// 5. Logic Đối soát Hiệu suất BR-07 & Đánh giá Trạng thái (SRS 3.21)
function calculatePerformanceMetrics(plan, actually) {
  const p = Math.max(0, parseFloat(plan) || 0);
  const a = Math.max(0, parseFloat(actually) || 0);

  // BR-07: % = (Actually / Plan) * 100. Khi Plan = 0 thì % = 0
  let percentage = 0;
  if (p > 0) {
    percentage = Number(((a / p) * 100).toFixed(2));
  }

  const variance = a - p;

  let status = 'Chưa đạt';
  if (percentage >= 100) {
    status = 'Vượt chỉ tiêu';
  } else if (percentage >= 80) {
    status = 'Đạt tốt';
  } else if (percentage >= 50) {
    status = 'Đang tiến triển';
  }

  return {
    plan: p,
    actually_value: a,
    percentage,
    variance,
    status,
  };
}

// 6. Logic Chuẩn bị Dữ liệu Biểu đồ Kết hợp Bar & Line cho Chart.js
function prepareChartData(monthlyReports = []) {
  const labels = monthlyReports.map((m) => `T${m.month}`);
  const planValues = monthlyReports.map((m) => m.plan);
  const actualValues = monthlyReports.map((m) => m.actually_value);
  const percentages = monthlyReports.map((m) => m.percentage);

  return {
    labels,
    datasets: [
      { type: 'bar', label: 'Plan', data: planValues },
      { type: 'bar', label: 'Actual', data: actualValues },
      { type: 'line', label: '%', data: percentages },
    ],
  };
}

describe('Frontend Forecast & Performance UI Test Suite (feat-019)', () => {
  describe('1. Validation Năm tài chính & Định mức tháng (SRS 3.20)', () => {
    it('chấp nhận năm tài chính hợp lệ từ 2000 đến 2100', () => {
      assert.strictEqual(validateFiscalYear(2026).isValid, true);
      assert.strictEqual(validateFiscalYear('2025').isValid, true);
      assert.strictEqual(validateFiscalYear(2000).isValid, true);
      assert.strictEqual(validateFiscalYear(2100).isValid, true);
    });

    it('từ chối năm tài chính nằm ngoài phạm vi hoặc không hợp lệ', () => {
      assert.strictEqual(validateFiscalYear(1999).isValid, false);
      assert.strictEqual(validateFiscalYear(2101).isValid, false);
      assert.strictEqual(validateFiscalYear('abc').isValid, false);
      assert.strictEqual(validateFiscalYear(null).isValid, false);
    });

    it('kiểm tra định mức doanh số chỉ tiêu (>= 0)', () => {
      assert.strictEqual(validateMonthlyTarget(1000000).isValid, true);
      assert.strictEqual(validateMonthlyTarget('50000000').isValid, true);
      assert.strictEqual(validateMonthlyTarget(0).isValid, true);
      assert.strictEqual(validateMonthlyTarget(-500).isValid, false);
      assert.strictEqual(validateMonthlyTarget('không phải số').isValid, false);
    });
  });

  describe('2. Tính toán Kế hoạch Doanh số 12 Tháng (SRS 3.20)', () => {
    it('tính chính xác Tổng năm, Trung bình tháng và Phân bổ 4 Quý', () => {
      const sampleTargets = {
        1: 100000000, 2: 100000000, 3: 100000000, // Q1 = 300M
        4: 200000000, 5: 200000000, 6: 200000000, // Q2 = 600M
        7: 150000000, 8: 150000000, 9: 150000000, // Q3 = 450M
        10: 250000000, 11: 250000000, 12: 250000000, // Q4 = 750M
      };

      const summary = calculatePlanSummary(sampleTargets);
      assert.strictEqual(summary.totalYear, 2100000000); // 2.1 Tỷ
      assert.strictEqual(summary.monthlyAverage, 175000000); // 175 Triệu/tháng
      assert.strictEqual(summary.quarterly.Q1, 300000000);
      assert.strictEqual(summary.quarterly.Q2, 600000000);
      assert.strictEqual(summary.quarterly.Q3, 450000000);
      assert.strictEqual(summary.quarterly.Q4, 750000000);
      assert.strictEqual(
        summary.quarterly.Q1 + summary.quarterly.Q2 + summary.quarterly.Q3 + summary.quarterly.Q4,
        summary.totalYear
      );
    });

    it('tính chính xác tỷ trọng % từng tháng trên tổng năm', () => {
      const totalYear = 1000000000; // 1 Tỷ
      assert.strictEqual(calculateMonthlyShare(100000000, totalYear), 10.0);
      assert.strictEqual(calculateMonthlyShare(250000000, totalYear), 25.0);
      assert.strictEqual(calculateMonthlyShare(0, totalYear), 0.0);
      assert.strictEqual(calculateMonthlyShare(50000000, 0), 0); // tổng = 0 tránh chia cho 0
    });
  });

  describe('3. Công cụ Phân bổ Nhanh Kế hoạch (Smart Allocation Tools)', () => {
    it('chia đều tổng năm cho 12 tháng làm tròn chuẩn xác', () => {
      const splitTargets = applyEvenSplit(1200000000); // 1.2 Tỷ
      assert.notStrictEqual(splitTargets, null);
      for (let m = 1; m <= 12; m++) {
        assert.strictEqual(splitTargets[m], 100000000);
      }

      // Trường hợp số lẻ
      const splitOdd = applyEvenSplit(1000000000);
      assert.strictEqual(splitOdd[1], 83333333);
    });

    it('áp dụng tăng trưởng % đồng đều cho 12 tháng (+10%, +20%)', () => {
      const baseTargets = {
        1: 100000000, 2: 100000000, 3: 100000000, 4: 100000000,
        5: 100000000, 6: 100000000, 7: 100000000, 8: 100000000,
        9: 100000000, 10: 100000000, 11: 100000000, 12: 100000000,
      };

      const plus10 = applyGrowth(baseTargets, 10);
      assert.strictEqual(plus10[1], 110000000);
      assert.strictEqual(plus10[12], 110000000);

      const plus20 = applyGrowth(baseTargets, 20);
      assert.strictEqual(plus20[1], 120000000);
    });
  });

  describe('4. Báo cáo Đối soát Doanh số & BR-07 (SRS 3.21)', () => {
    it('tuân thủ đúng BR-07: % = (Actually / Plan) * 100 và khi Plan = 0 thì % = 0', () => {
      // Trường hợp đạt 100%
      const res100 = calculatePerformanceMetrics(100000000, 100000000);
      assert.strictEqual(res100.percentage, 100.0);
      assert.strictEqual(res100.variance, 0);
      assert.strictEqual(res100.status, 'Vượt chỉ tiêu');

      // Trường hợp vượt chỉ tiêu 150%
      const res150 = calculatePerformanceMetrics(100000000, 150000000);
      assert.strictEqual(res150.percentage, 150.0);
      assert.strictEqual(res150.variance, 50000000);
      assert.strictEqual(res150.status, 'Vượt chỉ tiêu');

      // Trường hợp chưa đạt chỉ tiêu (50%)
      const res50 = calculatePerformanceMetrics(200000000, 100000000);
      assert.strictEqual(res50.percentage, 50.0);
      assert.strictEqual(res50.variance, -100000000);
      assert.strictEqual(res50.status, 'Đang tiến triển');

      // Trường hợp Plan = 0 -> Tỷ lệ phải là 0% theo BR-07
      const resZeroPlan = calculatePerformanceMetrics(0, 50000000);
      assert.strictEqual(resZeroPlan.percentage, 0);
      assert.strictEqual(resZeroPlan.variance, 50000000);
      assert.strictEqual(resZeroPlan.status, 'Chưa đạt');

      // Trường hợp cả hai đều là 0
      const resBothZero = calculatePerformanceMetrics(0, 0);
      assert.strictEqual(resBothZero.percentage, 0);
      assert.strictEqual(resBothZero.variance, 0);
      assert.strictEqual(resBothZero.status, 'Chưa đạt');
    });

    it('phân loại đúng 4 mức trạng thái đánh giá hoàn thành', () => {
      assert.strictEqual(calculatePerformanceMetrics(100, 120).status, 'Vượt chỉ tiêu');
      assert.strictEqual(calculatePerformanceMetrics(100, 90).status, 'Đạt tốt');
      assert.strictEqual(calculatePerformanceMetrics(100, 65).status, 'Đang tiến triển');
      assert.strictEqual(calculatePerformanceMetrics(100, 30).status, 'Chưa đạt');
    });
  });

  describe('5. Cấu hình Dữ liệu Biểu đồ Kết hợp Bar & Line Chart.js', () => {
    it('đóng gói đúng cấu trúc đa trục (2 Bar + 1 Line)', () => {
      const mockMonthly = [
        { month: 1, plan: 100, actually_value: 120, percentage: 120 },
        { month: 2, plan: 200, actually_value: 180, percentage: 90 },
      ];

      const chartConfig = prepareChartData(mockMonthly);
      assert.deepStrictEqual(chartConfig.labels, ['T1', 'T2']);
      assert.strictEqual(chartConfig.datasets.length, 3);
      assert.strictEqual(chartConfig.datasets[0].type, 'bar');
      assert.deepStrictEqual(chartConfig.datasets[0].data, [100, 200]);
      assert.strictEqual(chartConfig.datasets[1].type, 'bar');
      assert.deepStrictEqual(chartConfig.datasets[1].data, [120, 180]);
      assert.strictEqual(chartConfig.datasets[2].type, 'line');
      assert.deepStrictEqual(chartConfig.datasets[2].data, [120, 90]);
    });
  });
});
