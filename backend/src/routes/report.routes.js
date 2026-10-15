const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

/**
 * Router Báo cáo Bán hàng & Thống kê Doanh số (SRS 2.1)
 * Phân quyền RBAC nghiêm ngặt: Chỉ Quản lý Bán hàng (SALE_MANAGER) và Quản trị viên (ADMIN)
 */

router.use(authMiddleware);
router.use(authorizeRoles('SALE_MANAGER', 'ADMIN'));

// 1. Báo cáo Tổng quan KPI nhanh (Executive Summary)
router.get('/summary', reportController.getSummaryReport);

// 2. Báo cáo Khách hàng tiềm năng (Leads Reporting)
router.get('/leads', reportController.getLeadReport);

// 3. Báo cáo Đơn hàng & Giá trị đơn (Orders Reporting)
router.get('/orders', reportController.getOrderReport);

// 4. Báo cáo Doanh thu theo Sản phẩm & Danh mục (Revenue Reporting theo SRS 2.1)
router.get('/revenue', reportController.getRevenueReport);

module.exports = router;
