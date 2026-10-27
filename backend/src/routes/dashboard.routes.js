const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/**
 * Router Dashboard Thống kê & Dữ liệu Tổng quan Thời gian thực
 * Yêu cầu xác thực JWT, hỗ trợ mọi vai trò: ADMIN, SALE_MANAGER, SALESMAN
 */
router.use(authMiddleware);

router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
