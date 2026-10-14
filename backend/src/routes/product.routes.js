const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Mọi route đều yêu cầu xác thực
router.use(authMiddleware);

// Xem danh sách và chi tiết sản phẩm (Mọi vai trò: Salesman cần xem để chọn khi tạo cơ hội)
router.get('/', authorizeRoles('SALESMAN', 'SALE_MANAGER', 'ADMIN'), productController.getProducts);
router.get('/:id', authorizeRoles('SALESMAN', 'SALE_MANAGER', 'ADMIN'), productController.getProductById);

// Hai APIs đặc thù theo SRS:
// GET /api/products/:id/opportunities (SRS 3.16: Xem các cơ hội liên quan đến sản phẩm)
router.get('/:id/opportunities', authorizeRoles('SALE_MANAGER', 'ADMIN'), productController.getProductOpportunities);

// GET /api/products/:id/orders (SRS 3.17: Xem các đơn hàng đã bán sản phẩm này)
router.get('/:id/orders', authorizeRoles('SALE_MANAGER', 'ADMIN'), productController.getProductOrders);

// Thêm, sửa, xóa sản phẩm (Chỉ Quản lý & Admin - SRS 2.1)
router.post('/', authorizeRoles('SALE_MANAGER', 'ADMIN'), productController.createProduct);
router.put('/:id', authorizeRoles('SALE_MANAGER', 'ADMIN'), productController.updateProduct);
router.delete('/:id', authorizeRoles('SALE_MANAGER', 'ADMIN'), productController.deleteProduct);

module.exports = router;
