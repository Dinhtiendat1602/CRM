<!-- Chức năng: Biên bản bàn giao phiên: ghi lại việc đang làm dở, blocker và bước tiếp theo khi mở chat mới -->

# Session Handoff

## Current Objective

- Goal: Triển khai tính năng `feat-009` (Frontend Giao diện Quản lý Khách tiềm năng - Leads UI) và chuẩn bị chuyển giao sang `feat-010` (Backend Quản lý Danh mục & Sản phẩm Kho).
- Current status: `feat-009` HOÀN THÀNH (100% Definition of Done đạt chuẩn). 9/20 tính năng hoàn thành (45% dự án).
- Branch / commit: `main`

## Completed This Session

- [x] Xây dựng Service API `frontend/src/api/leadApi.js` kết nối toàn diện 6 endpoints Backend:
  - `getLeads`: Lấy danh sách Leads có phân trang, tìm kiếm, lọc theo ngày, sort theo ngày nhập.
  - `getLeadById`: Lấy chi tiết Lead kèm danh sách Opportunities liên quan.
  - `checkDuplicate`: Kiểm tra trùng email/phone trong thời gian thực.
  - `createLead`: Tạo Lead mới.
  - `updateLead`: Cập nhật thông tin Lead.
  - `deleteLead`: Xóa Lead.
- [x] Xây dựng `LeadModal.jsx`:
  - Biểu mẫu popup hiện đại, hỗ trợ cả 2 chế độ Tạo mới (Create) và Chỉnh sửa (Edit).
  - Đánh dấu sao đỏ các trường bắt buộc (Họ, Tên, Email, SĐT).
  - Tích hợp kiểm tra trùng lặp thời gian thực `onBlur` (`checkDuplicate`) và bắt lỗi HTTP 409 Conflict từ Backend để hiển thị cảnh báo đỏ nổi bật.
- [x] Xây dựng `LeadListPage.jsx` (`/leads`):
  - Bảng dữ liệu phân trang đúng 20 dòng theo BR-03 (SRS 3.2.3 REQ-1).
  - Ô tìm kiếm theo họ tên khách hàng có debounce 300ms (SRS 3.3).
  - Bộ lọc theo khoảng ngày nhập `startDate` đến `endDate` (BR-05).
  - Nút chuyển đổi chiều sắp xếp ngày nhập `entered_date` ASC/DESC (BR-04).
  - Cột hành động: Xem chi tiết (View), Sửa (Edit), Xóa (Delete) tích hợp hộp thoại `ConfirmDialog`.
- [x] Xây dựng `LeadDetailPage.jsx` (`/leads/:id`):
  - Hiển thị đầy đủ hồ sơ chi tiết khách hàng tiềm năng theo SRS 3.2.3 REQ-4.
  - Các nút hành động: Quay lại danh sách, Sửa thông tin, Xóa Lead, và Tạo cơ hội mới.
  - Bảng danh sách Các Cơ hội liên quan (Associated Opportunities) kèm trạng thái, số lượng và tổng doanh số dự kiến.
- [x] Cập nhật định tuyến `frontend/src/routes/AppRoutes.jsx` gắn `LeadListPage` và `LeadDetailPage` vào router hệ thống.
- [x] Viết 10 bài unit tests tại `frontend/tests/leads-ui.test.js` kiểm tra validation, parse duplicate error 409, query params và tính toán cơ hội liên quan.
- [x] Chạy kiểm thử toàn hệ thống đạt 87/87 tests pass (52 backend + 35 frontend), build client production thành công trong 241ms.

## Verification Evidence

| Check | Command | Result | Notes |
|---|---|---|---|
| Backend Test Suite | `npm test` (trong `backend/`) | PASS (52/52 tests passed) | `app.test.js` (2), `auth.test.js` (12), `db.test.js` (4), `forgot-password.test.js` (6), `user.test.js` (13), `lead.test.js` (15) |
| Frontend Test Suite | `npm test` (trong `frontend/`) | PASS (35/35 tests passed) | `admin-ui.test.js` (10 tests) + `leads-ui.test.js` (10 tests) + `login-flow.test.js` (5 tests) + `user-management.test.js` (10 tests) |
| Frontend Lint | `npm run lint` (trong `frontend/`) | PASS (0 errors) | Oxlint kiểm tra 37 files sạch sẽ |
| Frontend Build | `npm run build` (trong `frontend/`) | PASS (built in 241ms) | Vite production bundle hoàn tất |
| Full System Test | `npm test` (tại thư mục gốc) | PASS (87/87 tests passed) | Chạy đồng bộ toàn bộ backend tests, frontend tests và frontend lint |

## Files Changed

- `frontend/src/api/leadApi.js`: API Service cho module Leads.
- `frontend/src/pages/Leads/LeadModal.jsx`: Modal form thêm/sửa Lead có validation và chống trùng.
- `frontend/src/pages/Leads/LeadListPage.jsx`: Bảng quản lý Leads 20 dòng, search, sort, filter ngày.
- `frontend/src/pages/Leads/LeadDetailPage.jsx`: Chi tiết Lead và danh sách Opportunities.
- `frontend/src/routes/AppRoutes.jsx`: Định tuyến `/leads` và `/leads/:id`.
- `frontend/tests/leads-ui.test.js`: 10 bài unit tests cho Leads UI.
- `feature_list.json`: Cập nhật `feat-009` thành `completed`.
- `progress.md`: Cập nhật tiến độ 9/20 tính năng hoàn thành.
- `session-handoff.md`: Cập nhật biên bản bàn giao.

## Decisions Made

- Phân trang chuẩn BR-03: Mọi bảng dữ liệu hiển thị đúng 20 dòng mỗi trang.
- Chống trùng lặp 2 lớp: Kiểm tra realtime qua `checkDuplicate` khi blur ô input và bắt lỗi HTTP 409 khi submit.
- Cột sắp xếp mặc định theo `entered_date DESC` (ngày nhập mới nhất đưa lên đầu).

## Blockers / Risks

- Không có rào cản kỹ thuật. Phân hệ Leads (Backend + Frontend) đã hoàn thiện 100%.

## Next Steps

1. Bắt đầu triển khai **`feat-010: Backend Quản lý Danh mục & Sản phẩm Kho (Products & Categories Module)`**:
   - Xây dựng Controller `category.controller.js` và Tuyến đường `category.routes.js`: CRUD Danh mục sản phẩm (`product_categories`).
   - Xây dựng Controller `product.controller.js` và Tuyến đường `product.routes.js`: CRUD Sản phẩm (`products`), tìm kiếm theo mã/tên, lọc theo danh mục.
   - Xây dựng 2 APIs đặc thù theo SRS:
     - `GET /api/products/:id/opportunities`: Xem toàn bộ cơ hội quan tâm sản phẩm này (SRS 3.16).
     - `GET /api/products/:id/orders`: Xem toàn bộ đơn hàng đã bán sản phẩm này (SRS 3.17).
   - Phân quyền RBAC: Chỉ `SALE_MANAGER` và `ADMIN` được quyền tạo, sửa, xóa; `SALESMAN` được xem danh sách.
   - Viết bài kiểm thử tự động cho module Products & Categories.
