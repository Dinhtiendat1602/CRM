const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Toàn bộ các API Admin yêu cầu xác thực JWT và vai trò ADMIN (SRS 2.1)
router.use(authMiddleware);
router.use(authorizeRoles('ADMIN'));

// Danh sách vai trò (dùng cho dropdown tạo/đổi role)
router.get('/roles', userController.getRoles);

// CRUD người dùng cho Quản trị viên
router.get('/users', userController.getUsers);
router.post('/users', userController.createUser);
router.patch('/users/:id/status', userController.updateUserStatus);
router.patch('/users/:id/role', userController.updateUserRole);
router.post('/users/:id/reset-password', userController.resetUserPassword);

module.exports = router;
