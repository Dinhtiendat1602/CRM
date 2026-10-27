const db = require('../config/db');

/**
 * Controller Quản lý Chiến dịch Tiếp thị & Báo cáo Hiệu quả (Campaigns Module)
 * Tuân thủ SRS v1.1 Mục 3.18, 3.19 & BR-03 (Phân trang 20 dòng)
 */

/**
 * SRS 3.18: Lấy danh sách Chiến dịch tiếp thị
 * Hỗ trợ phân trang 20 dòng (BR-03), tìm kiếm theo tên/mô tả, lọc khoảng ngày, sắp xếp
 * GET /api/campaigns
 */
exports.getCampaigns = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20); // Chuẩn BR-03
    const offset = (page - 1) * limit;

    const { search, from_date, to_date, status, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    const conditions = [];
    const values = [];

    // Tìm kiếm theo tên hoặc mô tả chiến dịch
    if (search && search.trim()) {
      values.push(`%${search.trim()}%`);
      const idx = values.length;
      conditions.push(`(c.name ILIKE $${idx} OR c.description ILIKE $${idx})`);
    }

    // Lọc theo khoảng ngày (BR-05)
    if (from_date) {
      values.push(from_date);
      conditions.push(`c.start_date >= $${values.length}::date`);
    }
    if (to_date) {
      values.push(to_date);
      conditions.push(`c.end_date <= $${values.length}::date`);
    }

    // Lọc theo trạng thái thời gian chiến dịch: ACTIVE (đang chạy), UPCOMING (sắp diễn ra), ENDED (đã kết thúc)
    if (status) {
      const upperStatus = status.toUpperCase();
      if (upperStatus === 'ACTIVE') {
        conditions.push(`CURRENT_DATE BETWEEN c.start_date AND c.end_date`);
      } else if (upperStatus === 'UPCOMING') {
        conditions.push(`c.start_date > CURRENT_DATE`);
      } else if (upperStatus === 'ENDED') {
        conditions.push(`c.end_date < CURRENT_DATE`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sắp xếp an toàn
    const allowedSort = {
      created_at: 'c.created_at',
      start_date: 'c.start_date',
      end_date: 'c.end_date',
      budget: 'c.budget',
      name: 'c.name',
    };
    const safeSortBy = allowedSort[sortBy] || 'c.created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Đếm tổng số bản ghi
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM campaigns c
      ${whereClause};
    `;
    const countRes = await db.query(countQuery, values);
    const total = parseInt(countRes.rows[0].total, 10);

    // Truy vấn danh sách kèm số lượng leads và số sản phẩm gán
    const listQuery = `
      SELECT
        c.*,
        u.full_name AS created_by_name,
        COUNT(DISTINCT l.id) AS leads_count,
        COUNT(DISTINCT p.id) AS products_count,
        CASE
          WHEN CURRENT_DATE < c.start_date THEN 'UPCOMING'
          WHEN CURRENT_DATE > c.end_date THEN 'ENDED'
          ELSE 'ACTIVE'
        END AS campaign_status
      FROM campaigns c
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN leads l ON l.campaign_id = c.id
      LEFT JOIN products p ON p.campaign_id = c.id
      ${whereClause}
      GROUP BY c.id, u.full_name
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT $${values.length + 1} OFFSET $${values.length + 2};
    `;
    const listRes = await db.query(listQuery, [...values, limit, offset]);

    return res.status(200).json({
      success: true,
      data: listRes.rows,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit) || 1,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.18: Lấy chi tiết một Chiến dịch tiếp thị
 * Trả về thông tin chi tiết, danh sách sản phẩm gán và thống kê sơ bộ
 * GET /api/campaigns/:id
 */
exports.getCampaignById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Mã chiến dịch không hợp lệ.',
      });
    }

    const campaignQuery = `
      SELECT
        c.*,
        u.full_name AS created_by_name,
        CASE
          WHEN CURRENT_DATE < c.start_date THEN 'UPCOMING'
          WHEN CURRENT_DATE > c.end_date THEN 'ENDED'
          ELSE 'ACTIVE'
        END AS campaign_status
      FROM campaigns c
      LEFT JOIN users u ON c.created_by = u.id
      WHERE c.id = $1;
    `;
    const campaignRes = await db.query(campaignQuery, [id]);

    if (campaignRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chiến dịch tiếp thị.',
      });
    }

    const campaign = campaignRes.rows[0];

    // Lấy danh sách sản phẩm gắn với chiến dịch này
    const productsRes = await db.query(
      `SELECT p.id, p.product_code, p.name, p.unit_price, p.stock_qty, pc.name AS category_name
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE p.campaign_id = $1
       ORDER BY p.name ASC`,
      [id]
    );

    // Lấy số lượng Leads phát sinh
    const leadsCountRes = await db.query(
      `SELECT COUNT(*) AS total_leads FROM leads WHERE campaign_id = $1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      data: {
        ...campaign,
        products: productsRes.rows,
        leads_count: parseInt(leadsCountRes.rows[0].total_leads, 10),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.18.1: Thêm mới Chiến dịch tiếp thị
 * POST /api/campaigns
 */
exports.createCampaign = async (req, res, next) => {
  try {
    const { name, description, start_date, end_date, budget } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tên chiến dịch tiếp thị là bắt buộc (SRS 3.18.1).',
      });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Ngày bắt đầu và ngày kết thúc chiến dịch là bắt buộc (SRS 3.18.1).',
      });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng ngày bắt đầu hoặc ngày kết thúc không hợp lệ.',
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu chiến dịch.',
      });
    }

    const parsedBudget = budget !== undefined && budget !== null && budget !== ''
      ? Math.max(0, parseFloat(budget) || 0)
      : 0;

    let createdBy = null;
    if (req.user && req.user.id) {
      const uRes = await db.query('SELECT id FROM users WHERE id = $1', [req.user.id]);
      if (uRes.rows.length > 0) createdBy = req.user.id;
    }

    const insertQuery = `
      INSERT INTO campaigns (name, description, start_date, end_date, budget, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const insertRes = await db.query(insertQuery, [
      name.trim(),
      description ? description.trim() : null,
      start_date,
      end_date,
      parsedBudget,
      createdBy,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Tạo chiến dịch tiếp thị mới thành công!',
      data: insertRes.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.18: Cập nhật Chiến dịch tiếp thị
 * PUT /api/campaigns/:id
 */
exports.updateCampaign = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Mã chiến dịch không hợp lệ.',
      });
    }

    const { name, description, start_date, end_date, budget } = req.body;

    // Kiểm tra tồn tại
    const existRes = await db.query('SELECT id FROM campaigns WHERE id = $1', [id]);
    if (existRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chiến dịch cần cập nhật.',
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tên chiến dịch tiếp thị là bắt buộc.',
      });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Ngày bắt đầu và ngày kết thúc là bắt buộc.',
      });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Định dạng ngày bắt đầu hoặc ngày kết thúc không hợp lệ.',
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.',
      });
    }

    const parsedBudget = budget !== undefined && budget !== null && budget !== ''
      ? Math.max(0, parseFloat(budget) || 0)
      : 0;

    const updateQuery = `
      UPDATE campaigns
      SET
        name = $1,
        description = $2,
        start_date = $3,
        end_date = $4,
        budget = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *;
    `;
    const updateRes = await db.query(updateQuery, [
      name.trim(),
      description ? description.trim() : null,
      start_date,
      end_date,
      parsedBudget,
      id,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật chiến dịch tiếp thị thành công!',
      data: updateRes.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.18: Xóa Chiến dịch tiếp thị
 * DELETE /api/campaigns/:id
 */
exports.deleteCampaign = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Mã chiến dịch không hợp lệ.',
      });
    }

    const existRes = await db.query('SELECT id, name FROM campaigns WHERE id = $1', [id]);
    if (existRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chiến dịch cần xóa.',
      });
    }

    // An toàn gỡ bỏ liên kết campaign_id ở bảng products và leads
    await db.query('UPDATE products SET campaign_id = NULL WHERE campaign_id = $1', [id]);
    await db.query('UPDATE leads SET campaign_id = NULL WHERE campaign_id = $1', [id]);

    await db.query('DELETE FROM campaigns WHERE id = $1', [id]);

    return res.status(200).json({
      success: true,
      message: `Đã xóa chiến dịch '${existRes.rows[0].name}' thành công!`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.18.1: Gán sản phẩm vào Chiến dịch tiếp thị
 * POST /api/campaigns/:id/products
 * Body: { product_ids: [1, 2, 3] }
 */
exports.assignProducts = async (req, res, next) => {
  try {
    const campaignId = parseInt(req.params.id, 10);
    const { product_ids } = req.body;

    if (!campaignId || isNaN(campaignId)) {
      return res.status(400).json({
        success: false,
        message: 'Mã chiến dịch không hợp lệ.',
      });
    }

    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách mã sản phẩm (product_ids) phải là mảng không rỗng.',
      });
    }

    // Kiểm tra chiến dịch tồn tại
    const cRes = await db.query('SELECT id, name FROM campaigns WHERE id = $1', [campaignId]);
    if (cRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chiến dịch tiếp thị.',
      });
    }

    // Cập nhật campaign_id cho các sản phẩm
    const updateRes = await db.query(
      `UPDATE products
       SET campaign_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($2::int[])
       RETURNING id, product_code, name`,
      [campaignId, product_ids]
    );

    return res.status(200).json({
      success: true,
      message: `Đã gán thành công ${updateRes.rowCount} sản phẩm vào chiến dịch '${cRes.rows[0].name}'!`,
      data: updateRes.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.18.1: Gỡ sản phẩm khỏi Chiến dịch tiếp thị
 * DELETE /api/campaigns/:id/products/:productId
 */
exports.removeProductFromCampaign = async (req, res, next) => {
  try {
    const campaignId = parseInt(req.params.id, 10);
    const productId = parseInt(req.params.productId, 10);

    if (!campaignId || isNaN(campaignId) || !productId || isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Mã chiến dịch hoặc mã sản phẩm không hợp lệ.',
      });
    }

    await db.query(
      `UPDATE products
       SET campaign_id = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND campaign_id = $2`,
      [productId, campaignId]
    );

    return res.status(200).json({
      success: true,
      message: 'Đã gỡ sản phẩm khỏi chiến dịch thành công!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.19: Báo cáo hiệu quả Chiến dịch tiếp thị (Campaign Performance Report)
 * - Thống kê: Ngân sách (budget), Tổng Leads thu được, Tổng Cơ hội chuyển đổi, Tổng Đơn hàng thành công, Doanh thu thực tế, Chỉ số ROI, Tỷ lệ chuyển đổi (%)
 * - Danh sách Leads chi tiết thu được từ chiến dịch
 * - Danh sách Sản phẩm quảng bá trong chiến dịch
 * GET /api/campaigns/:id/report
 */
exports.getCampaignReport = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Mã chiến dịch không hợp lệ.',
      });
    }

    // 1. Lấy thông tin cơ bản của chiến dịch
    const cRes = await db.query(
      `SELECT
        c.*,
        u.full_name AS created_by_name,
        CASE
          WHEN CURRENT_DATE < c.start_date THEN 'UPCOMING'
          WHEN CURRENT_DATE > c.end_date THEN 'ENDED'
          ELSE 'ACTIVE'
        END AS campaign_status
       FROM campaigns c
       LEFT JOIN users u ON c.created_by = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (cRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chiến dịch tiếp thị.',
      });
    }

    const campaign = cRes.rows[0];
    const budget = parseFloat(campaign.budget || 0);

    // 2. Thống kê chi tiết danh sách Leads thu được từ chiến dịch (SRS 3.19)
    // Dùng subquery độc lập để tránh nhân chéo dòng (Cartesian product)
    const leadsRes = await db.query(
      `SELECT
        l.id,
        (l.last_name || ' ' || l.first_name) AS lead_name,
        l.phone,
        l.email,
        l.entered_date,
        l.career,
        u.full_name AS assigned_to_name,
        (SELECT COUNT(*)::int FROM opportunities opp WHERE opp.lead_id = l.id) AS opportunities_count,
        (SELECT COUNT(*)::int FROM orders ord WHERE ord.lead_id = l.id) AS orders_count,
        COALESCE((SELECT SUM(ord.total_amount) FROM orders ord WHERE ord.lead_id = l.id), 0) AS total_spent
       FROM leads l
       LEFT JOIN users u ON l.assigned_to = u.id
       WHERE l.campaign_id = $1
       ORDER BY l.entered_date DESC, l.id DESC`,
      [id]
    );

    const leads = leadsRes.rows;
    const totalLeads = leads.length;
    const totalOpportunities = leads.reduce((sum, l) => sum + parseInt(l.opportunities_count || 0, 10), 0);
    const convertedLeadsCount = leads.filter(l => parseInt(l.orders_count || 0, 10) > 0).length;
    const leadRevenue = leads.reduce((sum, l) => sum + parseFloat(l.total_spent || 0), 0);
    const leadOrders = leads.reduce((sum, l) => sum + parseInt(l.orders_count || 0, 10), 0);

    // 3. Thống kê danh sách sản phẩm đang quảng bá trong chiến dịch (SRS 3.18.1)
    const productsRes = await db.query(
      `SELECT
        p.id,
        p.product_code,
        p.name,
        p.unit_price,
        p.stock_qty,
        pc.name AS category_name,
        (SELECT COUNT(*)::int FROM orders ord WHERE ord.product_id = p.id) AS orders_count,
        COALESCE((SELECT SUM(ord.quantity)::int FROM orders ord WHERE ord.product_id = p.id), 0) AS units_sold,
        COALESCE((SELECT SUM(ord.total_amount) FROM orders ord WHERE ord.product_id = p.id), 0) AS product_revenue
       FROM products p
       LEFT JOIN product_categories pc ON p.category_id = pc.id
       WHERE p.campaign_id = $1
       ORDER BY p.name ASC`,
      [id]
    );

    const products = productsRes.rows;
    const productRevenue = products.reduce((sum, p) => sum + parseFloat(p.product_revenue || 0), 0);
    const productOrders = products.reduce((sum, p) => sum + parseInt(p.orders_count || 0, 10), 0);

    // 4. Xác định Doanh thu & Đơn hàng tổng hợp (SRS 3.19):
    // - Nếu chiến dịch có gán Sản phẩm quảng bá (Product Campaign) -> tính theo các Sản phẩm được gán
    // - Nếu chiến dịch thuần thu thập Lead (Lead Gen Campaign) -> tính theo Đơn hàng từ các Leads thu được
    const totalRevenue = products.length > 0 ? productRevenue : leadRevenue;
    const totalOrders = products.length > 0 ? productOrders : leadOrders;

    // 5. Tính toán các chỉ số ROI & Tỷ lệ chuyển đổi chuẩn CRM (SRS 3.19)
    // ROI = (Doanh thu - Chi phí) / Chi phí * 100%
    const roi = budget > 0 ? Number((((totalRevenue - budget) / budget) * 100).toFixed(2)) : 0;

    // Tỷ lệ chuyển đổi chuẩn: (Số Leads đã chốt đơn thành công / Tổng số Leads thu được) * 100%
    // Đảm bảo luôn nằm trong khoảng 0% - 100%, không bị lỗi phi thực tế (như 400%)
    const conversionRate = totalLeads > 0 ? Number(((convertedLeadsCount / totalLeads) * 100).toFixed(1)) : 0;

    return res.status(200).json({
      success: true,
      data: {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          budget,
          campaign_status: campaign.campaign_status,
          created_by_name: campaign.created_by_name,
          created_at: campaign.created_at,
        },
        metrics: {
          budget,
          total_leads: totalLeads,
          total_opportunities: totalOpportunities,
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          converted_leads: convertedLeadsCount,
          product_revenue: productRevenue,
          product_orders: productOrders,
          lead_revenue: leadRevenue,
          lead_orders: leadOrders,
          roi,
          conversion_rate: conversionRate,
        },
        leads,
        products,
      },
    });
  } catch (error) {
    next(error);
  }
};
