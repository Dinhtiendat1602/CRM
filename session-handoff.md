<!-- Chức năng: Biên bản bàn giao phiên: ghi lại việc đang làm dở, blocker và bước tiếp theo khi mở chat mới -->

# Session Handoff

## Current Objective

- Goal: Triển khai tính năng `feat-008` (Backend Quản lý Khách hàng tiềm năng - Leads Module) và chuẩn bị chuyển giao sang `feat-009` (Frontend Leads UI).
- Current status: `feat-008` HOÀN THÀNH (100% Definition of Done đạt chuẩn). 8/20 tính năng hoàn thành.
- Branch / commit: `main`

## Completed This Session

- [x] Đổi cấu hình cổng máy chủ Backend sang cổng `8888` (`http://localhost:8888`) và Frontend sang `http://localhost:8080` để triệt tiêu hoàn toàn xung đột cổng `5000`/`5001`. Đồng bộ CORS và biến môi trường.
- [x] Sửa lỗi phân giải phản hồi `POST /api/auth/login` trên giao diện `Login.jsx` (`res.data?.token || res.token`) và kiểm tra luồng đăng nhập end-to-end thành công với bằng chứng tiếng Việt.
- [x] Xây dựng Bộ điều khiển `backend/src/controllers/lead.controller.js` phục vụ phân hệ Quản lý Khách tiềm năng theo SRS 3.1 - 3.5:
  - `getLeads`: Lấy danh sách Khách tiềm năng có phân trang 20 bản ghi/trang theo BR-03 (SRS 3.2.3 REQ-1), tìm kiếm theo tên Lead (SRS 3.3), lọc theo khoảng ngày nhập `startDate`/`endDate` (BR-05), sắp xếp theo ngày nhập `entered_date` (BR-04).
  - `getLeadById`: Xem chi tiết Khách tiềm năng kèm danh sách Cơ hội (Opportunities) liên quan (SRS 3.2.3 REQ-4).
  - `checkDuplicate`: API kiểm tra phát hiện trùng lặp Email hoặc Số điện thoại trong thời gian thực khi nhân viên nhập liệu trên form.
  - `createLead`: Tạo mới Khách tiềm năng với cơ chế kiểm tra chống trùng SĐT/Email (BR-02, SRS 3.1.2 REQ-4), trả về mã lỗi HTTP 409 Conflict kèm thông báo chi tiết khi phát hiện trùng.
  - `updateLead`: Cập nhật thông tin Khách tiềm năng, có ràng buộc chống đổi sang Email/SĐT đã thuộc về Lead khác (HTTP 409).
  - `deleteLead`: Xóa Khách tiềm năng khỏi hệ thống (SRS 3.5).
- [x] Xây dựng Tuyến đường `backend/src/routes/lead.routes.js` bọc bởi `authMiddleware` và `authorizeRoles('SALESMAN', 'SALE_MANAGER', 'ADMIN')` và mount vào `backend/src/app.js` tại prefix `/api/leads`.
- [x] Xây dựng bộ kiểm thử tích hợp 15 bài test tại `backend/tests/lead.test.js` kiểm tra toàn bộ luồng RBAC, validation, phân trang 20 dòng, chống trùng SĐT/Email, tìm kiếm, lọc theo ngày, xem chi tiết kèm cơ hội, cập nhật và xóa.
- [x] Khôi phục toàn bộ mật khẩu tài khoản mặc định `admin`, `manager`, `salesman` về `11111111` bằng `npm run db:seed`.

## Verification Evidence

| Check | Command | Result | Notes |
|---|---|---|---|
| Backend Test Suite | `npm test` (trong `backend/`) | PASS (52/52 tests passed) | `app.test.js` (2), `auth.test.js` (12), `db.test.js` (4), `forgot-password.test.js` (6), `user.test.js` (13), `lead.test.js` (15) |
| Frontend Test Suite | `npm test` (trong `frontend/`) | PASS (25/25 tests passed) | `admin-ui.test.js` (10 tests) + `login-flow.test.js` (5 tests) + `user-management.test.js` (10 tests) |
| Frontend Lint | `npm run lint` (trong `frontend/`) | PASS (0 errors, 0 warnings) | Oxlint kiểm tra 32 files sạch sẽ |
| Frontend Build | `npm run build` (trong `frontend/`) | PASS (built thành công) | Vite production bundle hoàn tất |
| Full System Test | `npm test` (tại thư mục gốc) | PASS (77/77 tests passed) | Chạy đồng bộ toàn bộ backend tests, frontend tests và frontend lint |

## Files Changed

- `backend/.env`, `frontend/.env`: Cập nhật cổng Backend `8888` và Frontend `8080`.
- `backend/src/server.js`, `backend/src/app.js`: Đồng bộ cổng `8888` và mount `/api/leads`.
- `backend/src/config/db.js`, `backend/src/config/mailer.js`: Cấu hình đường dẫn load `.env` tường minh tránh lỗi khi chạy test từ thư mục gốc.
- `backend/src/controllers/lead.controller.js`: Xử lý CRUD Leads, chống trùng SĐT/Email, phân trang, lọc/sort.
- `backend/src/routes/lead.routes.js`: Định tuyến và phân quyền RBAC cho module Leads.
- `backend/tests/lead.test.js`: 15 bài kiểm thử tích hợp cho module Leads.
- `backend/tests/db.test.js`: Cải thiện tính resilient khi kiểm tra số lượng leads seeded.
- `frontend/src/pages/Auth/Login.jsx`: Sửa bóc tách token & user từ response login.
- `frontend/tests/login-flow.test.js`: Bổ sung kiểm thử luồng đăng nhập end-to-end.
- `feature_list.json`: Cập nhật `feat-008` thành `completed` với bằng chứng tiếng Việt.
- `progress.md`: Cập nhật tiến độ 8/20 tính năng hoàn thành.
- `session-handoff.md`: Cập nhật biên bản chuyển giao.

## Decisions Made

- Backend hoạt động trên cổng `8888`, Frontend hoạt động trên cổng `8080`.
- Cơ chế chống trùng lặp: Trả về HTTP 409 Conflict với thông báo rõ ràng "Số điện thoại này đã tồn tại trên hệ thống" hoặc "Địa chỉ email này đã tồn tại trên hệ thống" tuân thủ BR-02 và SRS 3.1.2 REQ-4.
- Danh sách Leads mặc định sắp xếp giảm dần theo `entered_date` (ngày nhập mới nhất) và giới hạn 20 dòng mỗi trang theo BR-03 và BR-04.

## Blockers / Risks

- Không có rào cản kỹ thuật. Toàn bộ backend leads đã hoạt động trơn tru và toàn vẹn.

## Next Steps

1. Bắt đầu triển khai **`feat-009: Frontend Giao diện Quản lý Khách tiềm năng (Leads UI)`**:
   - Xây dựng `frontend/src/api/leadApi.js` (kết nối đầy đủ các API leads backend vừa hoàn thiện).
   - Xây dựng `LeadListPage.jsx` (`/leads`): Bảng dữ liệu 20 dòng/trang theo BR-03, cột hành động, thanh tìm kiếm theo tên, bộ lọc khoảng ngày nhập, sort ngày nhập.
   - Xây dựng `LeadModal.jsx`: Form thêm mới & chỉnh sửa Lead, tích hợp validation và cảnh báo trùng SĐT/Email tức thời (hoặc khi submit nhận 409).
   - Xây dựng `LeadDetailPage.jsx` (`/leads/:id`): Xem chi tiết khách hàng và tab Cơ hội (Opportunities) liên quan (SRS 3.2.3 REQ-4).
   - Đăng ký route `/leads` và `/leads/:id` trong `AppRoutes.jsx`.
   - Viết unit tests kiểm thử Leads UI và chạy kiểm thử toàn hệ thống.
