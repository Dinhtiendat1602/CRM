const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Tất cả endpoints đơn hàng đều yêu cầu xác thực JWT (SRS 2.1)
router.use(authMiddleware);

// Lấy danh sách Đơn hàng (phân trang 20 dòng BR-03, search, filter ngày) (SRS 3.12, 2.1)
router.get('/', authorizeRoles('SALESMAN', 'SALE_MANAGER', 'ADMIN'), orderController.getOrders);

// Tạo đơn hàng trực tiếp bằng opportunity_id (Make an Order) (SRS 3.12)
router.post('/', authorizeRoles('SALESMAN', 'SALE_MANAGER', 'ADMIN'), orderController.makeOrder);

// Lấy chi tiết một Đơn hàng theo ID hoặc order_code (SRS 3.12)
router.get('/:id', authorizeRoles('SALESMAN', 'SALE_MANAGER', 'ADMIN'), orderController.getOrderById);

module.exports = router;
