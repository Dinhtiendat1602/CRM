const db = require('../config/db');

/**
 * Controller Quản lý Đơn hàng & Chốt đơn (Orders & Make an Order Module)
 * Tuân thủ SRS v1.1 Mục 3.12 (Make an Order), BR-03 (Transaction ACID & Phân trang 20 dòng), BR-07
 */

/**
 * Hàm sinh mã đơn hàng duy nhất theo format ORD-YYYYMMDD-XXXX
 */
const generateOrderCode = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${yyyy}${mm}${dd}-${randomHex}`;
};

/**
 * SRS 3.12: Make an Order - Chốt đơn hàng bằng Database Transaction (ACID)
 * - Khóa dòng Cơ hội và Sản phẩm với Row-level Locking (FOR UPDATE)
 * - Kiểm tra số lượng tồn kho (stock_qty)
 * - Sinh mã đơn hàng duy nhất (order_code)
 * - Tạo bản ghi trong bảng orders (bảo tồn đơn giá unit_price tại thời điểm chốt)
 * - Trừ số lượng tồn kho sản phẩm tự động
 * - Chuyển trạng thái Cơ hội thành 'ORDERED'
 * - Tự động ghi nhận nhật ký Follow-up chốt đơn
 * - Rollback toàn bộ nếu có bất kỳ lỗi nào xảy ra
 * POST /api/opportunities/:id/make-order
 * POST /api/orders
 */
exports.makeOrder = async (req, res, next) => {
  const oppIdParam = req.params.id || req.body.opportunity_id;
  const oppId = parseInt(oppIdParam, 10);

  if (!oppId || isNaN(oppId)) {
    return res.status(400).json({
      success: false,
      message: 'Mã cơ hội bán hàng (opportunity_id) không hợp lệ.',
    });
  }

  const { payment_info, shipping_address, order_date, quantity, notes } = req.body;

  // Validate thông tin bắt buộc theo SRS 3.12.3 REQ-1
  if (!payment_info || !payment_info.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Thông tin thanh toán là bắt buộc khi chốt đơn (SRS 3.12).',
    });
  }

  if (!shipping_address || !shipping_address.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Thông tin / địa chỉ giao hàng là bắt buộc khi chốt đơn (SRS 3.12).',
    });
  }

  const client = await db.pool.connect();

  try {
    // 1. Khởi tạo Database Transaction
    await client.query('BEGIN');

    // 2. Khóa dòng Cơ hội bán hàng để tránh race condition (Row-Level Locking)
    const oppQuery = `
      SELECT id, lead_id, product_id, quantity, status, expected_close_date
      FROM opportunities
      WHERE id = $1
      FOR UPDATE;
    `;
    const oppRes = await client.query(oppQuery, [oppId]);

    if (oppRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cơ hội bán hàng.',
      });
    }

    const opp = oppRes.rows[0];

    // Kiểm tra trạng thái cơ hội
    if (opp.status === 'ORDERED') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Cơ hội bán hàng này đã được chốt đơn trước đó. Không thể chốt đơn lần thứ hai.',
      });
    }

    if (opp.status === 'LOST') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Không thể chốt đơn cho cơ hội bán hàng đã bị hủy hoặc thất bại.',
      });
    }

    // Kiểm tra quan hệ 1-1: cơ hội này đã có đơn hàng nào liên kết chưa
    const existingOrderRes = await client.query(
      'SELECT id, order_code FROM orders WHERE opportunity_id = $1 LIMIT 1',
      [oppId]
    );
    if (existingOrderRes.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Cơ hội này đã liên kết với đơn hàng ${existingOrderRes.rows[0].order_code}. Không thể tạo thêm đơn hàng.`,
      });
    }

    // Xác định số lượng chốt đơn (nếu có gửi quantity thì dùng, không thì lấy từ cơ hội)
    const orderQuantity = quantity !== undefined && quantity !== null ? parseInt(quantity, 10) : opp.quantity;
    if (isNaN(orderQuantity) || orderQuantity <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Số lượng đặt hàng phải là số nguyên dương lớn hơn 0.',
      });
    }

    // 3. Khóa dòng Sản phẩm và kiểm tra tồn kho (Row-Level Locking)
    const prodQuery = `
      SELECT id, name, product_code, unit_price, stock_qty
      FROM products
      WHERE id = $1
      FOR UPDATE;
    `;
    const prodRes = await client.query(prodQuery, [opp.product_id]);

    if (prodRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm liên kết với cơ hội không tồn tại trong hệ thống.',
      });
    }

    const product = prodRes.rows[0];

    // KIỂM TRA TỒN KHO (AC-08, BR-03, SRS 3.12)
    if (product.stock_qty < orderQuantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Số lượng tồn kho không đủ để chốt đơn (Hiện có: ${product.stock_qty}, Cần: ${orderQuantity}). Vui lòng nhập thêm hàng hoặc điều chỉnh số lượng.`,
        data: {
          stock_qty: product.stock_qty,
          requested_qty: orderQuantity,
        },
      });
    }

    // 4. Tính toán đơn giá và tổng giá trị đơn hàng
    const unitPrice = parseFloat(product.unit_price);
    const totalAmount = orderQuantity * unitPrice;

    // 5. Sinh mã đơn hàng duy nhất (order_code)
    let orderCode = generateOrderCode();
    let isCodeUnique = false;
    let attempts = 0;
    while (!isCodeUnique && attempts < 5) {
      const checkCodeRes = await client.query('SELECT id FROM orders WHERE order_code = $1', [orderCode]);
      if (checkCodeRes.rows.length === 0) {
        isCodeUnique = true;
      } else {
        orderCode = generateOrderCode();
        attempts++;
      }
    }

    // 6. Kiểm tra an toàn người tạo đơn (created_by)
    let createdBy = null;
    if (req.user && req.user.id) {
      const uRes = await client.query('SELECT id FROM users WHERE id = $1', [req.user.id]);
      if (uRes.rows.length > 0) {
        createdBy = req.user.id;
      }
    }

    const finalOrderDate = order_date ? new Date(order_date) : new Date();

    // 7. Tạo bản ghi đơn hàng mới trong bảng orders (SRS 3.12)
    const insertOrderQuery = `
      INSERT INTO orders (
        order_code,
        opportunity_id,
        lead_id,
        product_id,
        quantity,
        unit_price,
        total_amount,
        order_date,
        payment_info,
        shipping_address,
        status,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'COMPLETED', $11)
      RETURNING *;
    `;
    const orderInsertRes = await client.query(insertOrderQuery, [
      orderCode,
      oppId,
      opp.lead_id,
      opp.product_id,
      orderQuantity,
      unitPrice,
      totalAmount,
      finalOrderDate,
      payment_info.trim(),
      shipping_address.trim(),
      createdBy,
    ]);
    const createdOrder = orderInsertRes.rows[0];

    // 8. Trừ số lượng tồn kho sản phẩm tự động (SRS 3.12)
    await client.query(
      'UPDATE products SET stock_qty = stock_qty - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [orderQuantity, opp.product_id]
    );

    // 9. Cập nhật trạng thái Cơ hội bán hàng thành 'ORDERED' (SRS 3.12.1)
    await client.query(
      'UPDATE opportunities SET status = \'ORDERED\', quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [orderQuantity, oppId]
    );

    // 10. Tự động ghi nhận một bản ghi nhật ký Follow-up (SRS 3.11)
    const formattedTotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount);
    const followUpContent = `Chốt đơn hàng thành công! Mã đơn: ${orderCode}. Số lượng: ${orderQuantity}. Tổng tiền: ${formattedTotal}. Phương thức: ${payment_info.trim()}.${notes ? ' Ghi chú: ' + notes.trim() : ''}`;

    await client.query(
      `INSERT INTO follow_ups (
        opportunity_id, follow_date, contact_method, content, customer_response, next_plan, created_by
      ) VALUES ($1, CURRENT_DATE, 'MEETING', $2, $3, $4, $5)`,
      [
        oppId,
        followUpContent,
        'Khách hàng đồng ý mua hàng và đã xác nhận thông tin đơn hàng.',
        'Tiến hành xuất kho, giao hàng và xác nhận thanh toán theo đúng địa chỉ.',
        createdBy,
      ]
    );

    // 11. COMMIT TRANSACTION
    await client.query('COMMIT');

    // 12. Truy vấn đơn hàng hoàn chỉnh trả về cho client
    const fullOrderRes = await db.query(
      `SELECT
        ord.*,
        l.first_name AS lead_first_name,
        l.last_name AS lead_last_name,
        (l.last_name || ' ' || l.first_name) AS lead_name,
        l.email AS lead_email,
        l.phone AS lead_phone,
        l.address AS lead_address,
        p.name AS product_name,
        p.product_code,
        p.stock_qty AS remaining_stock,
        u.full_name AS created_by_name
      FROM orders ord
      JOIN leads l ON ord.lead_id = l.id
      JOIN products p ON ord.product_id = p.id
      LEFT JOIN users u ON ord.created_by = u.id
      WHERE ord.id = $1`,
      [createdOrder.id]
    );

    return res.status(201).json({
      success: true,
      message: 'Chốt đơn hàng thành công!',
      data: fullOrderRes.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * SRS 3.12 & BR-03: Lấy danh sách Đơn hàng
 * - Phân trang mặc định 20 dòng theo BR-03
 * - Sắp xếp theo ngày chốt đơn giảm dần (order_date DESC)
 * - Lọc theo khoảng ngày (from_date, to_date)
 * - Tìm kiếm theo mã đơn hàng, tên khách hàng, hoặc tên/mã sản phẩm
 * - Thống kê tổng số đơn và tổng doanh thu
 * GET /api/orders
 */
exports.getOrders = async (req, res, next) => {
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
      sortBy = 'order_date',
      sortOrder = 'DESC',
    } = req.query;

    const conditions = [];
    const values = [];

    // Tìm kiếm đa năng theo mã đơn hàng, tên sản phẩm, mã sản phẩm hoặc họ tên khách hàng
    if (search && search.trim()) {
      values.push(`%${search.trim()}%`);
      const idx = values.length;
      conditions.push(
        `(ord.order_code ILIKE $${idx} OR p.name ILIKE $${idx} OR p.product_code ILIKE $${idx} OR l.first_name ILIKE $${idx} OR l.last_name ILIKE $${idx} OR (l.last_name || ' ' || l.first_name) ILIKE $${idx} OR (l.first_name || ' ' || l.last_name) ILIKE $${idx})`
      );
    }

    // Lọc theo trạng thái đơn hàng
    if (status && ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'].includes(status.toUpperCase())) {
      values.push(status.toUpperCase());
      conditions.push(`ord.status = $${values.length}`);
    }

    // Lọc theo khách hàng (lead_id)
    if (lead_id) {
      values.push(parseInt(lead_id, 10));
      conditions.push(`ord.lead_id = $${values.length}`);
    }

    // Lọc theo sản phẩm (product_id)
    if (product_id) {
      values.push(parseInt(product_id, 10));
      conditions.push(`ord.product_id = $${values.length}`);
    }

    // Lọc theo nhân viên chốt đơn (created_by)
    if (created_by) {
      values.push(parseInt(created_by, 10));
      conditions.push(`ord.created_by = $${values.length}`);
    }

    // Lọc theo khoảng ngày chốt đơn (BR-05)
    if (from_date) {
      values.push(from_date);
      conditions.push(`ord.order_date >= $${values.length}::timestamp`);
    }
    if (to_date) {
      values.push(`${to_date} 23:59:59.999`);
      conditions.push(`ord.order_date <= $${values.length}::timestamp`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sắp xếp an toàn
    const allowedSort = {
      order_date: 'ord.order_date',
      total_amount: 'ord.total_amount',
      quantity: 'ord.quantity',
      order_code: 'ord.order_code',
      id: 'ord.id',
    };
    const safeSortBy = allowedSort[sortBy] || 'ord.order_date';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Đếm tổng số đơn hàng & tổng doanh thu
    const countQuery = `
      SELECT
        COUNT(*) AS total,
        COALESCE(SUM(ord.total_amount), 0) AS total_revenue,
        COALESCE(SUM(ord.quantity), 0) AS total_items
      FROM orders ord
      JOIN leads l ON ord.lead_id = l.id
      JOIN products p ON ord.product_id = p.id
      ${whereClause};
    `;
    const countRes = await db.query(countQuery, values);
    const total = parseInt(countRes.rows[0].total, 10);
    const totalRevenue = parseFloat(countRes.rows[0].total_revenue);
    const totalItems = parseInt(countRes.rows[0].total_items, 10);

    // Truy vấn danh sách phân trang
    const listQuery = `
      SELECT
        ord.id,
        ord.order_code,
        ord.opportunity_id,
        ord.lead_id,
        ord.product_id,
        ord.quantity,
        ord.unit_price,
        ord.total_amount,
        ord.order_date,
        ord.payment_info,
        ord.shipping_address,
        ord.status,
        ord.created_by,
        (l.last_name || ' ' || l.first_name) AS lead_name,
        l.email AS lead_email,
        l.phone AS lead_phone,
        p.name AS product_name,
        p.product_code,
        u.full_name AS created_by_name
      FROM orders ord
      JOIN leads l ON ord.lead_id = l.id
      JOIN products p ON ord.product_id = p.id
      LEFT JOIN users u ON ord.created_by = u.id
      ${whereClause}
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
      summary: {
        totalOrders: total,
        totalRevenue,
        totalItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.12: Lấy chi tiết một đơn hàng theo ID hoặc order_code
 * GET /api/orders/:id
 */
exports.getOrderById = async (req, res, next) => {
  try {
    const param = req.params.id;
    let query;
    let values;

    if (!isNaN(parseInt(param, 10))) {
      query = `
        SELECT
          ord.*,
          (l.last_name || ' ' || l.first_name) AS lead_name,
          l.first_name AS lead_first_name,
          l.last_name AS lead_last_name,
          l.email AS lead_email,
          l.phone AS lead_phone,
          l.address AS lead_address,
          l.career AS lead_career,
          p.name AS product_name,
          p.product_code,
          p.description AS product_description,
          p.unit_price AS current_product_price,
          p.stock_qty AS current_stock_qty,
          c.name AS category_name,
          u.full_name AS created_by_name,
          u.username AS created_by_username,
          opp.status AS opportunity_status,
          opp.expected_close_date AS opportunity_expected_close_date
        FROM orders ord
        JOIN leads l ON ord.lead_id = l.id
        JOIN products p ON ord.product_id = p.id
        LEFT JOIN product_categories c ON p.category_id = c.id
        LEFT JOIN users u ON ord.created_by = u.id
        LEFT JOIN opportunities opp ON ord.opportunity_id = opp.id
        WHERE ord.id = $1 OR ord.order_code = $2;
      `;
      values = [parseInt(param, 10), param];
    } else {
      query = `
        SELECT
          ord.*,
          (l.last_name || ' ' || l.first_name) AS lead_name,
          l.first_name AS lead_first_name,
          l.last_name AS lead_last_name,
          l.email AS lead_email,
          l.phone AS lead_phone,
          l.address AS lead_address,
          l.career AS lead_career,
          p.name AS product_name,
          p.product_code,
          p.description AS product_description,
          p.unit_price AS current_product_price,
          p.stock_qty AS current_stock_qty,
          c.name AS category_name,
          u.full_name AS created_by_name,
          u.username AS created_by_username,
          opp.status AS opportunity_status,
          opp.expected_close_date AS opportunity_expected_close_date
        FROM orders ord
        JOIN leads l ON ord.lead_id = l.id
        JOIN products p ON ord.product_id = p.id
        LEFT JOIN product_categories c ON p.category_id = c.id
        LEFT JOIN users u ON ord.created_by = u.id
        LEFT JOIN opportunities opp ON ord.opportunity_id = opp.id
        WHERE ord.order_code = $1;
      `;
      values = [param];
    }

    const result = await db.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng.',
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};
