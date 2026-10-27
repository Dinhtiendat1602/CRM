const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Mọi route đều yêu cầu xác thực
router.use(authMiddleware);

// Phân quyền sản phẩm cho Nhân viên bán hàng (Chỉ Quản lý & Admin)
router.get('/salesmen', authorizeRoles('SALE_MANAGER', 'ADMIN'), productController.getSalesmenList);
router.get('/assignments/:userId', authorizeRoles('SALE_MANAGER', 'ADMIN'), productController.getSalesmanAssignments);
router.put('/assignments/:userId', authorizeRoles('SALE_MANAGER', 'ADMIN'), productController.updateSalesmanAssignments);

// Xem danh sách và chi tiết sản phẩm (Mọi vai trò: Salesman chỉ xem sản phẩm được phân quyền)
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
