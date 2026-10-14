const express = require('express');
const router = express.Router();
const opportunityController = require('../controllers/opportunity.controller');
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Áp dụng xác thực cho toàn bộ các endpoint Opportunities (SRS 2.1)
router.use(authMiddleware);
router.use(authorizeRoles('SALESMAN', 'SALE_MANAGER', 'ADMIN'));

// Danh mục trạng thái cơ hội (đặt trước /:id để không bị bắt nhầm param)
router.get('/statuses', opportunityController.getStatuses);

// Kiểm tra trùng lặp cơ hội Lead-Product chưa đóng (SRS 3.6.2 REQ-4, BR-02)
router.get('/check-duplicate', opportunityController.checkDuplicate);

// Lấy danh sách Cơ hội (phân trang 20 dòng, search tên Lead/SP, filter ngày, sort ngày) (SRS 3.7, 3.8)
router.get('/', opportunityController.getOpportunities);

// Lấy chi tiết Cơ hội kèm lịch sử Follow-up và thông tin đơn hàng (SRS 3.7.3 REQ-4)
router.get('/:id', opportunityController.getOpportunityById);

// Thêm mới Cơ hội bán hàng (SRS 3.6)
router.post('/', opportunityController.createOpportunity);

// Cập nhật Cơ hội bán hàng (SRS 3.9)
router.put('/:id', opportunityController.updateOpportunity);

// Xóa Cơ hội bán hàng (chặn xóa nếu đã chốt đơn ORDERED) (SRS 3.10)
router.delete('/:id', opportunityController.deleteOpportunity);

// Make an Order - Chốt đơn hàng bằng Database Transaction (SRS 3.12, BR-03, BR-07)
router.post('/:id/make-order', orderController.makeOrder);

// Ghi nhận nhật ký chăm sóc Follow-up (hỗ trợ cả /follow-ups và /follow-up) (SRS 3.11)
router.post('/:id/follow-ups', opportunityController.addFollowUp);
router.post('/:id/follow-up', opportunityController.addFollowUp);

// Lấy danh sách lịch sử Follow-up của một cơ hội (SRS 3.11)
router.get('/:id/follow-ups', opportunityController.getFollowUps);

module.exports = router;
