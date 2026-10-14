const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Public route: Đăng nhập
router.post('/login', authController.login);

// Authenticated routes: Profile
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
