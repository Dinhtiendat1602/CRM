const db = require('../config/db');

/**
 * Controller Quản lý Cơ hội bán hàng & Nhật ký Chăm sóc (Opportunities & Follow-up Module)
 * Tuân thủ SRS v1.1 Mục 3.6 - 3.11 và các Business Rules BR-01, BR-02, BR-03, BR-04, BR-05, BR-06
 */

const VALID_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'ORDERED', 'LOST'];

/**
 * SRS 3.7, 3.8: Lấy danh sách Cơ hội bán hàng
 * - Phân trang mặc định 20 bản ghi (BR-03, SRS 3.7.3 REQ-1)
 * - Sắp xếp theo ngày tạo (BR-04, SRS 3.7.3 REQ-2)
 * - Lọc theo khoảng ngày (BR-05, SRS 3.7.3 REQ-3)
 * - Tìm kiếm theo tên Lead hoặc tên Sản phẩm (SRS 3.8)
 * - Lọc theo trạng thái, khách hàng, sản phẩm, nhân viên phụ trách
 * GET /api/opportunities
 */
exports.getOpportunities = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20); // BR-03: Mặc định 20 dòng
    const offset = (page - 1) * limit;

    const {
      search,
      status,
      lead_id,
      product_id,
      created_by,
      from_date,
      to_date,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = req.query;

    const conditions = [];
    const values = [];

    // Tìm kiếm theo tên Lead hoặc tên Sản phẩm hoặc mã Sản phẩm (SRS 3.8)
    if (search && search.trim()) {
      values.push(`%${search.trim()}%`);
      const idx = values.length;
      conditions.push(
        `(l.first_name ILIKE $${idx} OR l.last_name ILIKE $${idx} OR (l.last_name || ' ' || l.first_name) ILIKE $${idx} OR (l.first_name || ' ' || l.last_name) ILIKE $${idx} OR p.name ILIKE $${idx} OR p.product_code ILIKE $${idx})`
      );
    }

    // Lọc theo trạng thái
    if (status && VALID_STATUSES.includes(status.toUpperCase())) {
      values.push(status.toUpperCase());
      conditions.push(`o.status = $${values.length}`);
    }

    // Lọc theo khách hàng (lead_id)
    if (lead_id) {
      values.push(parseInt(lead_id, 10));
      conditions.push(`o.lead_id = $${values.length}`);
    }

    // Lọc theo sản phẩm (product_id)
    if (product_id) {
      values.push(parseInt(product_id, 10));
      conditions.push(`o.product_id = $${values.length}`);
    }

    // Lọc theo người tạo (created_by)
    if (created_by) {
      values.push(parseInt(created_by, 10));
      conditions.push(`o.created_by = $${values.length}`);
    }

    // Lọc theo khoảng ngày tạo: từ ngày (BR-05, SRS 3.7.3 REQ-3)
    if (from_date) {
      values.push(from_date);
      conditions.push(`o.created_at >= $${values.length}::timestamp`);
    }

    // Lọc theo khoảng ngày tạo: đến ngày (BR-05)
    if (to_date) {
      values.push(to_date);
      conditions.push(`o.created_at <= ($${values.length}::date + INTERVAL '1 day' - INTERVAL '1 second')`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Ràng buộc cột sắp xếp an toàn (BR-04)
    const allowedSortFields = ['created_at', 'expected_close_date', 'quantity', 'id'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? `o.${sortBy}` : 'o.created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Đếm tổng số bản ghi
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM opportunities o
      JOIN leads l ON o.lead_id = l.id
      JOIN products p ON o.product_id = p.id
      ${whereClause};
    `;
    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(total / limit) || 1;

    // Truy vấn dữ liệu có phân trang, JOIN bảng leads, products, users, orders
    values.push(limit);
    const limitIdx = values.length;
    values.push(offset);
    const offsetIdx = values.length;

    const dataQuery = `
      SELECT
        o.id,
        o.lead_id,
        l.first_name AS lead_first_name,
        l.last_name AS lead_last_name,
        (l.last_name || ' ' || l.first_name) AS lead_name,
        l.email AS lead_email,
        l.phone AS lead_phone,
        o.product_id,
        p.product_code,
        p.name AS product_name,
        p.unit_price,
        p.stock_qty,
        o.quantity,
        (o.quantity * p.unit_price) AS estimated_value,
        o.expected_close_date,
        o.status,
        o.notes,
        o.created_by,
        u.full_name AS created_by_name,
        o.created_at,
        o.updated_at,
        COALESCE(fu.fu_count, 0)::int AS follow_ups_count,
        ord.id AS order_id,
        ord.order_code
      FROM opportunities o
      JOIN leads l ON o.lead_id = l.id
      JOIN products p ON o.product_id = p.id
      LEFT JOIN users u ON o.created_by = u.id
      LEFT JOIN (
        SELECT opportunity_id, COUNT(*) AS fu_count
        FROM follow_ups
        GROUP BY opportunity_id
      ) fu ON o.id = fu.opportunity_id
      LEFT JOIN orders ord ON o.id = ord.opportunity_id
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT $${limitIdx} OFFSET $${offsetIdx};
    `;

    const dataResult = await db.query(dataQuery, values);

    return res.status(200).json({
      success: true,
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.7.3 REQ-4: Xem chi tiết Cơ hội kèm toàn bộ lịch sử Follow-up và thông tin Order
 * GET /api/opportunities/:id
 */
exports.getOpportunityById = async (req, res, next) => {
  try {
    const oppId = parseInt(req.params.id, 10);
    if (isNaN(oppId)) {
      return res.status(400).json({
        success: false,
        message: 'Mã cơ hội bán hàng không hợp lệ.',
      });
    }

    // 1. Lấy thông tin chi tiết cơ hội, lead, product, creator
    const oppQuery = `
      SELECT
        o.id,
        o.lead_id,
        l.first_name AS lead_first_name,
        l.last_name AS lead_last_name,
        (l.last_name || ' ' || l.first_name) AS lead_name,
        l.email AS lead_email,
        l.phone AS lead_phone,
        l.career AS lead_career,
        l.address AS lead_address,
        o.product_id,
        p.product_code,
        p.name AS product_name,
        p.unit_price,
        p.stock_qty,
        p.description AS product_description,
        c.name AS category_name,
        o.quantity,
        (o.quantity * p.unit_price) AS estimated_value,
        o.expected_close_date,
        o.status,
        o.notes,
        o.created_by,
        u.full_name AS created_by_name,
        o.created_at,
        o.updated_at
      FROM opportunities o
      JOIN leads l ON o.lead_id = l.id
      JOIN products p ON o.product_id = p.id
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.id = $1;
    `;
    const oppResult = await db.query(oppQuery, [oppId]);

    if (oppResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cơ hội bán hàng.',
      });
    }

    const opportunity = oppResult.rows[0];

    // 2. Lấy danh sách lịch sử tương tác Follow-up (SRS 3.11)
    const followUpsQuery = `
      SELECT
        f.id,
        f.opportunity_id,
        f.follow_date,
        f.contact_method,
        f.content,
        f.customer_response,
        f.next_plan,
        f.created_by,
        u.full_name AS created_by_name
      FROM follow_ups f
      LEFT JOIN users u ON f.created_by = u.id
      WHERE f.opportunity_id = $1
      ORDER BY f.follow_date DESC, f.id DESC;
    `;
    const followUpsResult = await db.query(followUpsQuery, [oppId]);

    // 3. Lấy thông tin đơn hàng nếu đã chốt đơn (SRS 3.12)
    const orderQuery = `
      SELECT
        id,
        order_code,
        quantity,
        unit_price,
        total_amount,
        payment_info,
        shipping_address,
        status,
        order_date
      FROM orders
      WHERE opportunity_id = $1;
    `;
    const orderResult = await db.query(orderQuery, [oppId]);

    opportunity.follow_ups = followUpsResult.rows;
    opportunity.order = orderResult.rows.length > 0 ? orderResult.rows[0] : null;

    return res.status(200).json({
      success: true,
      data: opportunity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * BR-02 & SRS 3.6.2 REQ-4: Kiểm tra trùng lặp cơ hội bán hàng
 * Kiểm tra xem khách hàng (lead_id) đã có cơ hội đang mở cho sản phẩm (product_id) hay chưa
 * GET /api/opportunities/check-duplicate?lead_id=...&product_id=...
 */
exports.checkDuplicate = async (req, res, next) => {
  try {
    const { lead_id, product_id, exclude_id } = req.query;

    if (!lead_id || !product_id) {
      return res.status(400).json({
        success: false,
        message: 'Cần cung cấp lead_id và product_id để kiểm tra trùng lặp.',
      });
    }

    const conditions = [
      'lead_id = $1',
      'product_id = $2',
      `status NOT IN ('ORDERED', 'LOST')`, // Chỉ xét các cơ hội đang mở/đang xử lý
    ];
    const values = [parseInt(lead_id, 10), parseInt(product_id, 10)];

    if (exclude_id) {
      values.push(parseInt(exclude_id, 10));
      conditions.push(`id != $${values.length}`);
    }

    const checkQuery = `
      SELECT o.id, o.status, o.created_at, p.name AS product_name, (l.last_name || ' ' || l.first_name) AS lead_name
      FROM opportunities o
      JOIN leads l ON o.lead_id = l.id
      JOIN products p ON o.product_id = p.id
      WHERE ${conditions.join(' AND ')}
      LIMIT 1;
    `;
    const checkResult = await db.query(checkQuery, values);

    if (checkResult.rows.length > 0) {
      const match = checkResult.rows[0];
      return res.status(200).json({
        isDuplicate: true,
        message: `Khách hàng '${match.lead_name}' đã có một cơ hội chưa hoàn thành cho sản phẩm '${match.product_name}' (Trạng thái: ${match.status}).`,
        existingOpportunity: match,
      });
    }

    return res.status(200).json({
      isDuplicate: false,
      message: 'Không phát hiện trùng lặp.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.6: Thêm mới Cơ hội bán hàng
 * - Ràng buộc trường bắt buộc: lead_id, product_id, quantity (BR-01, BR-06)
 * - Kiểm tra trùng lặp cặp Lead-Product chưa đóng (BR-02, SRS 3.6.2 REQ-4)
 * - Trả mã 409 Conflict nếu phát hiện trùng lặp mà không có confirm_duplicate
 * POST /api/opportunities
 */
exports.createOpportunity = async (req, res, next) => {
  try {
    const {
      lead_id,
      product_id,
      quantity = 1,
      expected_close_date,
      status = 'NEW',
      notes,
      confirm_duplicate = false,
    } = req.body;

    // 1. Kiểm tra trường bắt buộc (BR-01, BR-06, SRS 3.6.2 REQ-2)
    if (!lead_id || !product_id) {
      return res.status(400).json({
        success: false,
        message: 'Khách hàng (lead_id) và Sản phẩm (product_id) là các trường bắt buộc.',
      });
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng sản phẩm phải là số nguyên dương lớn hơn 0.',
      });
    }

    const upperStatus = (status || 'NEW').toUpperCase();
    if (!VALID_STATUSES.includes(upperStatus)) {
      return res.status(400).json({
        success: false,
        message: `Trạng thái không hợp lệ. Cho phép: ${VALID_STATUSES.join(', ')}.`,
      });
    }

    // 2. Kiểm tra tồn tại của Lead và Product
    const leadCheck = await db.query('SELECT id, first_name, last_name FROM leads WHERE id = $1;', [lead_id]);
    if (leadCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khách hàng tiềm năng đã chọn.',
      });
    }

    const prodCheck = await db.query('SELECT id, name, unit_price FROM products WHERE id = $1;', [product_id]);
    if (prodCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm đã chọn.',
      });
    }

    // 3. Chống trùng lặp (BR-02, SRS 3.6.2 REQ-4)
    if (!confirm_duplicate) {
      const duplicateQuery = `
        SELECT id, status, created_at
        FROM opportunities
        WHERE lead_id = $1 AND product_id = $2 AND status NOT IN ('ORDERED', 'LOST')
        LIMIT 1;
      `;
      const duplicateResult = await db.query(duplicateQuery, [lead_id, product_id]);

      if (duplicateResult.rows.length > 0) {
        return res.status(409).json({
          success: false,
          isDuplicate: true,
          message: 'Khách hàng này đã có một cơ hội bán hàng đang xử lý đối với sản phẩm này.',
          existing_opportunity_id: duplicateResult.rows[0].id,
        });
      }
    }

    // 4. Tạo cơ hội mới
    const insertQuery = `
      INSERT INTO opportunities (
        lead_id,
        product_id,
        quantity,
        expected_close_date,
        status,
        notes,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    let finalCreatedBy = null;
    if (req.user?.id) {
      const uCheck = await db.query('SELECT id FROM users WHERE id = $1', [req.user.id]);
      if (uCheck.rows.length > 0) {
        finalCreatedBy = uCheck.rows[0].id;
      }
    }

    const insertValues = [
      parseInt(lead_id, 10),
      parseInt(product_id, 10),
      parsedQty,
      expected_close_date || null,
      upperStatus,
      notes ? notes.trim() : null,
      finalCreatedBy,
    ];

    const result = await db.query(insertQuery, insertValues);
    const createdOpp = result.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Tạo cơ hội bán hàng mới thành công.',
      data: createdOpp,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.9: Cập nhật thông tin Cơ hội bán hàng
 * PUT /api/opportunities/:id
 */
exports.updateOpportunity = async (req, res, next) => {
  try {
    const oppId = parseInt(req.params.id, 10);
    if (isNaN(oppId)) {
      return res.status(400).json({
        success: false,
        message: 'Mã cơ hội bán hàng không hợp lệ.',
      });
    }

    // 1. Kiểm tra tồn tại
    const existingResult = await db.query('SELECT * FROM opportunities WHERE id = $1;', [oppId]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cơ hội bán hàng.',
      });
    }
    const currentOpp = existingResult.rows[0];

    // 2. Nếu cơ hội đã có đơn hàng ORDERED, hạn chế đổi lead hoặc product
    if (currentOpp.status === 'ORDERED') {
      if (req.body.product_id && parseInt(req.body.product_id, 10) !== currentOpp.product_id) {
        return res.status(400).json({
          success: false,
          message: 'Không thể thay đổi sản phẩm cho cơ hội đã chốt đơn hàng.',
        });
      }
      if (req.body.lead_id && parseInt(req.body.lead_id, 10) !== currentOpp.lead_id) {
        return res.status(400).json({
          success: false,
          message: 'Không thể thay đổi khách hàng cho cơ hội đã chốt đơn hàng.',
        });
      }
    }

    const {
      quantity = currentOpp.quantity,
      expected_close_date = currentOpp.expected_close_date,
      status = currentOpp.status,
      notes = currentOpp.notes,
      product_id = currentOpp.product_id,
    } = req.body;

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng sản phẩm phải là số nguyên dương lớn hơn 0.',
      });
    }

    const upperStatus = status ? status.toUpperCase() : currentOpp.status;
    if (!VALID_STATUSES.includes(upperStatus)) {
      return res.status(400).json({
        success: false,
        message: `Trạng thái không hợp lệ. Cho phép: ${VALID_STATUSES.join(', ')}.`,
      });
    }

    // Cập nhật CSDL
    const updateQuery = `
      UPDATE opportunities
      SET
        product_id = $1,
        quantity = $2,
        expected_close_date = $3,
        status = $4,
        notes = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *;
    `;
    const updateValues = [
      parseInt(product_id, 10),
      parsedQty,
      expected_close_date || null,
      upperStatus,
      notes !== undefined ? (notes ? notes.trim() : null) : currentOpp.notes,
      oppId,
    ];

    const result = await db.query(updateQuery, updateValues);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật cơ hội bán hàng thành công.',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.10: Xóa Cơ hội bán hàng
 * - Chặn xóa nếu cơ hội đã chuyển đổi thành đơn hàng (ORDERED) để bảo toàn dữ liệu
 * DELETE /api/opportunities/:id
 */
exports.deleteOpportunity = async (req, res, next) => {
  try {
    const oppId = parseInt(req.params.id, 10);
    if (isNaN(oppId)) {
      return res.status(400).json({
        success: false,
        message: 'Mã cơ hội bán hàng không hợp lệ.',
      });
    }

    // 1. Kiểm tra tồn tại
    const existingResult = await db.query('SELECT id, status FROM opportunities WHERE id = $1;', [oppId]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cơ hội bán hàng.',
      });
    }

    const currentOpp = existingResult.rows[0];

    // 2. Chặn xóa nếu cơ hội đã có đơn hàng (SRS 3.10 & toàn vẹn dữ liệu)
    if (currentOpp.status === 'ORDERED') {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa cơ hội bán hàng đã được chuyển đổi thành đơn hàng.',
      });
    }

    const orderCheck = await db.query('SELECT id FROM orders WHERE opportunity_id = $1;', [oppId]);
    if (orderCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa cơ hội bán hàng đã phát sinh đơn hàng thực tế.',
      });
    }

    // 3. Thực hiện xóa (Follow-ups tự động CASCADE theo thiết kế CSDL)
    await db.query('DELETE FROM opportunities WHERE id = $1;', [oppId]);

    return res.status(200).json({
      success: true,
      message: 'Xóa cơ hội bán hàng thành công.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.11: Ghi nhận nhật ký chăm sóc (Follow-up log)
 * - Lưu: Ngày liên hệ, kênh liên hệ, nội dung, phản hồi khách, kế hoạch tiếp
 * - Tự động cập nhật trạng thái cơ hội sang CONTACTED nếu đang là NEW
 * POST /api/opportunities/:id/follow-ups
 */
exports.addFollowUp = async (req, res, next) => {
  try {
    const oppId = parseInt(req.params.id, 10);
    if (isNaN(oppId)) {
      return res.status(400).json({
        success: false,
        message: 'Mã cơ hội bán hàng không hợp lệ.',
      });
    }

    // 1. Kiểm tra tồn tại cơ hội
    const oppCheck = await db.query('SELECT id, status FROM opportunities WHERE id = $1;', [oppId]);
    if (oppCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cơ hội bán hàng để ghi nhận tương tác.',
      });
    }
    const currentOpp = oppCheck.rows[0];

    const {
      follow_date,
      contact_method = 'PHONE',
      content,
      customer_response,
      next_plan,
      new_status,
    } = req.body;

    // 2. Ràng buộc trường bắt buộc (SRS 3.11.3 REQ-1, REQ-2)
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung tương tác chăm sóc (content) là bắt buộc.',
      });
    }

    // 3. Tạo bản ghi follow_up
    const insertFollowUpQuery = `
      INSERT INTO follow_ups (
        opportunity_id,
        follow_date,
        contact_method,
        content,
        customer_response,
        next_plan,
        created_by
      ) VALUES ($1, COALESCE($2::timestamp, CURRENT_TIMESTAMP), $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    let finalCreatedBy = null;
    if (req.user?.id) {
      const uCheck = await db.query('SELECT id FROM users WHERE id = $1', [req.user.id]);
      if (uCheck.rows.length > 0) {
        finalCreatedBy = uCheck.rows[0].id;
      }
    }

    const insertValues = [
      oppId,
      follow_date || null,
      contact_method ? contact_method.trim().toUpperCase() : 'PHONE',
      content.trim(),
      customer_response ? customer_response.trim() : null,
      next_plan ? next_plan.trim() : null,
      finalCreatedBy,
    ];

    const followUpResult = await db.query(insertFollowUpQuery, insertValues);
    const createdFollowUp = followUpResult.rows[0];

    // 4. Tự động chuyển trạng thái cơ hội thông minh:
    // Nếu cơ hội đang là 'NEW', chuyển thành 'CONTACTED' (vì đã có tương tác)
    // Hoặc nếu người dùng truyền new_status hợp lệ thì cập nhật theo
    let updatedStatus = currentOpp.status;
    if (new_status && VALID_STATUSES.includes(new_status.toUpperCase())) {
      updatedStatus = new_status.toUpperCase();
      await db.query(
        'UPDATE opportunities SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;',
        [updatedStatus, oppId]
      );
    } else if (currentOpp.status === 'NEW') {
      updatedStatus = 'CONTACTED';
      await db.query(
        'UPDATE opportunities SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;',
        [updatedStatus, oppId]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Ghi nhận nhật ký chăm sóc thành công.',
      data: createdFollowUp,
      opportunity_status: updatedStatus,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.11: Lấy danh sách lịch sử Follow-up của một cơ hội
 * GET /api/opportunities/:id/follow-ups
 */
exports.getFollowUps = async (req, res, next) => {
  try {
    const oppId = parseInt(req.params.id, 10);
    if (isNaN(oppId)) {
      return res.status(400).json({
        success: false,
        message: 'Mã cơ hội bán hàng không hợp lệ.',
      });
    }

    const query = `
      SELECT
        f.id,
        f.opportunity_id,
        f.follow_date,
        f.contact_method,
        f.content,
        f.customer_response,
        f.next_plan,
        f.created_by,
        u.full_name AS created_by_name
      FROM follow_ups f
      LEFT JOIN users u ON f.created_by = u.id
      WHERE f.opportunity_id = $1
      ORDER BY f.follow_date DESC, f.id DESC;
    `;
    const result = await db.query(query, [oppId]);

    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy danh sách trạng thái cơ hội chuẩn
 * GET /api/opportunities/statuses
 */
exports.getStatuses = (req, res) => {
  const statuses = [
    { code: 'NEW', label: 'Mới tạo', description: 'Cơ hội mới được ghi nhận' },
    { code: 'CONTACTED', label: 'Đã liên hệ', description: 'Đã liên hệ trao đổi lần đầu' },
    { code: 'QUALIFIED', label: 'Đủ điều kiện', description: 'Khách hàng có nhu cầu thực tế và khả năng tài chính' },
    { code: 'PROPOSAL', label: 'Gửi báo giá', description: 'Đã gửi đề xuất và báo giá chi tiết' },
    { code: 'ORDERED', label: 'Đã chốt đơn', description: 'Đã chuyển thành đơn hàng thành công' },
    { code: 'LOST', label: 'Thất bại/Hủy', description: 'Khách hàng từ chối hoặc hủy giao dịch' },
  ];

  return res.status(200).json({
    success: true,
    data: statuses,
  });
};
