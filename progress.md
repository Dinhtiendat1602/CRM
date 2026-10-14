<!-- Chức năng: Nhật ký tiến độ phiên làm việc: theo dõi trạng thái hiện tại, việc đã làm, đang làm, rủi ro và bằng chứng kiểm thử -->

# Session Progress Log - Nhật Ký Tiến Độ Phiên Làm Việc

## Current State (Hiện Trạng Hệ Thống)

**Last Updated:** 2026-10-14 09:54
**Active Feature:** `feat-005` - Backend Quản trị Người dùng & Phân quyền (Admin Users Management)
**Current Objective:** Xây dựng các RESTful API cho Quản trị viên: `GET /api/admin/users` (kèm role_name), `GET /api/admin/roles` (danh sách vai trò), `POST /api/admin/users` (tạo tài khoản nhân viên và gán role), `PATCH /api/admin/users/:id/status` (Toggle Active/Deactive), `POST /api/admin/users/:id/reset-password` (Admin reset mật khẩu nhân viên trực tiếp) theo SRS 2.1.

---

## Status (Trạng Thái Tính Năng)

### What's Done (Những việc đã hoàn thành)

- [x] **`feat-001` - Khởi tạo môi trường & Cấu trúc khung dự án Full-Stack**
  - Cấu trúc monorepo hoàn chỉnh với orchestration script `npm run dev` (`concurrently`).
  - Backend Clean MVC (Express.js, cổng 5001): `config/` (DB Pool, Nodemailer), `middlewares/` (auth, role, error), `utils/` (validator), `routes/`, `app.js`, `server.js`.
  - Frontend Component-Based (Vite React 18, Tailwind CSS, cổng 5173): `api/axiosClient.js` (tự động gắn Bearer Token & bắt lỗi 401), `AuthContext.jsx`, `useIdleTimeout.js` (tự động đăng xuất sau 30 phút bất hoạt - SRS 5.3).
  - Kiểm thử: `npm test` backend (2/2 passed), `oxlint` frontend (0 lỗi, 0 cảnh báo), `npm run build` thành công trong 368ms.

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
  - Kiểm thử: 6 integration tests tại `backend/tests/forgot-password.test.js` (xác thực email, gửi mail thực tế, kiểm tra token trong CSDL, cập nhật mật khẩu, chặn tái sử dụng token). Toàn bộ 24/24 tests backend pass 100%.

- [x] **Xác thực kết nối bên ngoài**
  - PostgreSQL Database: Kết nối thành công tới database `CRM` trên `localhost:5432`.
  - Gmail SMTP: Gửi email đặt lại mật khẩu thực tế qua tài khoản `dinhtiendat1602@gmail.com`.

---

### What's In Progress (Việc đang thực hiện)

- [ ] **`feat-005` - Backend Quản trị Người dùng & Phân quyền (Admin Users Management)**
  - Xây dựng `GET /api/admin/users`: Lấy danh sách nhân viên kèm tên vai trò (phân trang, lọc theo role, tìm kiếm tên/email).
  - Xây dựng `GET /api/admin/roles`: Lấy danh sách các vai trò để hiển thị dropdown gán vai trò.
  - Xây dựng `POST /api/admin/users`: Admin tạo tài khoản nhân viên mới, gán role ngay khi tạo (mật khẩu mặc định).
  - Xây dựng `PATCH /api/admin/users/:id/status`: Admin Bật / Tắt trạng thái kích hoạt tài khoản (`is_active`).
  - Xây dựng `PATCH /api/admin/users/:id/role`: Admin cập nhật thay đổi vai trò nhân viên.
  - Xây dựng `POST /api/admin/users/:id/reset-password`: Admin đặt lại mật khẩu trực tiếp cho nhân viên.
  - Bảo vệ toàn bộ endpoint bằng `auth.middleware.js` + `authorizeRoles('ADMIN')`.
  - Viết bộ kiểm thử tích hợp `backend/tests/user.test.js`.

---

### What's Next (Các bước tiếp theo)

1. `feat-006`: Frontend Khung giao diện Admin UI, Axios Interceptor & Session Timeout 30m.
2. `feat-007`: Frontend Màn hình Xác thực & Quản lý Người dùng (Users Management UI).
3. `feat-008`: Backend Quản lý Khách hàng tiềm năng (Leads Module - phân trang 20 dòng, chống trùng SĐT/Email).

---

## Blockers / Risks (Rào Cản & Rủi Ro)

- **Không có rào cản kỹ thuật**: Các phân hệ nền tảng Backend hoạt động trơn tru và có độ bao phủ kiểm thử cao.

---

## Decisions Made (Các Quyết Định Đã Thống Nhất)

- Mã đặt lại mật khẩu có thời hạn chính xác 15 phút (theo đặc tả SRS 3.14) và tự động vô hiệu hóa ngay sau lần sử dụng đầu tiên để ngăn chặn tấn công replay.
- Cấu hình template HTML email gửi qua Nodemailer hiển thị nhận diện thương hiệu Zen CRM trực quan, có nút bấm đặt lại mật khẩu và cảnh báo bảo mật.

---

## Evidence of Completion (Bằng Chứng Kiểm Thử Hiện Tại)

| Lệnh kiểm thử | Kết quả | Chi tiết |
|---|---|---|
| `npm test` (trong `backend/`) | **PASS (24/24 passed, 0 failures)** | `app.test.js` (2) + `auth.test.js` (12) + `db.test.js` (4) + `forgot-password.test.js` (6) |
| `npm run lint` (trong `frontend/`) | **PASS (0 warnings, 0 errors)** | Oxlint kiểm tra 7 files sạch sẽ |
| `npm run build` (trong `frontend/`) | **PASS** | Vite build bundle production thành công trong 306ms |
| `npm test` (tại thư mục gốc) | **PASS** | Đồng bộ cả test backend và lint frontend |
