const express = require('express');
const router = express.Router();
const forecastController = require('../controllers/forecast.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

/**
 * Router Lập Kế hoạch Doanh số 12 Tháng & Báo cáo Đối soát Performance (SRS 3.20, 3.21)
 * Phân quyền RBAC nghiêm ngặt: Chỉ Quản lý Bán hàng (SALE_MANAGER) và Quản trị viên (ADMIN)
 */

router.use(authMiddleware);
router.use(authorizeRoles('SALE_MANAGER', 'ADMIN'));

// 1. SRS 3.20: Thiết lập / Cập nhật Kế hoạch 12 Tháng của Năm tài chính
router.post('/setup', forecastController.setupPlan);

// 2. SRS 3.20: Lấy Kế hoạch 12 Tháng theo Năm tài chính
router.get('/plans', forecastController.getPlansByYear);

// 3. SRS 3.21: Báo cáo Đối soát Kế hoạch vs Thực tế 12 Tháng (Performance Report)
router.get('/performance', forecastController.getPerformanceReport);

// 4. Helper: Danh sách các năm tài chính khả dụng
router.get('/years', forecastController.getAvailableYears);

module.exports = router;
