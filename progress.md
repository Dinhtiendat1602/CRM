<!-- Chức năng: Nhật ký tiến độ phiên làm việc: theo dõi trạng thái hiện tại, việc đã làm, đang làm, rủi ro và bằng chứng kiểm thử -->

# Session Progress Log - Nhật Ký Tiến Độ Phiên Làm Việc

## Current State (Hiện Trạng Hệ Thống)

**Last Updated:** 2026-10-14 12:55
**Active Feature:** `feat-008` - Backend Quản lý Khách hàng tiềm năng (Leads Module)
**Current Status:** HOÀN THÀNH 100% (8/20 tính năng đã nghiệm thu đạt chuẩn DoD)
**Next Feature:** `feat-009` - Frontend Giao diện Quản lý Khách tiềm năng (Leads UI)

---

## Status (Trạng Thái Tính Năng)

### What's Done (Những việc đã hoàn thành)

- [x] **`feat-008` - Backend Quản lý Khách hàng tiềm năng (Leads Module)**
  - Xây dựng trọn bộ RESTful API CRUD Khách hàng tiềm năng (`lead.controller.js` và `lead.routes.js`) tuân thủ nghiêm ngặt SRS 3.1 - 3.5:
    - `GET /api/leads`: Lấy danh sách Leads có phân trang mặc định 20 bản ghi/trang (BR-03, SRS 3.2.3 REQ-1), lọc theo khoảng ngày nhập `startDate` / `endDate` (BR-05, SRS 3.2.3 REQ-2), sắp xếp tăng/giảm theo `entered_date` (BR-04, SRS 3.2.3 REQ-3), tìm kiếm theo tên khách hàng (SRS 3.3).
    - `GET /api/leads/:id`: Xem chi tiết Lead kèm theo danh sách Cơ hội (Opportunities) liên quan (SRS 3.2.3 REQ-4).
    - `GET /api/leads/check-duplicate`: API kiểm tra phát hiện trùng lặp Email hoặc Số điện thoại trong thời gian thực khi người dùng nhập liệu trên form.
    - `POST /api/leads`: Tạo mới Khách tiềm năng với cơ chế kiểm tra chống trùng SĐT/Email (BR-02, SRS 3.1.2 REQ-4), trả về mã lỗi HTTP 409 Conflict rõ ràng khi phát hiện trùng.
    - `PUT /api/leads/:id`: Cập nhật thông tin Khách tiềm năng, có ràng buộc chống đổi sang Email/SĐT đã thuộc về Lead khác (HTTP 409).
    - `DELETE /api/leads/:id`: Xóa Khách tiềm năng (SRS 3.5).
  - Tích hợp middleware phân quyền RBAC: Bảo vệ toàn bộ router với `authMiddleware` và `authorizeRoles('SALESMAN', 'SALE_MANAGER', 'ADMIN')`.
  - Bộ kiểm thử: 15 integration tests tự động tại `backend/tests/lead.test.js` (toàn bộ 52/52 tests backend pass 100%).

- [x] **`feat-001` - Khởi tạo môi trường & Cấu trúc khung dự án Full-Stack**
  - Cấu trúc monorepo hoàn chỉnh với orchestration script `npm run dev` (`concurrently`).
  - Backend Clean MVC (Express.js, cổng 5001): `config/` (DB Pool, Nodemailer), `middlewares/` (auth, role, error), `utils/` (validator), `routes/`, `app.js`, `server.js`.
  - Frontend Component-Based (Vite React 18, Tailwind CSS, cổng 8080): `api/axiosClient.js` (tự động gắn Bearer Token & bắt lỗi 401), `AuthContext.jsx`, `useIdleTimeout.js` (tự động đăng xuất sau 30 phút bất hoạt - SRS 5.3).
  - Kiểm thử: `npm test` backend (2/2 passed), `oxlint` frontend (0 lỗi, 0 cảnh báo), `npm run build` thành công.

- [x] **`feat-002` - Thiết kế CSDL PostgreSQL 10 Bảng & Dữ liệu Seed mẫu**
  - Cấu trúc DDL Schema chuẩn 3NF: `backend/src/database/schema.sql` gồm 10 bảng (`roles`, `users`, `campaigns`, `product_categories`, `products`, `leads`, `opportunities`, `follow_ups`, `orders`, `sale_forecasts`) kèm ENUM types (`opp_status`, `order_status`) và 10 performance indexes.
  - Kịch bản tự động `npm run db:init` / `npm run db:seed`: nạp thành công 3 Roles, 3 Users (mật khẩu khởi tạo `11111111` đã băm bcrypt), 1 Campaign Q4 2026, 2 Danh mục & 2 Sản phẩm mẫu, 2 Leads, 1 Opportunity, 1 Follow-up, 12 tháng Kế hoạch Doanh số 2026 (SRS 3.20).
  - Kiểm thử: Bộ test tự động `backend/tests/db.test.js` kiểm tra toàn vẹn 10 bảng, 10 index, 3 roles, 3 users và business entities (6/6 passed trong 480ms).

- [x] **`feat-003` - Backend Xác thực JWT & Phân quyền RBAC**
  - Xây dựng `POST /api/auth/login`: xác thực đăng nhập bằng username hoặc email, kiểm tra trạng thái kích hoạt `is_active`, so khớp mật khẩu bcrypt, sinh JWT token thời hạn 24h kèm role payload.
  - Hoàn thiện `auth.middleware.js`: xác thực Bearer token từ header `Authorization`, chặn 401 nếu token thiếu/hỏng/hết hạn.
  - Hoàn thiện `role.middleware.js`: hàm `authorizeRoles('ADMIN', 'SALE_MANAGER', 'SALESMAN')` chặn truy cập 403 Forbidden nếu không đủ quyền.
  - Xây dựng `GET /api/auth/me` và `PUT /api/auth/profile`: lấy và cập nhật thông tin cá nhân (họ tên, SĐT, đổi mật khẩu).
  - Kiểm thử: 12 integration tests tại `backend/tests/auth.test.js` (18/18 tests backend pass trong 1.2s).

- [x] **`feat-004` - Backend Quên mật khẩu & Gửi mail SMTP (Nodemailer)**
  - Xây dựng `POST /api/auth/forgot-password`: kiểm tra email hợp lệ và tồn tại trong hệ thống, sinh mã token ngẫu nhiên bảo mật 64 hex characters (thời hạn 15 phút), lưu vào CSDL và gửi email chứa liên kết đặt lại mật khẩu bằng Nodemailer qua Gmail SMTP.
  - Xây dựng `GET /api/auth/verify-reset-token/:token`: kiểm tra trước tính hợp lệ và thời hạn còn lại của token trước khi người dùng đổi mật khẩu.
  - Xây dựng `POST /api/auth/reset-password`: xác thực token chưa hết hạn, băm mật khẩu mới bằng bcrypt 10 rounds, cập nhật CSDL, xóa token (single-use) và cho phép đăng nhập ngay với mật khẩu mới.
  - Kiểm thử: 6 integration tests tại `backend/tests/forgot-password.test.js` (24/24 tests backend pass 100%).

- [x] **`feat-005` - Backend Quản trị Người dùng & Phân quyền (Admin Users Management)**
  - Xây dựng trọn bộ RESTful API bảo vệ bởi `auth.middleware.js` & `authorizeRoles('ADMIN')`:
    - `GET /api/admin/roles`: Lấy danh sách 3 vai trò phục vụ dropdown tạo/sửa.
    - `GET /api/admin/users`: Lấy danh sách nhân viên phân trang (mặc định 20 dòng), tìm kiếm đa năng theo từ khóa (username, họ tên, email), lọc theo vai trò và trạng thái kích hoạt.
    - `POST /api/admin/users`: Quản trị viên tạo tài khoản nhân viên mới, gán role ngay khi tạo, hỗ trợ mật khẩu mặc định `11111111`, kiểm tra trùng username/email.
    - `PATCH /api/admin/users/:id/status`: Kích hoạt / Khóa tài khoản nhân viên (chặn Admin tự vô hiệu hóa tài khoản của chính mình).
    - `PATCH /api/admin/users/:id/role`: Gán / Đổi vai trò nhân viên và cập nhật quyền hạn ngay lập tức.
    - `POST /api/admin/users/:id/reset-password`: Quản trị viên đặt lại mật khẩu nhân viên trực tiếp khi gặp sự cố.
  - Kiểm thử: 13 integration tests tại `backend/tests/user.test.js` (toàn bộ 37/37 tests backend pass 100% trong 4.8s).

- [x] **`feat-006` - Frontend Khung giao diện Admin UI, Axios Interceptor & Session Timeout 30m**
  - Xây dựng `MainLayout`:
    - `Sidebar.jsx`: Điều hướng động theo RBAC (ADMIN: 9 mục, SALE_MANAGER: 8 mục, SALESMAN: 4 mục), hỗ trợ thu gọn/mở rộng, overlay mobile, icon Lucide và indicator active link.
    - `Header.jsx`: Breadcrumbs tự động theo route, User Profile Menu với Avatar, Role Badge (`ADMIN`, `SALE_MANAGER`, `SALESMAN`), Quick Link Hồ sơ cá nhân và nút Đăng xuất.
  - Xây dựng Route Guards: `PrivateRoute.jsx` và `RoleRoute.jsx`.
  - Quản lý Phiên làm việc & Cảnh báo Timeout (SRS 5.3): `useIdleTimeout.js` và `TimeoutWarning.jsx` (popup đếm ngược 2 phút cuối).
  - Cập nhật địa chỉ Frontend dev server sang `http://localhost:8080`.
  - Kiểm thử: 10 unit tests tại `frontend/tests/admin-ui.test.js` pass 100%.

- [x] **`feat-007` - Frontend Màn hình Xác thực & Quản lý Người dùng (Users Management UI)**
  - Xây dựng `UserManagement.jsx` (`/admin/users`) theo SRS 2.1:
    - Bảng danh sách nhân viên: hiển thị avatar, họ tên, username, email, SĐT, role badge, trạng thái và ngày tạo.
    - Phân trang 20 dòng chuẩn BR-03 (`Pagination.jsx`).
    - Ô tìm kiếm debounced 300ms (`SearchInput.jsx`).
    - Bộ lọc dropdown theo vai trò (Roles) và trạng thái kích hoạt (Active / De-active).
    - Toggle kích hoạt/khóa tài khoản nhân viên kèm `ConfirmDialog` xác nhận (chặn Admin tự khóa tài khoản của chính mình).
    - Dropdown đổi vai trò nhân viên trực tiếp trên bảng.
    - `CreateUserModal`: Form tạo tài khoản nhân viên mới (validate bắt buộc, thông báo mật khẩu mặc định `11111111`).
    - `ResetPasswordModal`: Form đặt lại mật khẩu trực tiếp cho nhân viên khi gặp sự cố đăng nhập.
  - Xây dựng `ProfilePage.jsx` (`/profile`) theo SRS 3.13:
    - Xem thông tin cá nhân và vai trò đang đăng nhập.
    - Cập nhật họ tên và số điện thoại, đồng bộ ngay với Header qua `AuthContext`.
    - Form đổi mật khẩu tài khoản cá nhân: kiểm tra mật khẩu cũ, mật khẩu mới (tối thiểu 8 ký tự) và khớp mật khẩu xác nhận.
  - Xây dựng các Reusable Components: `Pagination.jsx`, `SearchInput.jsx`, `Modal.jsx`, `ConfirmDialog.jsx`.
  - Xây dựng các API Service: `authApi.js` và `adminApi.js`.
  - Kiểm thử: Viết 10 unit tests tại `frontend/tests/user-management.test.js` kiểm tra pagination range, self-deactivation guard, form validation. Toàn bộ 20/20 frontend tests và 57/57 system tests pass 100%.

---

### What's In Progress (Việc đang thực hiện)

- Đang chuẩn bị triển khai `feat-009` - Frontend Giao diện Quản lý Khách tiềm năng (Leads UI: `LeadListPage`, `LeadModal`, `LeadDetailPage`).

---

### What's Next (Các bước tiếp theo)

1. `feat-009`: Frontend Giao diện Quản lý Khách tiềm năng (Leads UI: bảng 20 dòng, modal thêm/sửa có validation trùng SĐT/Email, màn hình chi tiết kèm danh sách cơ hội).
2. `feat-010`: Backend Quản lý Danh mục & Sản phẩm Kho (Products & Categories Module).
3. `feat-011`: Frontend Giao diện Sản phẩm & Kho hàng (Products UI).

---

## Blockers / Risks (Rào Cản & Rủi Ro)

- **Không có rào cản**: Backend Leads Module đã hoàn thiện trọn vẹn, vượt qua toàn bộ 15 integration tests độc lập và 52 tests backend toàn hệ thống.

---

## Decisions Made (Các Quyết Định Đã Thống Nhất)

- Backend chuyển sang cổng 8888, Frontend chạy cổng 8080 để tránh xung đột cổng.
- Toàn bộ các bảng danh sách tuân thủ nguyên tắc BR-03: hiển thị đúng 20 bản ghi mỗi trang kèm thanh phân trang chuẩn.
- Endpoint chống trùng realtime `GET /api/leads/check-duplicate` hỗ trợ kiểm tra tức thời khi gõ SĐT/Email trên form.
- Nút toggle trạng thái tài khoản bắt buộc hiển thị hộp thoại xác nhận `ConfirmDialog` và chặn tuyệt đối hành vi Admin tự vô hiệu hóa tài khoản của chính mình.

---

## Evidence of Completion (Bằng Chứng Kiểm Thử Hiện Tại)

| Lệnh kiểm thử | Kết quả | Chi tiết |
|---|---|---|
| `npm test` (trong `backend/`) | **PASS (52/52 passed, 0 failures)** | `app.test.js` (2) + `auth.test.js` (12) + `db.test.js` (4) + `forgot-password.test.js` (6) + `user.test.js` (13) + `lead.test.js` (15) |
| `npm test` (trong `frontend/`) | **PASS (25/25 passed, 0 failures)** | `admin-ui.test.js` (10 tests) + `login-flow.test.js` (5 tests) + `user-management.test.js` (10 tests) |
| `npm run lint` (trong `frontend/`) | **PASS (0 warnings, 0 errors)** | Oxlint kiểm tra 32 files sạch sẽ |
| `npm run build` (trong `frontend/`) | **PASS (built thành công)** | Vite production bundle hoàn tất |
| `npm test` (tại thư mục gốc) | **PASS (77/77 tests passed toàn hệ thống)** | Chạy test backend (52) + test frontend (25) + lint frontend |
