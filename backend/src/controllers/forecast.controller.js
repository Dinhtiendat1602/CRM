const db = require('../config/db');

/**
 * Controller Lập Kế hoạch Doanh số 12 Tháng & Báo cáo Đối soát Performance (Sales Forecast & Planning Module)
 * Tuân thủ SRS v1.1 Mục 3.20 (Setup Plan 12 tháng) & Mục 3.21 (Performance Report Plan vs Actual)
 * Ràng buộc nghiệp vụ BR-07: Toán tử so sánh Kế hoạch vs Thực tế
 */

/**
 * SRS 3.20: Thiết lập / Cập nhật Kế hoạch Doanh số 12 Tháng của Năm tài chính
 * POST /api/forecasts/setup
 * Body:
 * {
 *   "fiscal_year": 2026,
 *   "plans": [
 *     { "month": 1, "target_amount": 100000000 },
 *     ...
 *     { "month": 12, "target_amount": 150000000 }
 *   ]
 * }
 * Hoặc Body targets: { "1": 100000000, "2": ... }
 */
exports.setupPlan = async (req, res, next) => {
  try {
    const { fiscal_year, plans, targets } = req.body;

    const year = parseInt(fiscal_year, 10);
    if (!year || isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Năm tài chính (fiscal_year) không hợp lệ (phải từ 2000 đến 2100).',
      });
    }

    // Chuẩn hóa danh sách plans từ mảng hoặc từ object targets
    const normalizedPlans = [];

    if (Array.isArray(plans)) {
      for (const item of plans) {
        const m = parseInt(item.month, 10);
        const amt = parseFloat(item.target_amount);
        if (!isNaN(m) && m >= 1 && m <= 12) {
          if (isNaN(amt) || amt < 0) {
            return res.status(400).json({
              success: false,
              message: `Chỉ tiêu doanh thu Tháng ${m} phải là số lớn hơn hoặc bằng 0 (SRS 3.20).`,
            });
          }
          normalizedPlans.push({ month: m, target_amount: amt });
        }
      }
    } else if (targets && typeof targets === 'object') {
      for (let m = 1; m <= 12; m++) {
        if (targets[m] !== undefined && targets[m] !== null) {
          const amt = parseFloat(targets[m]);
          if (isNaN(amt) || amt < 0) {
            return res.status(400).json({
              success: false,
              message: `Chỉ tiêu doanh thu Tháng ${m} phải là số lớn hơn hoặc bằng 0 (SRS 3.20).`,
            });
          }
          normalizedPlans.push({ month: m, target_amount: amt });
        }
      }
    }

    if (normalizedPlans.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách kế hoạch chỉ tiêu (plans) cho ít nhất 1 tháng (SRS 3.20).',
      });
    }

    const client = await db.pool.connect();

    try {
      let createdBy = null;
      if (req.user && req.user.id) {
        const uRes = await client.query('SELECT id FROM users WHERE id = $1', [req.user.id]);
        if (uRes.rows.length > 0) createdBy = req.user.id;
      }

      // Thực hiện lưu kế hoạch với PostgreSQL Database Transaction
      await client.query('BEGIN');

    const upsertQuery = `
      INSERT INTO sale_forecasts (fiscal_year, month, target_amount, created_by, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (fiscal_year, month)
      DO UPDATE SET
        target_amount = EXCLUDED.target_amount,
        created_by = COALESCE(EXCLUDED.created_by, sale_forecasts.created_by),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    for (const p of normalizedPlans) {
      await client.query(upsertQuery, [year, p.month, p.target_amount, createdBy]);
    }

    await client.query('COMMIT');

    // Truy vấn lại đầy đủ 12 tháng của năm tài chính sau khi lưu
    const fullYearQuery = `
      SELECT
        m.month,
        ('Tháng ' || m.month) AS month_label,
        COALESCE(sf.target_amount, 0) AS target_amount,
        sf.fiscal_year,
        sf.updated_at
      FROM generate_series(1, 12) AS m(month)
      LEFT JOIN sale_forecasts sf ON sf.month = m.month AND sf.fiscal_year = $1
      ORDER BY m.month ASC;
    `;
    const fullRes = await db.query(fullYearQuery, [year]);

    const totalYearPlan = fullRes.rows.reduce(
      (sum, r) => sum + parseFloat(r.target_amount || 0),
      0
    );

    return res.status(200).json({
      success: true,
      message: `Thiết lập kế hoạch doanh số 12 tháng năm tài chính ${year} thành công!`,
      data: {
        fiscal_year: year,
        total_plan: totalYearPlan,
        plans: fullRes.rows.map((r) => ({
          month: r.month,
          month_label: r.month_label,
          target_amount: parseFloat(r.target_amount),
          updated_at: r.updated_at,
        })),
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.20: Lấy kế hoạch doanh số 12 tháng của một năm tài chính
 * GET /api/forecasts/plans?fiscal_year=2026
 */
exports.getPlansByYear = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();
    const year = parseInt(req.query.fiscal_year, 10) || currentYear;

    const query = `
      SELECT
        m.month,
        ('Tháng ' || m.month) AS month_label,
        COALESCE(sf.target_amount, 0) AS target_amount,
        COALESCE(sf.fiscal_year, $1) AS fiscal_year,
        u.full_name AS updated_by_name,
        sf.updated_at
      FROM generate_series(1, 12) AS m(month)
      LEFT JOIN sale_forecasts sf ON sf.month = m.month AND sf.fiscal_year = $1
      LEFT JOIN users u ON sf.created_by = u.id
      ORDER BY m.month ASC;
    `;
    const result = await db.query(query, [year]);

    const totalYearPlan = result.rows.reduce(
      (sum, r) => sum + parseFloat(r.target_amount || 0),
      0
    );

    return res.status(200).json({
      success: true,
      data: {
        fiscal_year: year,
        total_plan: totalYearPlan,
        plans: result.rows.map((r) => ({
          month: r.month,
          month_label: r.month_label,
          target_amount: parseFloat(r.target_amount),
          updated_by_name: r.updated_by_name,
          updated_at: r.updated_at,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.21: Báo cáo Đối soát Kế hoạch vs Thực tế 12 Tháng (Performance Report)
 * Bảng đối soát: Month | Plan($) | Actually Value($) | % (SRS 3.21.3 REQ-1 & BR-07)
 * GET /api/forecasts/performance?fiscal_year=2026
 */
exports.getPerformanceReport = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();
    const year = parseInt(req.query.fiscal_year, 10) || currentYear;

    // Truy vấn tổng hợp đối soát 12 tháng bằng SQL LEFT JOIN giữa sale_forecasts và orders
    const reportQuery = `
      WITH months AS (
        SELECT generate_series(1, 12) AS month
      ),
      actuals AS (
        SELECT
          EXTRACT(MONTH FROM order_date)::int AS month,
          COUNT(id) AS orders_count,
          COALESCE(SUM(quantity), 0) AS items_sold,
          COALESCE(SUM(total_amount), 0) AS actually_value
        FROM orders
        WHERE EXTRACT(YEAR FROM order_date)::int = $1
        GROUP BY EXTRACT(MONTH FROM order_date)
      ),
      plans AS (
        SELECT
          month,
          target_amount AS plan_value
        FROM sale_forecasts
        WHERE fiscal_year = $1
      )
      SELECT
        m.month,
        ('Tháng ' || m.month) AS month_label,
        COALESCE(p.plan_value, 0) AS plan,
        COALESCE(a.actually_value, 0) AS actually_value,
        COALESCE(a.orders_count, 0) AS orders_count,
        COALESCE(a.items_sold, 0) AS items_sold,
        CASE
          WHEN COALESCE(p.plan_value, 0) > 0 THEN
            ROUND(((COALESCE(a.actually_value, 0) / p.plan_value) * 100)::numeric, 2)
          ELSE 0
        END AS percentage,
        ROUND((COALESCE(a.actually_value, 0) - COALESCE(p.plan_value, 0))::numeric, 2) AS variance
      FROM months m
      LEFT JOIN plans p ON m.month = p.month
      LEFT JOIN actuals a ON m.month = a.month
      ORDER BY m.month ASC;
    `;

    const reportRes = await db.query(reportQuery, [year]);
    const months = reportRes.rows.map((r) => ({
      month: r.month,
      month_label: r.month_label,
      plan: parseFloat(r.plan),
      actually_value: parseFloat(r.actually_value),
      orders_count: parseInt(r.orders_count, 10),
      items_sold: parseInt(r.items_sold, 10),
      percentage: parseFloat(r.percentage),
      variance: parseFloat(r.variance),
    }));

    // Tổng hợp KPI cả năm
    const totalPlan = months.reduce((sum, m) => sum + m.plan, 0);
    const totalActual = months.reduce((sum, m) => sum + m.actually_value, 0);
    const totalOrders = months.reduce((sum, m) => sum + m.orders_count, 0);
    const totalItems = months.reduce((sum, m) => sum + m.items_sold, 0);
    const totalVariance = totalActual - totalPlan;

    // BR-07: Tỷ lệ % hoàn thành cả năm = (Actually / Plan) * 100
    const overallPercentage = totalPlan > 0
      ? Number(((totalActual / totalPlan) * 100).toFixed(2))
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        fiscal_year: year,
        summary: {
          total_plan: totalPlan,
          total_actual: totalActual,
          total_orders: totalOrders,
          total_items_sold: totalItems,
          overall_percentage: overallPercentage,
          variance: totalVariance,
        },
        months,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper: Lấy danh sách các năm tài chính khả dụng có dữ liệu
 * GET /api/forecasts/years
 */
exports.getAvailableYears = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();

    const query = `
      SELECT DISTINCT fiscal_year AS year FROM sale_forecasts
      UNION
      SELECT DISTINCT EXTRACT(YEAR FROM order_date)::int AS year FROM orders
      ORDER BY year DESC;
    `;
    const result = await db.query(query);

    let years = result.rows.map((r) => r.year).filter(Boolean);

    // Luôn đảm bảo có năm hiện tại và năm tiếp theo trong danh sách chọn
    if (!years.includes(currentYear)) {
      years.push(currentYear);
    }
    if (!years.includes(currentYear + 1)) {
      years.push(currentYear + 1);
    }

    years = Array.from(new Set(years)).sort((a, b) => b - a);

    return res.status(200).json({
      success: true,
      data: years,
    });
  } catch (error) {
    next(error);
  }
};
