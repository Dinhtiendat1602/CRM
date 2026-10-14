<!-- Chức năng: Nhật ký tiến độ phiên làm việc: theo dõi trạng thái hiện tại, việc đã làm, đang làm, rủi ro và bằng chứng kiểm thử -->

# Session Progress Log - Nhật Ký Tiến Độ Phiên Làm Việc

## Current State (Hiện Trạng Hệ Thống)

**Last Updated:** 2026-10-14 09:48
**Active Feature:** `feat-004` - Backend Quên mật khẩu & Gửi mail SMTP (Nodemailer)
**Current Objective:** Xây dựng `POST /api/auth/forgot-password` kiểm tra email tồn tại, sinh reset token có thời hạn và gửi email chứa link đặt lại mật khẩu qua Nodemailer Gmail SMTP. Xây dựng `POST /api/auth/reset-password` xác thực token và cập nhật mật khẩu mới (SRS 3.14).

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
  - Kiểm thử: 12 integration tests chuyên biệt tại `backend/tests/auth.test.js` (đăng nhập đúng/sai/thiếu trường, đổi mật khẩu, bảo vệ RBAC Admin/Salesman). Toàn bộ 18/18 tests backend pass 100% trong 1.2s.

- [x] **Xác thực kết nối bên ngoài**
  - PostgreSQL Database: Kết nối thành công tới database `CRM` trên `localhost:5432`.
  - Gmail SMTP: Xác thực thành công tài khoản `dinhtiendat1602@gmail.com` qua App Password.

---

### What's In Progress (Việc đang thực hiện)

- [ ] **`feat-004` - Backend Quên mật khẩu & Gửi mail SMTP (Nodemailer)**
  - Xây dựng `POST /api/auth/forgot-password`: kiểm tra email, sinh token ngẫu nhiên + thời hạn hết hạn 15 phút, gửi email chứa reset link qua Nodemailer.
  - Xây dựng `POST /api/auth/reset-password`: kiểm tra token hợp lệ và còn hạn, hash mật khẩu mới, cập nhật CSDL và thu hồi token đã sử dụng.
  - Viết bộ test `backend/tests/forgot-password.test.js`.

---

### What's Next (Các bước tiếp theo)

1. `feat-005`: Backend Quản trị Người dùng & Phân quyền cho Admin (`/api/admin/users`, `/api/admin/roles`, toggle status, gán role).
2. `feat-006`: Frontend Khung giao diện Admin UI, Axios Interceptor & Session Timeout 30m.
3. `feat-007`: Frontend Màn hình Xác thực & Quản lý Người dùng (Users Management UI).

---

## Blockers / Risks (Rào Cản & Rủi Ro)

- **Không có rào cản kỹ thuật**: Hệ thống xác thực và RBAC hoạt động ổn định, CSDL và SMTP Gmail đã sẵn sàng.

---

## Decisions Made (Các Quyết Định Đã Thống Nhất)

- Cho phép người dùng đăng nhập bằng cả `username` hoặc `email` tại endpoint `POST /api/auth/login` để tối ưu trải nghiệm (vẫn đảm bảo đúng chuẩn SRS 3.13).
- Tuyệt đối không trả `password_hash` trong bất kỳ response nào (kể cả GET/PUT profile cá nhân) nhằm tuân thủ quy chuẩn an ninh `docs/SECURITY.md`.
- Token JWT chứa payload tối giản `{ id, username, email, role, full_name }` phục vụ phân quyền RBAC và hiển thị UI tức thì.

---

## Evidence of Completion (Bằng Chứng Kiểm Thử Hiện Tại)

| Lệnh kiểm thử | Kết quả | Chi tiết |
|---|---|---|
| `npm test` (trong `backend/`) | **PASS (18/18 passed, 0 failures)** | `app.test.js` (2) + `auth.test.js` (12) + `db.test.js` (4) chạy trong 1.2s |
| `npm run lint` (trong `frontend/`) | **PASS (0 warnings, 0 errors)** | Oxlint kiểm tra 7 files sạch sẽ |
| `npm run build` (trong `frontend/`) | **PASS** | Vite build thành công bundle production trong 267ms |
| `npm test` (tại thư mục gốc) | **PASS** | Đồng bộ cả test backend và lint frontend |
