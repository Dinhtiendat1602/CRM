const db = require('../config/db');

/**
 * Controller Báo cáo Bán hàng & Thống kê Toàn diện (Sales & Business Reporting Module)
 * Tuân thủ SRS v1.1 Mục 2.1 (Role Responsibilities: Quản trị Báo cáo cho Sale Manager)
 */

/**
 * SRS 2.1: Báo cáo Thống kê Tổng quan (Quick Executive Summary)
 * Trả về chỉ số hôm nay, tháng này, năm nay cho Lead, Order và Doanh thu
 * GET /api/reports/summary
 */
exports.getSummaryReport = async (req, res, next) => {
  try {
    const currentYear = new Date().getFullYear();

    // 1. Thống kê Khách hàng tiềm năng (Leads)
    const leadsQuery = `
      SELECT
        COUNT(*) FILTER (WHERE entered_date = CURRENT_DATE) AS today_leads,
        COUNT(*) FILTER (WHERE entered_date >= DATE_TRUNC('month', CURRENT_DATE)) AS month_leads,
        COUNT(*) FILTER (WHERE entered_date >= DATE_TRUNC('year', CURRENT_DATE)) AS year_leads,
        COUNT(*) AS total_leads
      FROM leads;
    `;
    const leadsRes = await db.query(leadsQuery);
    const leadsStats = leadsRes.rows[0];

    // 2. Thống kê Đơn hàng & Doanh thu (Orders & Revenue)
    const ordersQuery = `
      SELECT
        COUNT(*) FILTER (WHERE order_date::date = CURRENT_DATE) AS today_orders,
        COUNT(*) FILTER (WHERE order_date >= DATE_TRUNC('month', CURRENT_DATE)) AS month_orders,
        COUNT(*) FILTER (WHERE order_date >= DATE_TRUNC('year', CURRENT_DATE)) AS year_orders,
        COUNT(*) AS total_orders,
        COALESCE(SUM(total_amount) FILTER (WHERE order_date::date = CURRENT_DATE), 0) AS today_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE order_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS month_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE order_date >= DATE_TRUNC('year', CURRENT_DATE)), 0) AS year_revenue,
        COALESCE(SUM(total_amount), 0) AS total_revenue
      FROM orders;
    `;
    const ordersRes = await db.query(ordersQuery);
    const ordersStats = ordersRes.rows[0];

    // 3. Thống kê Cơ hội bán hàng (Opportunities)
    const oppsQuery = `
      SELECT
        COUNT(*) AS total_opportunities,
        COUNT(*) FILTER (WHERE opp.status = 'ORDERED') AS closed_won_opportunities,
        COUNT(*) FILTER (WHERE opp.status NOT IN ('ORDERED', 'LOST')) AS open_opportunities,
        COALESCE(SUM(opp.quantity * p.unit_price) FILTER (WHERE opp.status NOT IN ('ORDERED', 'LOST')), 0) AS pipeline_value
      FROM opportunities opp
      JOIN products p ON opp.product_id = p.id;
    `;
    const oppsRes = await db.query(oppsQuery);
    const oppsStats = oppsRes.rows[0];

    // 4. Lấy chỉ tiêu kế hoạch năm hiện tại trong bảng sale_forecasts (nếu có)
    const forecastQuery = `
      SELECT COALESCE(SUM(target_amount), 0) AS year_target
      FROM sale_forecasts
      WHERE fiscal_year = $1;
    `;
    const forecastRes = await db.query(forecastQuery, [currentYear]);
    const yearTarget = parseFloat(forecastRes.rows[0]?.year_target || 0);

    const yearRevenue = parseFloat(ordersStats.year_revenue || 0);
    const targetAchievementRate = yearTarget > 0 ? Number(((yearRevenue / yearTarget) * 100).toFixed(2)) : 0;

    // Tỷ lệ chuyển đổi tổng thể (Leads -> Orders)
    const totalLeadsNum = parseInt(leadsStats.total_leads, 10) || 0;
    const totalOrdersNum = parseInt(ordersStats.total_orders, 10) || 0;
    const globalConversionRate = totalLeadsNum > 0 ? Number(((totalOrdersNum / totalLeadsNum) * 100).toFixed(2)) : 0;

    return res.status(200).json({
      success: true,
      data: {
        today: {
          leads: parseInt(leadsStats.today_leads, 10) || 0,
          orders: parseInt(ordersStats.today_orders, 10) || 0,
          revenue: parseFloat(ordersStats.today_revenue) || 0,
        },
        month: {
          leads: parseInt(leadsStats.month_leads, 10) || 0,
          orders: parseInt(ordersStats.month_orders, 10) || 0,
          revenue: parseFloat(ordersStats.month_revenue) || 0,
        },
        year: {
          leads: parseInt(leadsStats.year_leads, 10) || 0,
          orders: parseInt(ordersStats.year_orders, 10) || 0,
          revenue: yearRevenue,
          target: yearTarget,
          achievement_rate: targetAchievementRate,
        },
        pipeline: {
          total_opportunities: parseInt(oppsStats.total_opportunities, 10) || 0,
          open_opportunities: parseInt(oppsStats.open_opportunities, 10) || 0,
          closed_won_opportunities: parseInt(oppsStats.closed_won_opportunities, 10) || 0,
          pipeline_value: parseFloat(oppsStats.pipeline_value) || 0,
          conversion_rate: globalConversionRate,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 2.1: Báo cáo Thống kê Khách hàng tiềm năng (Leads Reporting)
 * Chuỗi thời gian theo Ngày/Tháng và phân tích theo Nguồn Chiến dịch
 * GET /api/reports/leads
 */
exports.getLeadReport = async (req, res, next) => {
  try {
    const { from_date, to_date, period = 'month' } = req.query;

    const conditions = [];
    const values = [];

    if (from_date) {
      values.push(from_date);
      conditions.push(`l.entered_date >= $${values.length}::date`);
    }
    if (to_date) {
      values.push(to_date);
      conditions.push(`l.entered_date <= $${values.length}::date`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 1. Chuỗi thời gian theo ngày hoặc theo tháng
    const truncUnit = period.toLowerCase() === 'day' ? 'day' : 'month';
    const dateFormat = period.toLowerCase() === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM';

    const timeSeriesQuery = `
      SELECT
        TO_CHAR(DATE_TRUNC('${truncUnit}', l.entered_date), '${dateFormat}') AS time_bucket,
        COUNT(*) AS leads_count
      FROM leads l
      ${whereClause}
      GROUP BY time_bucket
      ORDER BY time_bucket ASC;
    `;
    const timeSeriesRes = await db.query(timeSeriesQuery, values);

    // 2. Phân bổ Leads theo Nguồn Chiến dịch (By Campaign)
    const byCampaignQuery = `
      SELECT
        COALESCE(c.id, 0) AS campaign_id,
        COALESCE(c.name, 'Trực tiếp / Không qua chiến dịch') AS campaign_name,
        COUNT(l.id) AS leads_count,
        COUNT(DISTINCT opp.id) AS opportunities_count,
        COUNT(DISTINCT ord.id) AS orders_count
      FROM leads l
      LEFT JOIN campaigns c ON l.campaign_id = c.id
      LEFT JOIN opportunities opp ON opp.lead_id = l.id
      LEFT JOIN orders ord ON ord.lead_id = l.id
      ${whereClause}
      GROUP BY c.id, c.name
      ORDER BY leads_count DESC;
    `;
    const byCampaignRes = await db.query(byCampaignQuery, values);

    // 3. Phân bổ Leads theo nhân viên phụ trách (By Assigned User)
    const byUserQuery = `
      SELECT
        COALESCE(u.id, 0) AS user_id,
        COALESCE(u.full_name, 'Chưa phân công') AS staff_name,
        COUNT(l.id) AS leads_count
      FROM leads l
      LEFT JOIN users u ON l.assigned_to = u.id
      ${whereClause}
      GROUP BY u.id, u.full_name
      ORDER BY leads_count DESC;
    `;
    const byUserRes = await db.query(byUserQuery, values);

    return res.status(200).json({
      success: true,
      data: {
        time_series: timeSeriesRes.rows,
        by_campaign: byCampaignRes.rows,
        by_user: byUserRes.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 2.1: Báo cáo Thống kê Đơn hàng (Orders Reporting)
 * GET /api/reports/orders
 */
exports.getOrderReport = async (req, res, next) => {
  try {
    const { from_date, to_date, period = 'month' } = req.query;

    const conditions = [];
    const values = [];

    if (from_date) {
      values.push(from_date);
      conditions.push(`ord.order_date >= $${values.length}::timestamp`);
    }
    if (to_date) {
      values.push(`${to_date} 23:59:59.999`);
      conditions.push(`ord.order_date <= $${values.length}::timestamp`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const truncUnit = period.toLowerCase() === 'day' ? 'day' : 'month';
    const dateFormat = period.toLowerCase() === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM';

    // 1. Chuỗi thời gian số lượng đơn hàng & giá trị trung bình đơn (AOV)
    const timeSeriesQuery = `
      SELECT
        TO_CHAR(DATE_TRUNC('${truncUnit}', ord.order_date), '${dateFormat}') AS time_bucket,
        COUNT(*) AS orders_count,
        COALESCE(SUM(ord.total_amount), 0) AS revenue,
        ROUND(COALESCE(AVG(ord.total_amount), 0), 2) AS average_order_value
      FROM orders ord
      ${whereClause}
      GROUP BY time_bucket
      ORDER BY time_bucket ASC;
    `;
    const timeSeriesRes = await db.query(timeSeriesQuery, values);

    // 2. Thống kê theo trạng thái đơn hàng
    const byStatusQuery = `
      SELECT
        ord.status,
        COUNT(*) AS count,
        COALESCE(SUM(ord.total_amount), 0) AS total_amount
      FROM orders ord
      ${whereClause}
      GROUP BY ord.status;
    `;
    const byStatusRes = await db.query(byStatusQuery, values);

    // 3. Top nhân viên chốt đơn hiệu quả nhất
    const byStaffQuery = `
      SELECT
        COALESCE(u.id, 0) AS staff_id,
        COALESCE(u.full_name, 'Hệ thống') AS staff_name,
        COUNT(ord.id) AS orders_count,
        COALESCE(SUM(ord.total_amount), 0) AS total_revenue
      FROM orders ord
      LEFT JOIN users u ON ord.created_by = u.id
      ${whereClause}
      GROUP BY u.id, u.full_name
      ORDER BY total_revenue DESC;
    `;
    const byStaffRes = await db.query(byStaffQuery, values);

    return res.status(200).json({
      success: true,
      data: {
        time_series: timeSeriesRes.rows,
        by_status: byStatusRes.rows,
        by_staff: byStaffRes.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 2.1: Báo cáo Thống kê Doanh thu theo Sản phẩm & Danh mục (Revenue Reporting)
 * - Doanh thu theo Ngày / Tháng / Năm
 * - Phân bổ theo từng Sản phẩm (Revenue by Product)
 * - Phân bổ theo Danh mục sản phẩm (Revenue by Category)
 * GET /api/reports/revenue
 */
exports.getRevenueReport = async (req, res, next) => {
  try {
    const { from_date, to_date, period = 'month' } = req.query;

    const conditions = [];
    const values = [];

    if (from_date) {
      values.push(from_date);
      conditions.push(`ord.order_date >= $${values.length}::timestamp`);
    }
    if (to_date) {
      values.push(`${to_date} 23:59:59.999`);
      conditions.push(`ord.order_date <= $${values.length}::timestamp`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const truncUnit = period.toLowerCase() === 'day' ? 'day' : 'month';
    const dateFormat = period.toLowerCase() === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM';

    // 1. Chuỗi thời gian doanh thu
    const timeSeriesQuery = `
      SELECT
        TO_CHAR(DATE_TRUNC('${truncUnit}', ord.order_date), '${dateFormat}') AS time_bucket,
        COALESCE(SUM(ord.total_amount), 0) AS revenue,
        COALESCE(SUM(ord.quantity), 0) AS items_sold
      FROM orders ord
      ${whereClause}
      GROUP BY time_bucket
      ORDER BY time_bucket ASC;
    `;
    const timeSeriesRes = await db.query(timeSeriesQuery, values);

    // 2. Tổng doanh thu toàn bộ kỳ lọc để tính % tỷ trọng
    const totalRevQuery = `
      SELECT COALESCE(SUM(ord.total_amount), 0) AS total_revenue
      FROM orders ord
      ${whereClause};
    `;
    const totalRevRes = await db.query(totalRevQuery, values);
    const grandTotal = parseFloat(totalRevRes.rows[0].total_revenue) || 0;

    // 3. Phân bổ Doanh thu theo từng Sản phẩm (SRS 2.1: Revenue by Product)
    const byProductQuery = `
      SELECT
        p.id AS product_id,
        p.product_code,
        p.name AS product_name,
        pc.name AS category_name,
        COUNT(ord.id) AS orders_count,
        COALESCE(SUM(ord.quantity), 0) AS units_sold,
        COALESCE(SUM(ord.total_amount), 0) AS revenue
      FROM orders ord
      JOIN products p ON ord.product_id = p.id
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      ${whereClause}
      GROUP BY p.id, p.product_code, p.name, pc.name
      ORDER BY revenue DESC;
    `;
    const byProductRes = await db.query(byProductQuery, values);

    const byProductWithShare = byProductRes.rows.map((row) => {
      const rev = parseFloat(row.revenue);
      const share = grandTotal > 0 ? Number(((rev / grandTotal) * 100).toFixed(2)) : 0;
      return {
        ...row,
        revenue: rev,
        revenue_share: share,
      };
    });

    // 4. Phân bổ Doanh thu theo Danh mục sản phẩm (Revenue by Category)
    const byCategoryQuery = `
      SELECT
        COALESCE(pc.id, 0) AS category_id,
        COALESCE(pc.name, 'Chưa phân danh mục') AS category_name,
        COUNT(ord.id) AS orders_count,
        COALESCE(SUM(ord.quantity), 0) AS units_sold,
        COALESCE(SUM(ord.total_amount), 0) AS revenue
      FROM orders ord
      JOIN products p ON ord.product_id = p.id
      LEFT JOIN product_categories pc ON p.category_id = pc.id
      ${whereClause}
      GROUP BY pc.id, pc.name
      ORDER BY revenue DESC;
    `;
    const byCategoryRes = await db.query(byCategoryQuery, values);

    const byCategoryWithShare = byCategoryRes.rows.map((row) => {
      const rev = parseFloat(row.revenue);
      const share = grandTotal > 0 ? Number(((rev / grandTotal) * 100).toFixed(2)) : 0;
      return {
        ...row,
        revenue: rev,
        revenue_share: share,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        grand_total: grandTotal,
        time_series: timeSeriesRes.rows,
        by_product: byProductWithShare,
        by_category: byCategoryWithShare,
      },
    });
  } catch (error) {
    next(error);
  }
};
