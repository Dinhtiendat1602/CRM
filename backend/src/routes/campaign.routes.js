const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaign.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

/**
 * Router Quản lý Chiến dịch tiếp thị & Báo cáo hiệu quả (SRS 3.18, 3.19)
 * Bảo vệ bởi xác thực JWT và phân quyền RBAC
 */

// Tất cả endpoints đều yêu cầu đăng nhập
router.use(authMiddleware);

// 1. Xem danh sách và chi tiết chiến dịch (Cho phép Salesman, Sale Manager, Admin)
router.get('/', campaignController.getCampaigns);
router.get('/:id', campaignController.getCampaignById);

// 2. Báo cáo hiệu quả chiến dịch (Campaign Performance Report - SRS 3.19: Chỉ Sale Manager & Admin)
router.get(
  '/:id/report',
  authorizeRoles('SALE_MANAGER', 'ADMIN'),
  campaignController.getCampaignReport
);

// 3. Thêm mới, chỉnh sửa, xóa chiến dịch (SRS 3.18: Chỉ Sale Manager & Admin)
router.post(
  '/',
  authorizeRoles('SALE_MANAGER', 'ADMIN'),
  campaignController.createCampaign
);

router.put(
  '/:id',
  authorizeRoles('SALE_MANAGER', 'ADMIN'),
  campaignController.updateCampaign
);

router.delete(
  '/:id',
  authorizeRoles('SALE_MANAGER', 'ADMIN'),
  campaignController.deleteCampaign
);

// 4. Gán và gỡ sản phẩm vào chiến dịch (SRS 3.18.1: Chỉ Sale Manager & Admin)
router.post(
  '/:id/products',
  authorizeRoles('SALE_MANAGER', 'ADMIN'),
  campaignController.assignProducts
);

router.delete(
  '/:id/products/:productId',
  authorizeRoles('SALE_MANAGER', 'ADMIN'),
  campaignController.removeProductFromCampaign
);

module.exports = router;
