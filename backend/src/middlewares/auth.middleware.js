const jwt = require('jsonwebtoken');
const db = require('../config/db');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy access token xác thực.',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'zen_crm_secret');

    // Kiểm tra tài khoản có thực sự tồn tại trong CSDL và đang hoạt động
    const userResult = await db.query(
      'SELECT id, username, email, is_active, role_id FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({
        success: false,
        message: 'Phiên làm việc không còn hợp lệ do tài khoản không tồn tại hoặc đã bị khóa. Vui lòng đăng nhập lại.',
      });
    }

    req.user = {
      ...decoded,
      ...userResult.rows[0],
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ hoặc đã hết hạn.',
    });
  }
};
