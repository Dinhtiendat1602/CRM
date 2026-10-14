<!-- Chức năng: Biên bản bàn giao phiên: ghi lại việc đang làm dở, blocker và bước tiếp theo khi mở chat mới -->

# Session Handoff

## Current Objective

- Goal: Triển khai tính năng `feat-012` (Backend Quản lý Cơ hội & Nhật ký Chăm sóc - Opportunities & Follow-up Log) và chuẩn bị chuyển giao sang `feat-013` (Frontend Giao diện Quản lý Cơ hội & Timeline Follow-up - Opportunities UI).
- Current status: `feat-012` HOÀN THÀNH (100% Definition of Done đạt chuẩn). Đạt cột mốc 12/20 tính năng hoàn thành (60% toàn bộ hệ thống Zen CRM).
- Branch / commit: `main`

## Completed This Session

- [x] Xây dựng Controller `backend/src/controllers/opportunity.controller.js` hoàn chỉnh theo chuẩn Clean MVC tuân thủ nghiêm ngặt SRS 3.6 - 3.11:
  - `getOpportunities`: Lấy danh sách cơ hội phân trang chuẩn 20 dòng theo BR-03 (SRS 3.7.3 REQ-1), tìm kiếm theo tên Lead hoặc tên/mã Sản phẩm (SRS 3.8), sắp xếp theo ngày tạo (BR-04, SRS 3.7.3 REQ-2), lọc theo khoảng ngày (BR-05, SRS 3.7.3 REQ-3), lọc theo trạng thái status (`NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL`, `ORDERED`, `LOST`), khách hàng `lead_id`, sản phẩm `product_id`; tự động tính toán giá trị ước tính `estimated_value` và đếm số lượt chăm sóc `follow_ups_count`.
  - `getOpportunityById`: Trả về chi tiết Cơ hội kèm thông tin Lead, Sản phẩm (danh mục, giá bán, tồn kho), toàn bộ danh sách lịch sử Follow-up theo dòng thời gian (`follow_ups`) và thông tin đơn hàng nếu đã chốt (`orders`) (SRS 3.7.3 REQ-4).
  - `getStatuses`: Danh mục 6 trạng thái cơ hội chuẩn kèm nhãn tiếng Việt.
  - `checkDuplicate`: Kiểm tra realtime cơ hội đang mở giữa khách hàng và sản phẩm (BR-02, SRS 3.6.2 REQ-4).
  - `createOpportunity`: Thêm mới Cơ hội gắn với Lead + Sản phẩm + Số lượng + Ngày dự kiến (SRS 3.6); tích hợp cơ chế chống trùng lặp theo BR-02 trả về HTTP 409 Conflict khi khách hàng đang có cơ hội chưa đóng cho sản phẩm đó.
  - `updateOpportunity`: Cập nhật Cơ hội (số lượng, trạng thái, ngày dự kiến, ghi chú) (SRS 3.9); bảo vệ không cho đổi sản phẩm/khách hàng khi đã chốt đơn.
  - `deleteOpportunity`: Xóa Cơ hội (SRS 3.10), tự động CASCADE dọn dẹp các bản ghi follow-ups liên quan, chặn xóa trả về HTTP 400 nếu cơ hội đã chuyển đổi thành đơn hàng ORDERED.
  - `addFollowUp` (`POST /api/opportunities/:id/follow-ups` & `POST /api/opportunities/:id/follow-up`): Ghi nhận nhật ký chăm sóc (ngày, phương thức liên hệ, nội dung, phản hồi khách, kế hoạch tiếp) (SRS 3.11), tự động cập nhật trạng thái cơ hội sang `CONTACTED` hoặc theo trạng thái chỉ định.
  - `getFollowUps`: Lấy danh sách lịch sử tương tác chăm sóc của cơ hội.
- [x] Xây dựng Route `backend/src/routes/opportunity.routes.js` bọc bởi `authMiddleware` và `authorizeRoles('SALESMAN', 'SALE_MANAGER', 'ADMIN')`.
- [x] Mount route `/api/opportunities` vào `backend/src/app.js`.
- [x] Viết 17 bài integration tests tại `backend/tests/opportunity.test.js` kiểm tra toàn diện: CRUD cơ hội, phân trang 20 dòng, search Lead/Sản phẩm, chống trùng 409, tạo follow-up, chặn xóa khi có đơn hàng.
- [x] Chạy kiểm thử toàn hệ thống đạt 132/132 tests pass (87 backend + 45 frontend).
- [x] Khôi phục toàn bộ mật khẩu tài khoản mặc định `admin`, `manager`, `salesman` về `11111111` bằng `npm run db:seed`.

## Verification Evidence

| Check | Command | Result | Notes |
|---|---|---|---|
| Backend Test Suite | `npm test` (trong `backend/`) | PASS (87/87 tests passed) | `app.test.js` (2), `auth.test.js` (12), `db.test.js` (4), `forgot-password.test.js` (6), `user.test.js` (13), `lead.test.js` (15), `product.test.js` (18), `opportunity.test.js` (17) |
| Frontend Test Suite | `npm test` (trong `frontend/`) | PASS (45/45 tests passed) | `admin-ui.test.js` (10 tests) + `leads-ui.test.js` (10 tests) + `login-flow.test.js` (5 tests) + `products-ui.test.js` (10 tests) + `user-management.test.js` (10 tests) |
| Frontend Lint | `npm run lint` (trong `frontend/`) | PASS (0 errors) | Oxlint kiểm tra 43 files sạch sẽ |
| Frontend Build | `npm run build` (trong `frontend/`) | PASS (built in 237ms) | Vite production bundle hoàn tất |
| Full System Test | `npm test` (tại thư mục gốc) | PASS (132/132 tests passed) | Chạy đồng bộ toàn bộ backend tests, frontend tests và frontend lint |

## Files Changed

- `backend/src/controllers/opportunity.controller.js`: Controller cho module Cơ hội và Nhật ký chăm sóc.
- `backend/src/routes/opportunity.routes.js`: Định tuyến RESTful API cho module Cơ hội và Nhật ký chăm sóc.
- `backend/src/app.js`: Mount route `/api/opportunities`.
- `backend/tests/opportunity.test.js`: 17 integration tests tự động cho Opportunity API.
- `feature_list.json`: Cập nhật `feat-012` sang `completed` với evidence tiếng Việt.
- `progress.md`: Cập nhật tiến độ 12/20 tính năng (60%).

## Next Steps

1. Triển khai tính năng tiếp theo: **`feat-013: Frontend Giao diện Quản lý Cơ hội & Timeline Follow-up (Opportunities UI)`**:
   - `frontend/src/api/oppApi.js`: Kết nối các endpoint opportunities, follow-ups, statuses, check-duplicate.
   - `frontend/src/pages/Opportunities/OpportunityListPage.jsx`: Bảng 20 dòng, bộ lọc status, search tên Lead/Sản phẩm, lọc ngày.
   - `frontend/src/pages/Opportunities/OpportunityModal.jsx`: Form tạo/sửa cơ hội (chọn Lead và Sản phẩm, kiểm tra duplicate).
   - `frontend/src/pages/Opportunities/FollowUpModal.jsx`: Form ghi nhận nhật ký chăm sóc (ngày, kênh, nội dung, phản hồi, kế hoạch tiếp).
   - `frontend/src/pages/Opportunities/OpportunityDetailPage.jsx`: Màn hình chi tiết cơ hội, hiển thị Timeline lịch sử chăm sóc trực quan và nút chuyển đổi sang đơn hàng (Make an Order).
   - Gắn định tuyến vào `AppRoutes.jsx`.
   - Viết unit tests tại `frontend/tests/opportunities-ui.test.js`.
2. Tiếp tục thực hiện tính năng `feat-014: Backend Chốt đơn hàng bằng Database Transaction (Make an Order)` với ACID transaction.
