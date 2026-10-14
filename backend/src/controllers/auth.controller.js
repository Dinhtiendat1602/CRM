const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { isValidEmail, isValidPhone } = require('../utils/validator');
const { sendResetPasswordEmail } = require('../config/mailer');

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
          role_name: user.role,
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
      `SELECT u.id, u.username, u.email, u.full_name, u.phone, u.is_active, r.name AS role, r.name AS role_name, u.created_at, u.updated_at
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

/**
 * SRS 3.14 REQ-1: Quên mật khẩu - Nhập email & gửi mail liên kết đặt lại mật khẩu
 * POST /api/auth/forgot-password
 * Body: { email }
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp địa chỉ email hợp lệ.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Kiểm tra email tồn tại trong CSDL
    const userResult = await db.query(
      'SELECT id, email, full_name, is_active FROM users WHERE LOWER(email) = $1;',
      [cleanEmail]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống.',
      });
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên.',
      });
    }

    // Sinh reset token ngẫu nhiên an toàn (64 ký tự hex)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // Có hiệu lực trong 15 phút

    // Cập nhật reset token và thời hạn vào CSDL
    await db.query(
      `UPDATE users
       SET reset_password_token = $1, reset_password_expires = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3;`,
      [resetToken, resetExpires, user.id]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

    // Gửi email qua Nodemailer SMTP
    try {
      await sendResetPasswordEmail(user.email, resetLink, user.full_name);
    } catch (mailError) {
      console.error('[Nodemailer Error] Không thể gửi email:', mailError.message);
      if (process.env.NODE_ENV !== 'test') {
        return res.status(500).json({
          success: false,
          message: 'Không thể gửi email đặt lại mật khẩu vào lúc này. Vui lòng thử lại sau.',
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Đã gửi liên kết đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra hộp thư (hết hạn sau 15 phút).',
      ...(process.env.NODE_ENV === 'test' && { resetToken, resetLink }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.14: Kiểm tra tính hợp lệ của reset token trước khi hiển thị form
 * GET /api/auth/verify-reset-token/:token
 */
exports.verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Mã đặt lại mật khẩu không hợp lệ.',
      });
    }

    const userResult = await db.query(
      `SELECT id, email, full_name FROM users
       WHERE reset_password_token = $1 AND reset_password_expires > CURRENT_TIMESTAMP;`,
      [token.trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Mã token hợp lệ.',
      data: {
        email: userResult.rows[0].email,
        full_name: userResult.rows[0].full_name,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * SRS 3.14 REQ-2: Đặt lại mật khẩu mới qua reset token
 * POST /api/auth/reset-password
 * Body: { token, new_password }
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã token và mật khẩu mới.',
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.',
      });
    }

    // Tìm user có token khớp và còn trong thời hạn 15 phút
    const userResult = await db.query(
      `SELECT id, username, email FROM users
       WHERE reset_password_token = $1 AND reset_password_expires > CURRENT_TIMESTAMP;`,
      [token.trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
      });
    }

    const user = userResult.rows[0];
    const passwordHash = await bcrypt.hash(new_password, 10);

    // Cập nhật mật khẩu mới và hủy token đã sử dụng
    await db.query(
      `UPDATE users
       SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2;`,
      [passwordHash, user.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.',
    });
  } catch (error) {
    next(error);
  }
};
