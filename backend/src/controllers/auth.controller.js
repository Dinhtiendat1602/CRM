const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { isValidPhone } = require('../utils/validator');

/**
 * SRS 3.13: Đăng nhập hệ thống
 * POST /api/auth/login
 * Body: { username, password } (cho phép đăng nhập bằng username hoặc email)
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập tên đăng nhập (hoặc email) và mật khẩu.',
      });
    }

    const identifier = username.trim().toLowerCase();

    // Tìm user theo username hoặc email kèm tên vai trò
    const userResult = await db.query(
      `SELECT u.id, u.username, u.email, u.password_hash, u.full_name, u.phone, u.is_active, r.name AS role
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE LOWER(u.username) = $1 OR LOWER(u.email) = $1;`,
      [identifier]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác.',
      });
    }

    const user = userResult.rows[0];

    // Kiểm tra trạng thái kích hoạt tài khoản
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt. Vui lòng liên hệ Admin.',
      });
    }

    // So sánh mật khẩu bằng bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Tên đăng nhập hoặc mật khẩu không chính xác.',
      });
    }

    // Sinh JWT Access Token
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'zen_crm_secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công.',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.13: Lấy thông tin tài khoản đang đăng nhập
 * GET /api/auth/me hoặc GET /api/auth/profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT u.id, u.username, u.email, u.full_name, u.phone, u.is_active, r.name AS role, u.created_at, u.updated_at
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1;`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng.',
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

/**
 * SRS 3.13: Cập nhật thông tin profile cá nhân (Họ tên, SĐT, Mật khẩu)
 * PUT /api/auth/profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { full_name, phone, old_password, new_password } = req.body;

    // Lấy thông tin user hiện tại
    const currentResult = await db.query('SELECT * FROM users WHERE id = $1;', [userId]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Người dùng không tồn tại.',
      });
    }
    const currentUser = currentResult.rows[0];

    let newPasswordHash = currentUser.password_hash;

    // Nếu người dùng yêu cầu đổi mật khẩu
    if (new_password) {
      if (!old_password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp mật khẩu cũ để xác thực thay đổi.',
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.',
        });
      }

      const isOldValid = await bcrypt.compare(old_password, currentUser.password_hash);
      if (!isOldValid) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu cũ không chính xác.',
        });
      }

      newPasswordHash = await bcrypt.hash(new_password, 10);
    }

    // Validate số điện thoại nếu có cập nhật
    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không hợp lệ (từ 9 đến 11 chữ số).',
      });
    }

    const updatedFullName = full_name !== undefined ? full_name.trim() : currentUser.full_name;
    const updatedPhone = phone !== undefined ? phone.trim() : currentUser.phone;

    const updateResult = await db.query(
      `UPDATE users
       SET full_name = $1, phone = $2, password_hash = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, username, email, full_name, phone, role_id, is_active, updated_at;`,
      [updatedFullName, updatedPhone, newPasswordHash, userId]
    );

    // Lấy tên vai trò
    const roleResult = await db.query('SELECT name FROM roles WHERE id = $1;', [updateResult.rows[0].role_id]);
    const updatedUser = {
      ...updateResult.rows[0],
      role: roleResult.rows[0]?.name,
    };
    delete updatedUser.role_id;

    return res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin cá nhân thành công.',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
