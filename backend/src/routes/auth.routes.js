const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Public routes: Xác thực & Khôi phục mật khẩu (SRS 3.13, 3.14)
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.get('/verify-reset-token/:token', authController.verifyResetToken);
router.post('/reset-password', authController.resetPassword);

// Authenticated routes: Profile cá nhân
router.get('/me', authMiddleware, authController.getProfile);
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

// RBAC Guard test route (SRS 2.1 Admin role check)
router.get('/test-role-admin', authMiddleware, authorizeRoles('ADMIN'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Chào mừng Admin! Quyền truy cập quản trị hợp lệ.',
    user: req.user,
  });
});

module.exports = router;
