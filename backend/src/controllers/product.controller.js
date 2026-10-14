const db = require('../config/db');

/**
 * Lấy danh sách Sản phẩm (SRS 3.15, BR-03)
 * GET /api/products
 * Query: { page, limit, search, category_id, campaign_id, sortBy, sortOrder }
 */
const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20; // BR-03: mặc định 20 dòng
    const offset = (page - 1) * limit;

    const { search, category_id, campaign_id, sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

    const allowedSortFields = ['created_at', 'product_code', 'name', 'unit_price', 'stock_qty'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // Tìm kiếm theo mã sản phẩm hoặc tên sản phẩm
    if (search && search.trim()) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.product_code ILIKE $${paramIndex})`);
      values.push(`%${search.trim()}%`);
      paramIndex++;
    }

    // Lọc theo danh mục
    if (category_id) {
      conditions.push(`p.category_id = $${paramIndex}`);
      values.push(parseInt(category_id, 10));
      paramIndex++;
    }

    // Lọc theo chiến dịch
    if (campaign_id) {
      conditions.push(`p.campaign_id = $${paramIndex}`);
      values.push(parseInt(campaign_id, 10));
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Đếm tổng số bản ghi
    const countQuery = `SELECT COUNT(*)::int AS total FROM products p ${whereClause}`;
    const countResult = await db.query(countQuery, values);
    const totalRecords = countResult.rows[0].total;

    // Lấy dữ liệu sản phẩm kèm danh mục và chiến dịch
    const dataQuery = `
      SELECT 
        p.id,
        p.product_code,
        p.name,
        p.description,
        p.category_id,
        c.name AS category_name,
        p.unit_price,
        p.stock_qty,
        p.campaign_id,
        cmp.name AS campaign_name,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN campaigns cmp ON p.campaign_id = cmp.id
      ${whereClause}
      ORDER BY p.${validSortBy} ${validSortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);
    const dataResult = await db.query(dataQuery, values);

    return res.status(200).json({
      success: true,
      products: dataResult.rows,
      pagination: {
        currentPage: page,
        page,
        limit,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách sản phẩm.',
    });
  }
};

/**
 * Lấy chi tiết 1 Sản phẩm
 * GET /api/products/:id
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        p.*,
        c.name AS category_name,
        cmp.name AS campaign_name
      FROM products p
      LEFT JOIN product_categories c ON p.category_id = c.id
      LEFT JOIN campaigns cmp ON p.campaign_id = cmp.id
      WHERE p.id = $1
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm yêu cầu.',
      });
    }

    return res.status(200).json({
      success: true,
      product: result.rows[0],
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy chi tiết sản phẩm.',
    });
  }
};

/**
 * Tạo mới Sản phẩm (Chỉ Admin & Sale Manager)
 * POST /api/products
 */
const createProduct = async (req, res) => {
  try {
    const { product_code, name, description, category_id, unit_price, stock_qty = 0, campaign_id } = req.body;

    // Validate bắt buộc
    if (!product_code || !product_code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mã sản phẩm (product_code) là bắt buộc.',
      });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tên sản phẩm là bắt buộc.',
      });
    }
    if (unit_price === undefined || unit_price === null || isNaN(unit_price) || Number(unit_price) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Đơn giá sản phẩm phải là số không âm.',
      });
    }
    if (stock_qty !== undefined && (isNaN(stock_qty) || Number(stock_qty) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng tồn kho phải là số nguyên không âm.',
      });
    }

    // Kiểm tra trùng mã sản phẩm (Unique constraint)
    const dupCheck = await db.query(
      'SELECT id FROM products WHERE LOWER(product_code) = LOWER($1)',
      [product_code.trim()]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: `Mã sản phẩm "${product_code.trim()}" đã tồn tại trên hệ thống.`,
      });
    }

    // Kiểm tra category_id nếu có
    if (category_id) {
      const catCheck = await db.query('SELECT id FROM product_categories WHERE id = $1', [category_id]);
      if (catCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Danh mục sản phẩm được chọn không tồn tại.',
        });
      }
    }

    // Kiểm tra campaign_id nếu có
    if (campaign_id) {
      const campCheck = await db.query('SELECT id FROM campaigns WHERE id = $1', [campaign_id]);
      if (campCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Chiến dịch được chọn không tồn tại.',
        });
      }
    }

    const insertQuery = `
      INSERT INTO products (
        product_code, name, description, category_id, unit_price, stock_qty, campaign_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await db.query(insertQuery, [
      product_code.trim().toUpperCase(),
      name.trim(),
      description ? description.trim() : null,
      category_id || null,
      Number(unit_price),
      parseInt(stock_qty, 10) || 0,
      campaign_id || null,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm mới thành công.',
      product: result.rows[0],
    });
  } catch (error) {
    console.error('Lỗi khi tạo sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo sản phẩm.',
    });
  }
};

/**
 * Cập nhật Sản phẩm
 * PUT /api/products/:id
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_code, name, description, category_id, unit_price, stock_qty, campaign_id } = req.body;

    // Kiểm tra sản phẩm tồn tại
    const existCheck = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (existCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm để cập nhật.',
      });
    }
    const currentProduct = existCheck.rows[0];

    // Validate bắt buộc nếu có cập nhật
    if (product_code && !product_code.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Mã sản phẩm không được để trống.',
      });
    }
    if (name && !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tên sản phẩm không được để trống.',
      });
    }
    if (unit_price !== undefined && (isNaN(unit_price) || Number(unit_price) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Đơn giá sản phẩm phải là số không âm.',
      });
    }
    if (stock_qty !== undefined && (isNaN(stock_qty) || Number(stock_qty) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng tồn kho phải là số nguyên không âm.',
      });
    }

    // Kiểm tra trùng mã SP với sản phẩm khác
    if (product_code && product_code.trim().toUpperCase() !== currentProduct.product_code) {
      const dupCheck = await db.query(
        'SELECT id FROM products WHERE LOWER(product_code) = LOWER($1) AND id != $2',
        [product_code.trim(), id]
      );
      if (dupCheck.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Mã sản phẩm "${product_code.trim()}" đã được sử dụng bởi sản phẩm khác.`,
        });
      }
    }

    // Kiểm tra category_id nếu thay đổi
    if (category_id) {
      const catCheck = await db.query('SELECT id FROM product_categories WHERE id = $1', [category_id]);
      if (catCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Danh mục sản phẩm được chọn không tồn tại.',
        });
      }
    }

    // Kiểm tra campaign_id nếu thay đổi
    if (campaign_id) {
      const campCheck = await db.query('SELECT id FROM campaigns WHERE id = $1', [campaign_id]);
      if (campCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Chiến dịch được chọn không tồn tại.',
        });
      }
    }

    const updatedCode = product_code ? product_code.trim().toUpperCase() : currentProduct.product_code;
    const updatedName = name ? name.trim() : currentProduct.name;
    const updatedDesc = description !== undefined ? (description ? description.trim() : null) : currentProduct.description;
    const updatedCat = category_id !== undefined ? (category_id || null) : currentProduct.category_id;
    const updatedPrice = unit_price !== undefined ? Number(unit_price) : currentProduct.unit_price;
    const updatedStock = stock_qty !== undefined ? parseInt(stock_qty, 10) : currentProduct.stock_qty;
    const updatedCamp = campaign_id !== undefined ? (campaign_id || null) : currentProduct.campaign_id;

    const updateQuery = `
      UPDATE products 
      SET 
        product_code = $1,
        name = $2,
        description = $3,
        category_id = $4,
        unit_price = $5,
        stock_qty = $6,
        campaign_id = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `;
    const result = await db.query(updateQuery, [
      updatedCode,
      updatedName,
      updatedDesc,
      updatedCat,
      updatedPrice,
      updatedStock,
      updatedCamp,
      id,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin sản phẩm thành công.',
      product: result.rows[0],
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật sản phẩm.',
    });
  }
};

/**
 * Xóa Sản phẩm (SRS 3.15)
 * DELETE /api/products/:id
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const existCheck = await db.query('SELECT id, name FROM products WHERE id = $1', [id]);
    if (existCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm để xóa.',
      });
    }

    // Kiểm tra ràng buộc trong Bảng Opportunities
    const oppCheck = await db.query('SELECT id FROM opportunities WHERE product_id = $1 LIMIT 1', [id]);
    if (oppCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa sản phẩm này vì đã có Cơ hội bán hàng (Opportunities) đang quan tâm đến sản phẩm.',
      });
    }

    // Kiểm tra ràng buộc trong Bảng Orders
    const orderCheck = await db.query('SELECT id FROM orders WHERE product_id = $1 LIMIT 1', [id]);
    if (orderCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa sản phẩm này vì đã có Đơn hàng (Orders) đã phát sinh từ sản phẩm.',
      });
    }

    await db.query('DELETE FROM products WHERE id = $1', [id]);

    return res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm thành công.',
    });
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa sản phẩm.',
    });
  }
};

/**
 * Xem danh sách tất cả Cơ hội bán hàng liên quan đến sản phẩm này (SRS 3.16)
 * GET /api/products/:id/opportunities
 */
const getProductOpportunities = async (req, res) => {
  try {
    const { id } = req.params;

    const existCheck = await db.query('SELECT id, name, product_code FROM products WHERE id = $1', [id]);
    if (existCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm.',
      });
    }

    const query = `
      SELECT 
        o.id,
        o.quantity,
        o.expected_close_date,
        o.status,
        o.notes,
        o.created_at,
        l.id AS lead_id,
        l.first_name,
        l.last_name,
        l.email AS lead_email,
        l.phone AS lead_phone,
        u.full_name AS salesman_name
      FROM opportunities o
      JOIN leads l ON o.lead_id = l.id
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.product_id = $1
      ORDER BY o.created_at DESC
    `;
    const result = await db.query(query, [id]);

    return res.status(200).json({
      success: true,
      product: existCheck.rows[0],
      opportunities: result.rows,
      totalCount: result.rows.length,
    });
  } catch (error) {
    console.error('Lỗi khi lấy cơ hội của sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách cơ hội của sản phẩm.',
    });
  }
};

/**
 * Xem danh sách tất cả Đơn hàng đã xuất bán sản phẩm này (SRS 3.17)
 * GET /api/products/:id/orders
 */
const getProductOrders = async (req, res) => {
  try {
    const { id } = req.params;

    const existCheck = await db.query('SELECT id, name, product_code FROM products WHERE id = $1', [id]);
    if (existCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm.',
      });
    }

    const query = `
      SELECT 
        ord.id,
        ord.order_code,
        ord.quantity,
        ord.unit_price,
        ord.total_amount,
        ord.order_date,
        ord.status,
        ord.payment_info,
        ord.shipping_address,
        l.id AS lead_id,
        l.first_name,
        l.last_name,
        l.email AS customer_email,
        l.phone AS customer_phone,
        u.full_name AS creator_name
      FROM orders ord
      JOIN leads l ON ord.lead_id = l.id
      LEFT JOIN users u ON ord.created_by = u.id
      WHERE ord.product_id = $1
      ORDER BY ord.order_date DESC
    `;
    const result = await db.query(query, [id]);

    return res.status(200).json({
      success: true,
      product: existCheck.rows[0],
      orders: result.rows,
      totalCount: result.rows.length,
    });
  } catch (error) {
    console.error('Lỗi khi lấy đơn hàng của sản phẩm:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách đơn hàng của sản phẩm.',
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductOpportunities,
  getProductOrders,
};
