const db = require('../config/db');

/**
 * Controller Tổng quan Dashboard (Command Center & Realtime Metrics)
 * Trích xuất toàn bộ dữ liệu thực tế từ Database cho giao diện người dùng
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const userRole = (req.user?.role || '').trim().toUpperCase();
    const userId = req.user?.id;
    const currentYear = new Date().getFullYear();

    // 1. Thống kê chung từ các bảng (Tối ưu trong 1 năm gần nhất)
    const [
      leadsCountRes,
      oppsCountRes,
      ordersCountRes,
      productsCountRes,
      categoriesCountRes,
      campaignsCountRes,
      usersCountRes,
      rolesCountRes,
      forecastRes
    ] = await Promise.all([
      db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE entered_date >= CURRENT_TIMESTAMP - INTERVAL '1 year') AS total,
          COUNT(*) FILTER (WHERE entered_date::date = CURRENT_DATE) AS today_leads,
          COUNT(*) FILTER (WHERE entered_date >= DATE_TRUNC('month', CURRENT_DATE)) AS month_leads
        FROM leads;
      `),
      db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE opp.created_at >= CURRENT_TIMESTAMP - INTERVAL '1 year') AS total,
          COUNT(*) FILTER (WHERE opp.status = 'ORDERED' AND opp.created_at >= CURRENT_TIMESTAMP - INTERVAL '1 year') AS closed_won,
          COUNT(*) FILTER (WHERE opp.status NOT IN ('ORDERED', 'LOST') AND opp.created_at >= CURRENT_TIMESTAMP - INTERVAL '1 year') AS open_opps,
          COALESCE(SUM(opp.quantity * p.unit_price) FILTER (WHERE opp.status NOT IN ('ORDERED', 'LOST') AND opp.created_at >= CURRENT_TIMESTAMP - INTERVAL '1 year'), 0) AS pipeline_value
        FROM opportunities opp
        JOIN products p ON opp.product_id = p.id;
      `),
      db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE order_date >= CURRENT_TIMESTAMP - INTERVAL '1 year') AS total,
          COUNT(*) FILTER (WHERE order_date::date = CURRENT_DATE) AS today_orders,
          COUNT(*) FILTER (WHERE order_date >= DATE_TRUNC('month', CURRENT_DATE)) AS month_orders,
          COALESCE(SUM(total_amount) FILTER (WHERE order_date >= CURRENT_TIMESTAMP - INTERVAL '1 year'), 0) AS total_revenue,
          COALESCE(SUM(total_amount) FILTER (WHERE order_date::date = CURRENT_DATE), 0) AS today_revenue,
          COALESCE(SUM(total_amount) FILTER (WHERE order_date >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS month_revenue
        FROM orders;
      `),
      db.query(`
        SELECT 
          COUNT(*) AS total,
          COALESCE(SUM(stock_qty), 0) AS total_stock
        FROM products;
      `),
      db.query(`SELECT COUNT(*) AS total FROM product_categories;`),
      db.query(`
        SELECT 
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE) AS active_campaigns,
          COUNT(*) FILTER (WHERE start_date > CURRENT_DATE) AS upcoming_campaigns,
          COALESCE(SUM(budget), 0) AS total_budget
        FROM campaigns;
      `),
      db.query(`
        SELECT 
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE is_active = true) AS active_users,
          COUNT(*) FILTER (WHERE is_active = false) AS inactive_users
        FROM users;
      `),
      db.query(`SELECT COUNT(*) AS total FROM roles;`),
      db.query(`
        SELECT COALESCE(SUM(target_amount), 0) AS total_target
        FROM sale_forecasts
        WHERE fiscal_year = $1;
      `, [currentYear])
    ]);

    const leadsTotal = parseInt(leadsCountRes.rows[0].total, 10) || 0;
    const oppsTotal = parseInt(oppsCountRes.rows[0].total, 10) || 0;
    const closedWonOpps = parseInt(oppsCountRes.rows[0].closed_won, 10) || 0;
    const ordersTotal = parseInt(ordersCountRes.rows[0].total, 10) || 0;
    const totalRevenue = parseFloat(ordersCountRes.rows[0].total_revenue) || 0;
    const yearTarget = parseFloat(forecastRes.rows[0].total_target) || 0;

    // Tính % hoàn thành kế hoạch năm
    const planCompletionPercent = yearTarget > 0 ? Number(((totalRevenue / yearTarget) * 100).toFixed(1)) : 0;
    // Tính Win Rate (Deal thành công / Tổng Opps)
    const winRatePercent = oppsTotal > 0 ? Number(((closedWonOpps / oppsTotal) * 100).toFixed(1)) : 0;

    // 2. Thống kê cá nhân nếu là SALESMAN
    let personalStats = null;
    if (userRole === 'SALESMAN' && userId) {
      const [myLeadsRes, myOppsRes, myOrdersRes] = await Promise.all([
        db.query(`SELECT COUNT(*) AS total FROM leads WHERE assigned_to = $1 AND entered_date >= CURRENT_TIMESTAMP - INTERVAL '1 year';`, [userId]),
        db.query(`
          SELECT 
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'ORDERED') AS closed_won
          FROM opportunities 
          WHERE created_by = $1 AND created_at >= CURRENT_TIMESTAMP - INTERVAL '1 year';
        `, [userId]),
        db.query(`
          SELECT 
            COUNT(*) AS total,
            COALESCE(SUM(total_amount), 0) AS total_revenue
          FROM orders 
          WHERE created_by = $1 AND order_date >= CURRENT_TIMESTAMP - INTERVAL '1 year';
        `, [userId])
      ]);

      const myOpps = parseInt(myOppsRes.rows[0].total, 10) || 0;
      const myWon = parseInt(myOppsRes.rows[0].closed_won, 10) || 0;
      const myWinRate = myOpps > 0 ? Number(((myWon / myOpps) * 100).toFixed(1)) : 0;

      personalStats = {
        myLeadsCount: parseInt(myLeadsRes.rows[0].total, 10) || 0,
        myOppsCount: myOpps,
        myOrdersCount: parseInt(myOrdersRes.rows[0].total, 10) || 0,
        myRevenue: parseFloat(myOrdersRes.rows[0].total_revenue) || 0,
        myWinRate: `${myWinRate}%`
      };
    }

    // 3. Trích xuất danh sách 5 đơn hàng mới nhất trong 1 năm gần nhất
    const recentOrdersRes = await db.query(`
      SELECT 
        o.id,
        o.order_code,
        o.order_date,
        o.total_amount,
        o.quantity,
        o.unit_price,
        o.lead_id,
        o.product_id,
        TRIM(CONCAT(l.first_name, ' ', l.last_name)) AS customer_name,
        p.name AS product_name,
        p.product_code,
        u.full_name AS salesman_name
      FROM orders o
      JOIN leads l ON o.lead_id = l.id
      JOIN products p ON o.product_id = p.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.order_date >= CURRENT_TIMESTAMP - INTERVAL '1 year'
      ORDER BY o.order_date DESC, o.id DESC
      LIMIT 5;
    `);

    // 4. Trích xuất danh sách 5 cơ hội mới nhất trong 1 năm gần nhất
    const recentOppsRes = await db.query(`
      SELECT 
        opp.id,
        opp.quantity,
        opp.status,
        opp.expected_close_date,
        opp.lead_id,
        opp.product_id,
        TRIM(CONCAT(l.first_name, ' ', l.last_name)) AS lead_name,
        p.name AS product_name,
        p.unit_price,
        (opp.quantity * p.unit_price) AS estimated_value,
        u.full_name AS salesman_name
      FROM opportunities opp
      JOIN leads l ON opp.lead_id = l.id
      JOIN products p ON opp.product_id = p.id
      LEFT JOIN users u ON opp.created_by = u.id
      WHERE opp.created_at >= CURRENT_TIMESTAMP - INTERVAL '1 year'
      ORDER BY opp.id DESC
      LIMIT 5;
    `);

    // 5. Trích xuất danh sách 5 khách hàng tiềm năng mới nhất trong 1 năm gần nhất
    const recentLeadsRes = await db.query(`
      SELECT 
        l.id,
        TRIM(CONCAT(l.first_name, ' ', l.last_name)) AS name,
        l.email,
        l.phone,
        l.career,
        l.entered_date,
        l.campaign_id,
        c.name AS campaign_name,
        u.full_name AS assigned_to_name
      FROM leads l
      LEFT JOIN campaigns c ON l.campaign_id = c.id
      LEFT JOIN users u ON l.assigned_to = u.id
      WHERE l.entered_date >= CURRENT_TIMESTAMP - INTERVAL '1 year'
      ORDER BY l.entered_date DESC, l.id DESC
      LIMIT 5;
    `);

    // 6. Trích xuất 5 người dùng mới nhất (cho Admin)
    let recentUsers = [];
    if (userRole === 'ADMIN') {
      const recentUsersRes = await db.query(`
        SELECT 
          u.id,
          u.username,
          u.email,
          u.full_name,
          u.is_active,
          u.created_at,
          r.name AS role_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        ORDER BY u.id DESC
        LIMIT 5;
      `);
      recentUsers = recentUsersRes.rows;
    }

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          leadsCount: leadsTotal,
          todayLeadsCount: parseInt(leadsCountRes.rows[0].today_leads, 10) || 0,
          monthLeadsCount: parseInt(leadsCountRes.rows[0].month_leads, 10) || 0,
          oppsCount: oppsTotal,
          openOppsCount: parseInt(oppsCountRes.rows[0].open_opps, 10) || 0,
          closedWonOppsCount: closedWonOpps,
          pipelineValue: parseFloat(oppsCountRes.rows[0].pipeline_value) || 0,
          ordersCount: ordersTotal,
          todayOrdersCount: parseInt(ordersCountRes.rows[0].today_orders, 10) || 0,
          monthOrdersCount: parseInt(ordersCountRes.rows[0].month_orders, 10) || 0,
          totalRevenue,
          todayRevenue: parseFloat(ordersCountRes.rows[0].today_revenue) || 0,
          monthRevenue: parseFloat(ordersCountRes.rows[0].month_revenue) || 0,
          productsCount: parseInt(productsCountRes.rows[0].total, 10) || 0,
          totalStock: parseInt(productsCountRes.rows[0].total_stock, 10) || 0,
          categoriesCount: parseInt(categoriesCountRes.rows[0].total, 10) || 0,
          campaignsCount: parseInt(campaignsCountRes.rows[0].total, 10) || 0,
          activeCampaignsCount: parseInt(campaignsCountRes.rows[0].active_campaigns, 10) || 0,
          upcomingCampaignsCount: parseInt(campaignsCountRes.rows[0].upcoming_campaigns, 10) || 0,
          totalBudget: parseFloat(campaignsCountRes.rows[0].total_budget) || 0,
          usersCount: parseInt(usersCountRes.rows[0].total, 10) || 0,
          activeUsersCount: parseInt(usersCountRes.rows[0].active_users, 10) || 0,
          inactiveUsersCount: parseInt(usersCountRes.rows[0].inactive_users, 10) || 0,
          rolesCount: parseInt(rolesCountRes.rows[0].total, 10) || 0,
          yearTarget,
          planCompletion: `${planCompletionPercent}%`,
          planCompletionNumber: planCompletionPercent,
          winRate: `${winRatePercent}%`,
          winRateNumber: winRatePercent
        },
        personal: personalStats,
        recentOrders: recentOrdersRes.rows,
        recentOpportunities: recentOppsRes.rows,
        recentLeads: recentLeadsRes.rows,
        recentUsers
      }
    });
  } catch (error) {
    next(error);
  }
};
