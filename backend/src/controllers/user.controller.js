const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { isValidEmail, isValidPhone } = require('../utils/validator');

/**
 * SRS 2.1: Danh sách tất cả tài khoản nhân viên (kèm vai trò)
 * GET /api/admin/users
 * Query: ?page=1&limit=20&search=&role_id=&is_active=
 */
exports.getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const offset = (page - 1) * limit;

    const { search, role_id, is_active } = req.query;

    const conditions = [];
    const params = [];

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      conditions.push(`(u.username ILIKE $${params.length} OR u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }

    if (role_id) {
      params.push(parseInt(role_id, 10));
      conditions.push(`u.role_id = $${params.length}`);
    }

    if (is_active !== undefined && is_active !== '') {
      params.push(is_active === 'true' || is_active === true);
      conditions.push(`u.is_active = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Đếm tổng số bản ghi
    const countResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM users u ${whereClause};`,
      params
    );
    const totalRecords = countResult.rows[0]?.total || 0;

    // Lấy danh sách phân trang
    const dataParams = [...params, limit, offset];
    const dataQuery = `
      SELECT u.id, u.username, u.email, u.full_name, u.phone, u.role_id, r.name AS role_name, u.is_active, u.created_at, u.updated_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY u.id ASC
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length};
    `;

    const dataResult = await db.query(dataQuery, dataParams);

    return res.status(200).json({
      success: true,
      data: dataResult.rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit) || 1,
        totalRecords,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 2.1: Danh sách các vai trò (roles) trong hệ thống
 * GET /api/admin/roles
 */
exports.getRoles = async (req, res, next) => {
  try {
    const result = await db.query('SELECT id, name, description FROM roles ORDER BY id ASC;');
    return res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 2.1: Quản trị viên tạo tài khoản nhân viên mới và gán vai trò
 * POST /api/admin/users
 * Body: { username, email, full_name, phone, role_id, password }
 */
exports.createUser = async (req, res, next) => {
  try {
    const { username, email, full_name, phone, role_id, password } = req.body;

    // Validate các trường bắt buộc
    if (!username || !email || !full_name || !role_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ: Tên đăng nhập, Email, Họ và tên, và Vai trò.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Địa chỉ email không đúng định dạng.',
      });
    }

    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không hợp lệ (từ 9 đến 11 chữ số).',
      });
    }

    // Kiểm tra role_id có tồn tại
    const roleResult = await db.query('SELECT id, name FROM roles WHERE id = $1;', [role_id]);
    if (roleResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vai trò (role_id) không tồn tại trong hệ thống.',
      });
    }

    // Kiểm tra trùng lặp username hoặc email
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    const dupCheck = await db.query(
      'SELECT id, username, email FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2);',
      [cleanUsername, cleanEmail]
    );

    if (dupCheck.rows.length > 0) {
      const isUsernameDup = dupCheck.rows.some((u) => u.username.toLowerCase() === cleanUsername.toLowerCase());
      return res.status(409).json({
        success: false,
        message: isUsernameDup
          ? 'Tên đăng nhập đã tồn tại trong hệ thống.'
          : 'Địa chỉ email đã được sử dụng bởi tài khoản khác.',
      });
    }

    // Mật khẩu khởi tạo: nếu không truyền vào, mặc định là 11111111
    const rawPassword = password || '11111111';
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const insertResult = await db.query(
      `INSERT INTO users (username, email, password_hash, full_name, phone, role_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, username, email, full_name, phone, role_id, is_active, created_at;`,
      [cleanUsername, cleanEmail, passwordHash, full_name.trim(), phone ? phone.trim() : null, role_id]
    );

    const createdUser = {
      ...insertResult.rows[0],
      role_name: roleResult.rows[0].name,
    };

    return res.status(201).json({
      success: true,
      message: 'Tạo tài khoản nhân viên thành công.',
      data: createdUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 2.1: Bật / Tắt trạng thái kích hoạt tài khoản nhân viên
 * PATCH /api/admin/users/:id/status
 * Body: { is_active } (tùy chọn, nếu không gửi sẽ tự đảo ngược)
 */
exports.updateUserStatus = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);

    const userResult = await db.query('SELECT id, username, is_active FROM users WHERE id = $1;', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng.',
      });
    }

    const currentStatus = userResult.rows[0].is_active;
    const requestedStatus = req.body.is_active !== undefined ? Boolean(req.body.is_active) : !currentStatus;

    // Ngăn chặn Admin tự vô hiệu hóa chính mình
    if (userId === req.user.id && !requestedStatus) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể tự vô hiệu hóa tài khoản quản trị của chính mình.',
      });
    }

    const updateResult = await db.query(
      `UPDATE users
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, username, email, full_name, phone, role_id, is_active, updated_at;`,
      [requestedStatus, userId]
    );

    return res.status(200).json({
      success: true,
      message: requestedStatus ? 'Đã kích hoạt tài khoản nhân viên.' : 'Đã khóa tài khoản nhân viên.',
      data: updateResult.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 2.1: Gán / Đổi vai trò nhân viên (Assign user role)
 * PATCH /api/admin/users/:id/role
 * Body: { role_id }
 */
exports.updateUserRole = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { role_id } = req.body;

    if (!role_id) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn vai trò mới (role_id).',
      });
    }

    // Kiểm tra role_id có tồn tại
    const roleResult = await db.query('SELECT id, name FROM roles WHERE id = $1;', [role_id]);
    if (roleResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vai trò (role_id) không tồn tại trong hệ thống.',
      });
    }

    // Kiểm tra user có tồn tại
    const userResult = await db.query('SELECT id, username FROM users WHERE id = $1;', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng.',
      });
    }

    const updateResult = await db.query(
      `UPDATE users
       SET role_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, username, email, full_name, phone, role_id, is_active, updated_at;`,
      [role_id, userId]
    );

    const updatedUser = {
      ...updateResult.rows[0],
      role_name: roleResult.rows[0].name,
    };

    return res.status(200).json({
      success: true,
      message: 'Cập nhật vai trò người dùng thành công.',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 2.1: Quản trị viên reset mật khẩu nhân viên trực tiếp
 * POST /api/admin/users/:id/reset-password
 * Body: { new_password } (tùy chọn, mặc định 11111111)
 */
exports.resetUserPassword = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { new_password } = req.body;

    const userResult = await db.query('SELECT id, username FROM users WHERE id = $1;', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng.',
      });
    }

    const rawPassword = new_password || '11111111';
    if (rawPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.',
      });
    }

    const passwordHash = await bcrypt.hash(rawPassword, 10);

    await db.query(
      `UPDATE users
       SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2;`,
      [passwordHash, userId]
    );

    return res.status(200).json({
      success: true,
      message: `Đã đặt lại mật khẩu cho tài khoản "${userResult.rows[0].username}" thành công.`,
    });
  } catch (error) {
    next(error);
  }
};
