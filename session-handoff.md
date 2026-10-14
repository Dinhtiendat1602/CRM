<!-- Chức năng: Biên bản bàn giao phiên: ghi lại việc đang làm dở, blocker và bước tiếp theo khi mở chat mới -->

# Session Handoff

## Current Objective

- Goal: Triển khai tính năng `feat-013` (Frontend Giao diện Quản lý Cơ hội & Timeline Follow-up - Opportunities UI) và chuẩn bị chuyển giao sang `feat-014` (Backend Chốt đơn hàng bằng Database Transaction - Make an Order).
- Current status: `feat-013` HOÀN THÀNH (100% Definition of Done đạt chuẩn). Đạt cột mốc 13/20 tính năng hoàn thành (65% toàn bộ hệ thống Zen CRM).
- Branch / commit: `main`

## Completed This Session

- [x] Xây dựng Service API `frontend/src/api/oppApi.js` kết nối toàn diện các endpoints:
  - `getOpportunities`, `getOpportunityById`, `getStatuses`, `checkDuplicate`, `createOpportunity`, `updateOpportunity`, `deleteOpportunity`, `addFollowUp`, `getFollowUps`.
- [x] Xây dựng `OpportunityModal.jsx`:
  - Biểu mẫu thêm mới & chỉnh sửa Cơ hội (SRS 3.6, 3.9).
  - Tự động nạp dropdown khách hàng và sản phẩm (kèm giá bán, tồn kho).
  - Tự động tính nhẩm giá trị ước tính (`estimated_value = quantity * unit_price`) hiển thị dạng badge tiền tệ VND trực quan.
  - Tích hợp kiểm tra trùng lặp realtime qua `oppApi.checkDuplicate` (BR-02, SRS 3.6.2 REQ-4), bắt lỗi HTTP 409 Conflict hiển thị cảnh báo đỏ và cung cấp checkbox xác nhận tiếp tục.
- [x] Xây dựng `FollowUpModal.jsx`:
  - Form ghi nhận nhật ký chăm sóc theo chuẩn SRS 3.11: ngày liên hệ, kênh tương tác (Điện thoại, Email, Gặp mặt, Zalo), nội dung bắt buộc, phản hồi khách, kế hoạch tiếp theo, đổi trạng thái cơ hội.
- [x] Xây dựng `OpportunityListPage.jsx` (`/opportunities`):
  - Bảng danh sách cơ hội chuẩn 20 dòng theo BR-03 (SRS 3.7.3 REQ-1).
  - Ô tìm kiếm đa năng theo tên Lead hoặc Sản phẩm có debounce 300ms (SRS 3.8).
  - Bộ lọc Trạng thái (6 statuses chuẩn), bộ lọc khoảng ngày tạo (BR-05), sắp xếp ngày tạo/ngày chốt/số lượng kèm nút đảo chiều ASC/DESC (BR-04).
  - Thẻ thống kê tổng số cơ hội và tổng doanh thu dự kiến ước tính trên trang.
  - Nút "+ Thêm Cơ Hội Mới", nút ghi nhanh Follow-up, nút xem chi tiết, sửa và xóa có ConfirmDialog.
  - Tự động mở modal khi có query param `createForLead` hoặc `createForProduct`.
- [x] Xây dựng `OpportunityDetailPage.jsx` (`/opportunities/:id`):
  - Hiển thị chi tiết cơ hội (SRS 3.7.3 REQ-4) gồm 3 thẻ: Thông số cơ hội, Hồ sơ Lead, Chi tiết Sản phẩm.
  - Thẻ thông tin Đơn hàng khi đã chốt (`ORDERED`).
  - **Dòng thời gian chăm sóc trực quan (Follow-up Activity Timeline - SRS 3.11)** hiển thị từng mốc tương tác, người thực hiện, nội dung, phản hồi của khách và kế hoạch tiếp theo.
  - Nút "+ Ghi Nhận Chăm Sóc", nút "Chốt Đơn Hàng (Make an Order)", nút Sửa, Xóa.
- [x] Cập nhật định tuyến `AppRoutes.jsx` thay thế PlaceholderPage bằng `OpportunityListPage` và `OpportunityDetailPage`.
- [x] Viết 10 bài unit tests tại `frontend/tests/opportunities-ui.test.js` kiểm tra validation, parse duplicate error 409, estimated value và timeline sorting.
- [x] Khôi phục toàn bộ mật khẩu tài khoản mặc định `admin`, `manager`, `salesman` về `11111111` bằng `npm run db:seed`.
- [x] Chạy kiểm thử toàn hệ thống đạt 142/142 tests pass (87 backend + 55 frontend), Oxlint 0 errors trên 49 files, build client production thành công trong 228ms.

## Verification Evidence

| Check | Command | Result | Notes |
|---|---|---|---|
| Backend Test Suite | `npm test` (trong `backend/`) | PASS (87/87 tests passed) | `app.test.js` (2), `auth.test.js` (12), `db.test.js` (4), `forgot-password.test.js` (6), `user.test.js` (13), `lead.test.js` (15), `product.test.js` (18), `opportunity.test.js` (17) |
| Frontend Test Suite | `npm test` (trong `frontend/`) | PASS (55/55 tests passed) | `admin-ui.test.js` (10) + `leads-ui.test.js` (10) + `login-flow.test.js` (5) + `products-ui.test.js` (10) + `user-management.test.js` (10) + `opportunities-ui.test.js` (10) |
| Frontend Lint | `npm run lint` (trong `frontend/`) | PASS (0 errors) | Oxlint kiểm tra 49 files sạch sẽ |
| Frontend Build | `npm run build` (trong `frontend/`) | PASS (built in 228ms) | Vite production bundle hoàn tất |
| Full System Test | `npm test` (tại thư mục gốc) | PASS (142/142 tests passed) | Chạy đồng bộ toàn bộ backend tests, frontend tests và frontend lint |

## Files Changed

- `frontend/src/api/oppApi.js`: API Service kết nối module Cơ hội và Follow-up.
- `frontend/src/pages/Opportunities/OpportunityModal.jsx`: Modal thêm/sửa cơ hội kèm kiểm tra trùng lặp và tính nhẩm giá trị.
- `frontend/src/pages/Opportunities/FollowUpModal.jsx`: Modal ghi nhận nhật ký tương tác tư vấn khách hàng.
- `frontend/src/pages/Opportunities/OpportunityListPage.jsx`: Bảng danh sách cơ hội 20 dòng, search, sort, filter ngày.
- `frontend/src/pages/Opportunities/OpportunityDetailPage.jsx`: Chi tiết cơ hội kèm dòng thời gian Follow-up timeline.
- `frontend/src/routes/AppRoutes.jsx`: Gắn định tuyến `/opportunities` và `/opportunities/:id`.
- `frontend/tests/opportunities-ui.test.js`: 10 bài unit tests cho Opportunities UI.
- `feature_list.json`: Cập nhật `feat-013` sang `completed` với evidence tiếng Việt.
- `progress.md`: Cập nhật tiến độ 13/20 tính năng (65%).

## Next Steps

1. Triển khai tính năng tiếp theo: **`feat-014: Backend Chốt đơn hàng bằng Database Transaction (Make an Order)`**:
   - `backend/src/controllers/order.controller.js` hoặc endpoint trong controller: `POST /api/opportunities/:id/make-order` (SRS 3.12).
   - Thiết kế PostgreSQL ACID Transaction (`BEGIN ... COMMIT / ROLLBACK`):
     - Khóa dòng sản phẩm bằng Row-level locking: `SELECT stock_qty, unit_price FROM products WHERE id = $1 FOR UPDATE`.
     - Kiểm tra tồn kho `stock_qty >= quantity`, nếu không đủ trả về HTTP 400 Bad Request kèm thông báo lỗi rõ ràng.
     - Tự động sinh mã đơn hàng duy nhất `order_code` (ví dụ: `ORD-YYYYMMDD-XXXX`).
     - INSERT đơn hàng mới vào bảng `orders` (bảo tồn đơn giá và tổng tiền tại thời điểm chốt).
     - Trừ tồn kho tự động trong bảng `products`: `UPDATE products SET stock_qty = stock_qty - $1 WHERE id = $2`.
     - Cập nhật trạng thái cơ hội trong bảng `opportunities` sang `'ORDERED'`.
     - COMMIT transaction.
   - Viết integration test tại `backend/tests/make-order.test.js`.
2. Chuyển giao sang `feat-015: Frontend Màn hình Chốt đơn & Quản lý Đơn hàng (Make Order & Orders UI)`.
