<!-- Chức năng: Nhật ký tiến độ phiên làm việc: theo dõi trạng thái hiện tại, việc đã làm, đang làm, rủi ro và bằng chứng kiểm thử -->

# Session Progress Log - Nhật Ký Tiến Độ Phiên Làm Việc

## Current State (Hiện Trạng Hệ Thống)

**Last Updated:** 2026-10-14 09:30
**Active Feature:** `feat-003` - Backend Xác thực JWT & Phân quyền RBAC
**Current Objective:** Xây dựng hệ thống xác thực đăng nhập trả JWT Access Token, middleware verify token `auth.middleware.js`, middleware phân quyền `role.middleware.js` (ADMIN, SALE_MANAGER, SALESMAN) và API `/api/auth/profile` theo SRS 3.13.

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

- [x] **Xác thực kết nối bên ngoài**
  - PostgreSQL Database: Kết nối thành công tới database `CRM` trên `localhost:5432`.
  - Gmail SMTP: Xác thực thành công tài khoản `dinhtiendat1602@gmail.com` qua App Password.

---

### What's In Progress (Việc đang thực hiện)

- [ ] **`feat-003` - Backend Xác thực JWT & Phân quyền RBAC**
  - Xây dựng `POST /api/auth/login`: kiểm tra tài khoản, so sánh mật khẩu bcrypt, trả về JWT Access Token kèm payload `{ id, email, role }`.
  - Hoàn thiện `auth.middleware.js`: trích xuất Bearer Token từ header `Authorization`, verify qua `JWT_SECRET`.
  - Hoàn thiện `role.middleware.js`: hàm `authorizeRoles('ADMIN', 'SALE_MANAGER', 'SALESMAN')` chặn truy cập 403 nếu không đủ quyền.
  - Xây dựng `GET /api/auth/me` và `PUT /api/auth/profile`: lấy và cập nhật thông tin cá nhân.
  - Viết bộ unit/integration test `backend/tests/auth.test.js`.

---

### What's Next (Các bước tiếp theo)

1. `feat-004`: Backend Quên mật khẩu & Gửi mail SMTP Nodemailer (`POST /api/auth/forgot-password`, `POST /api/auth/reset-password`).
2. `feat-005`: Backend Quản trị Người dùng & Phân quyền cho Admin (`/api/admin/users`, `/api/admin/roles`).
3. `feat-006`: Frontend Khung giao diện Admin UI, Axios Interceptor & Session Timeout 30m.

---

## Blockers / Risks (Rào Cản & Rủi Ro)

- **Không có rào cản kỹ thuật**: Cả database PostgreSQL và dịch vụ gửi mail SMTP đều đã kết nối và kiểm thử thành công 100%.

---

## Decisions Made (Các Quyết Định Đã Thống Nhất)

- **Cổng Backend 5001**: Tránh xung đột với tiến trình `ControlCenter` (AirPlay Receiver) của hệ điều hành macOS trên cổng 5000. Đồng bộ trong `.env` của cả Backend và Frontend.
- **Mật khẩu khởi tạo**: Đặt là `11111111` cho cả 3 tài khoản mẫu (`admin`, `manager`, `salesman`), mã hóa bằng bcrypt 10 salt rounds.
- **Tên Database**: Sử dụng database `CRM` trên PostgreSQL cục bộ.
- **Kiến trúc Clean MVC**: Backend tách bạch rõ ràng Route → Middleware → Controller → Database Helper, không gọi database trực tiếp từ Route.

---

## Evidence of Completion (Bằng Chứng Kiểm Thử Hiện Tại)

| Lệnh kiểm thử | Kết quả | Chi tiết |
|---|---|---|
| `npm test` (trong `backend/`) | **PASS (6/6 passed, 0 failures)** | `app.test.js` (2 tests) + `db.test.js` (4 tests) chạy trong 480ms |
| `npm run lint` (trong `frontend/`) | **PASS (0 warnings, 0 errors)** | Oxlint kiểm tra 7 files sạch sẽ |
| `npm run build` (trong `frontend/`) | **PASS** | Vite build thành công bundle production trong 264ms |
| `npm test` (tại thư mục gốc) | **PASS** | Đồng bộ cả test backend và lint frontend |
| `curl http://localhost:5001/api/health` | **200 OK** | Trả về `{ success: true, message: "Zen CRM API is healthy and running" }` |
