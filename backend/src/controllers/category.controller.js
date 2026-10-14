const db = require('../config/db');

/**
 * Lấy danh sách tất cả Danh mục sản phẩm kèm số lượng sản phẩm (SRS 3.15)
 * GET /api/categories
 */
const getCategories = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.id, 
        c.name, 
        c.description, 
        c.created_at, 
        c.updated_at,
        COUNT(p.id)::int AS products_count
      FROM product_categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `;
    const result = await db.query(query);

    return res.status(200).json({
      success: true,
      categories: result.rows,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách danh mục:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách danh mục sản phẩm.',
    });
  }
};

/**
 * Lấy chi tiết 1 Danh mục sản phẩm
 * GET /api/categories/:id
 */
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT c.*, COUNT(p.id)::int AS products_count 
       FROM product_categories c 
       LEFT JOIN products p ON c.id = p.category_id 
       WHERE c.id = $1 
       GROUP BY c.id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục sản phẩm.',
      });
    }

    return res.status(200).json({
      success: true,
      category: result.rows[0],
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết danh mục:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy chi tiết danh mục.',
    });
  }
};

/**
 * Tạo mới Danh mục sản phẩm (Chỉ Admin & Sale Manager)
 * POST /api/categories
 */
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục là bắt buộc.',
      });
    }

    // Kiểm tra trùng tên danh mục
    const dupCheck = await db.query('SELECT id FROM product_categories WHERE LOWER(name) = LOWER($1)', [
      name.trim(),
    ]);
    if (dupCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Tên danh mục sản phẩm này đã tồn tại.',
      });
    }

    const result = await db.query(
      `INSERT INTO product_categories (name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [name.trim(), description ? description.trim() : null]
    );

    return res.status(201).json({
      success: true,
      message: 'Tạo danh mục sản phẩm thành công.',
      category: result.rows[0],
    });
  } catch (error) {
    console.error('Lỗi khi tạo danh mục:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tạo danh mục sản phẩm.',
    });
  }
};

/**
 * Cập nhật Danh mục sản phẩm
 * PUT /api/categories/:id
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục là bắt buộc.',
      });
    }

    // Kiểm tra danh mục tồn tại
    const existCheck = await db.query('SELECT id FROM product_categories WHERE id = $1', [id]);
    if (existCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục để cập nhật.',
      });
    }

    // Kiểm tra trùng tên với danh mục khác
    const dupCheck = await db.query(
      'SELECT id FROM product_categories WHERE LOWER(name) = LOWER($1) AND id != $2',
      [name.trim(), id]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Tên danh mục sản phẩm này đã được sử dụng bởi danh mục khác.',
      });
    }

    const result = await db.query(
      `UPDATE product_categories 
       SET name = $1, description = $2, updated_at = NOW() 
       WHERE id = $3 
       RETURNING *`,
      [name.trim(), description !== undefined ? (description ? description.trim() : null) : null, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Cập nhật danh mục thành công.',
      category: result.rows[0],
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật danh mục:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật danh mục.',
    });
  }
};

/**
 * Xóa Danh mục sản phẩm (Chặn nếu đang có sản phẩm liên kết)
 * DELETE /api/categories/:id
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra danh mục tồn tại
    const existCheck = await db.query('SELECT id FROM product_categories WHERE id = $1', [id]);
    if (existCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục để xóa.',
      });
    }

    // Kiểm tra ràng buộc xem có sản phẩm nào thuộc danh mục này không
    const prodCheck = await db.query('SELECT id FROM products WHERE category_id = $1 LIMIT 1', [id]);
    if (prodCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa danh mục này vì đang có sản phẩm liên kết. Vui lòng chuyển hoặc xóa sản phẩm trước.',
      });
    }

    await db.query('DELETE FROM product_categories WHERE id = $1', [id]);

    return res.status(200).json({
      success: true,
      message: 'Xóa danh mục sản phẩm thành công.',
    });
  } catch (error) {
    console.error('Lỗi khi xóa danh mục:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xóa danh mục.',
    });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
