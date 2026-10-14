const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Mọi route đều yêu cầu xác thực
router.use(authMiddleware);

// Xem danh mục (Mọi nhân viên đều được xem để chọn cho sản phẩm)
router.get('/', authorizeRoles('SALESMAN', 'SALE_MANAGER', 'ADMIN'), categoryController.getCategories);
router.get('/:id', authorizeRoles('SALESMAN', 'SALE_MANAGER', 'ADMIN'), categoryController.getCategoryById);

// Thêm, sửa, xóa danh mục (Chỉ Quản lý & Admin - SRS 2.1)
router.post('/', authorizeRoles('SALE_MANAGER', 'ADMIN'), categoryController.createCategory);
router.put('/:id', authorizeRoles('SALE_MANAGER', 'ADMIN'), categoryController.updateCategory);
router.delete('/:id', authorizeRoles('SALE_MANAGER', 'ADMIN'), categoryController.deleteCategory);

module.exports = router;
