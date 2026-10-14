const express = require('express');
const router = express.Router();
const leadController = require('../controllers/lead.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { authorizeRoles } = require('../middlewares/role.middleware');

// Áp dụng xác thực cho toàn bộ các endpoint Leads (SRS 2.1)
router.use(authMiddleware);
router.use(authorizeRoles('SALESMAN', 'SALE_MANAGER', 'ADMIN'));

// Kiểm tra trùng lặp email/SĐT (đặt trước :id để không bị bắt nhầm param)
router.get('/check-duplicate', leadController.checkDuplicate);

// Lấy danh sách Khách tiềm năng (phân trang 20 dòng, sort/filter ngày nhập, search tên) (SRS 3.2, 3.3)
router.get('/', leadController.getLeads);

// Lấy chi tiết Khách tiềm năng kèm danh sách Cơ hội liên quan (SRS 3.2.3 REQ-4)
router.get('/:id', leadController.getLeadById);

// Thêm mới Khách tiềm năng (chống trùng SĐT/Email 409) (SRS 3.1)
router.post('/', leadController.createLead);

// Cập nhật thông tin Khách tiềm năng (SRS 3.4)
router.put('/:id', leadController.updateLead);

// Xóa Khách tiềm năng (SRS 3.5)
router.delete('/:id', leadController.deleteLead);

module.exports = router;
