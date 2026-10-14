<!-- Chức năng: Nhật ký tiến độ phiên làm việc: theo dõi trạng thái hiện tại, việc đã làm, đang làm, rủi ro và bằng chứng kiểm thử -->

# Session Progress Log - Nhật Ký Tiến Độ Phiên Làm Việc

## Current State (Hiện Trạng Hệ Thống)

**Last Updated:** 2026-10-14 10:25
**Active Feature:** `feat-006` - Frontend Khung giao diện Admin UI, Axios Interceptor & Session Timeout 30m
**Current Status:** HOÀN THÀNH 100% (6/20 tính năng đã nghiệm thu đạt chuẩn DoD)
**Next Feature:** `feat-007` - Frontend Màn hình Xác thực & Quản lý Người dùng (Users Management UI)

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
  - Xây dựng Route Guards:
    - `PrivateRoute.jsx`: Chặn truy cập unauthenticated, chuyển hướng về `/login` lưu vết `location.state`.
    - `RoleRoute.jsx`: Kiểm tra vai trò người dùng, chuyển hướng về `/403` Forbidden nếu không đủ thẩm quyền.
  - Hoàn thiện Quản lý Phiên làm việc & Cảnh báo Timeout (SRS 5.3):
    - `useIdleTimeout.js`: Tự động đăng xuất sau 30 phút bất hoạt.
    - `TimeoutWarning.jsx`: Modal popup cảnh báo đếm ngược 2 phút cuối (phút 28-30) với 2 lựa chọn: "Tiếp tục làm việc" và "Đăng xuất ngay".
  - Định tuyến tổng `AppRoutes.jsx` & `App.jsx`:
    - Đăng ký đầy đủ các route: `/login`, `/forgot-password`, `/reset-password/:token`, `/dashboard`, `/leads`, `/opportunities`, `/orders`, `/products`, `/campaigns`, `/forecast/setup`, `/reports`, `/admin/users`, `/403`, `/profile`, `*` (404).
    - Các màn hình `Login.jsx`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `Dashboard.jsx`, `Forbidden.jsx`, `NotFound.jsx` và `PlaceholderPage.jsx` kết nối đồng bộ 100%.
  - Kiểm thử: Viết 10 unit tests tại `frontend/tests/admin-ui.test.js` kiểm tra RBAC menu, Route guard, format đếm ngược và Axios interceptors. Toàn bộ 10/10 tests frontend pass 100%.

---

### What's In Progress (Việc đang thực hiện)

- Sẵn sàng chuyển giao sang `feat-007` - Frontend Màn hình Xác thực & Quản lý Người dùng (Users Management UI).

---

### What's Next (Các bước tiếp theo)

1. `feat-007`: Frontend Màn hình Xác thực & Quản lý Người dùng (Users Management UI: bảng dữ liệu 20 dòng, bộ lọc vai trò, toggle kích hoạt tài khoản, modal tạo mới/reset mật khẩu).
2. `feat-008`: Backend Quản lý Khách hàng tiềm năng (Leads Module - phân trang 20 dòng, chống trùng SĐT/Email).
3. `feat-009`: Frontend Giao diện Quản lý Khách tiềm năng (Leads UI).

---

## Blockers / Risks (Rào Cản & Rủi Ro)

- **Không có rào cản**: Khung giao diện Admin UI, Layout, Router, Route Guards, Axios Interceptors và Session Timeout đã chạy ổn định và đạt chuẩn 100%.

---

## Decisions Made (Các Quyết Định Đã Thống Nhất)

- Sử dụng cơ chế cảnh báo 2 bước cho Session Timeout (SRS 5.3): Khi người dùng bất hoạt đạt 28 phút, modal cảnh báo đếm ngược từng giây sẽ bật lên. Người dùng có thể nhấn "Tiếp tục làm việc" để reset timer hoặc để hệ thống tự động xóa phiên và đăng xuất sau đúng 30 phút.
- Menu điều hướng được lọc trực tiếp theo vai trò `user.role_name`: `ADMIN` thấy toàn bộ 9 phân hệ; `SALE_MANAGER` thấy 8 phân hệ (loại trừ User Mgmt); `SALESMAN` chỉ thấy 4 phân hệ cốt lõi (Dashboard, Leads, Opps, Orders).

---

## Evidence of Completion (Bằng Chứng Kiểm Thử Hiện Tại)

| Lệnh kiểm thử | Kết quả | Chi tiết |
|---|---|---|
| `npm test` (trong `backend/`) | **PASS (37/37 passed, 0 failures)** | `app.test.js` (2) + `auth.test.js` (12) + `db.test.js` (4) + `forgot-password.test.js` (6) + `user.test.js` (13) |
| `npm test` (trong `frontend/`) | **PASS (10/10 passed, 0 failures)** | `admin-ui.test.js` (10 tests: RBAC menu, Role guards, Timeout format, Axios interceptor) |
| `npm run lint` (trong `frontend/`) | **PASS (0 warnings, 0 errors)** | Oxlint kiểm tra 22 files sạch sẽ |
| `npm run build` (trong `frontend/`) | **PASS (built in 378ms)** | Vite production bundle thành công không có lỗi |
| `npm test` (tại thư mục gốc) | **PASS (47/47 passed toàn hệ thống)** | Kết hợp chạy test backend, test frontend và lint frontend |
