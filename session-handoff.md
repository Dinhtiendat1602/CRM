<!-- Chức năng: Biên bản bàn giao phiên: ghi lại việc đang làm dở, blocker và bước tiếp theo khi mở chat mới -->

# Session Handoff

## Current Objective

- Goal: Triển khai tính năng `feat-006` (Frontend Khung giao diện Admin UI, Axios Interceptor & Session Timeout 30m)
- Current status: `feat-006` HOÀN THÀNH (100% Definition of Done đạt chuẩn)
- Branch / commit: `main`

## Completed This Session

- [x] Xây dựng Route Guards:
  - `frontend/src/routes/PrivateRoute.jsx`: Chặn truy cập unauthenticated, chuyển hướng về `/login` lưu vết `location.state`.
  - `frontend/src/routes/RoleRoute.jsx`: Kiểm tra vai trò của người dùng theo danh sách `allowedRoles` (RBAC), chuyển hướng về `/403` nếu không đủ thẩm quyền.
- [x] Xây dựng Layout Components:
  - `frontend/src/components/Layout/Sidebar.jsx`: Menu điều hướng động lọc theo quyền hạn (ADMIN: 9 mục, SALE_MANAGER: 8 mục, SALESMAN: 4 mục), hỗ trợ thu gọn/mở rộng, overlay trên mobile và highlight active link.
  - `frontend/src/components/Layout/Header.jsx`: Breadcrumbs tự động, User Profile dropdown với avatar, role badge phân màu (`ADMIN`, `SALE_MANAGER`, `SALESMAN`), link hồ sơ cá nhân và nút đăng xuất.
  - `frontend/src/components/Layout/MainLayout.jsx`: Ghép nối Sidebar, Header, vùng nội dung `<Outlet />` và Footer.
- [x] Hoàn thiện Session Timeout 30 phút & Cảnh báo đếm ngược 2 phút (SRS 5.3):
  - `frontend/src/hooks/useIdleTimeout.js`: Quản lý bộ đếm giờ bất hoạt, kích hoạt cảnh báo ở phút 28 và tự động logout ở phút 30.
  - `frontend/src/components/TimeoutWarning.jsx`: Modal cảnh báo đếm ngược từng giây với 2 nút: "Tiếp tục làm việc" (reset timer) và "Đăng xuất ngay".
  - `frontend/src/context/AuthContext.jsx`: Tích hợp `TimeoutWarning` vào provider cấp cao.
- [x] Xây dựng các trang nghiệp vụ & bổ trợ:
  - `frontend/src/pages/Auth/Login.jsx`: Form đăng nhập kết nối API `POST /api/auth/login`, hỗ trợ nút chọn nhanh tài khoản test (`admin`, `manager`, `salesman` pass `11111111`).
  - `frontend/src/pages/Auth/ForgotPassword.jsx` & `ResetPassword.jsx`: Kết nối API khôi phục mật khẩu.
  - `frontend/src/pages/Dashboard/Dashboard.jsx`: Màn hình tổng quan với thẻ KPI và trạng thái kết nối backend.
  - `frontend/src/pages/Forbidden.jsx` (`/403`) & `NotFound.jsx` (`*`).
  - `frontend/src/pages/Common/PlaceholderPage.jsx`: Khung hiển thị thông tin các phân hệ đang chờ ghép nối dữ liệu chi tiết.
- [x] Định tuyến tổng `frontend/src/routes/AppRoutes.jsx` & kết nối trong `frontend/src/App.jsx`.
- [x] Viết bộ kiểm thử `frontend/tests/admin-ui.test.js` gồm 10 tests kiểm tra RBAC Sidebar menu, RoleRoute guards, Session timeout format và Axios interceptor.
- [x] Cập nhật root `package.json` kiểm thử đồng bộ toàn bộ backend tests, frontend tests và frontend lint.

## Verification Evidence

| Check | Command | Result | Notes |
|---|---|---|---|
| Backend Test Suite | `npm test` (trong `backend/`) | PASS (37/37 tests passed) | `app.test.js` (2), `auth.test.js` (12), `db.test.js` (4), `forgot-password.test.js` (6), `user.test.js` (13) |
| Frontend Test Suite | `npm test` (trong `frontend/`) | PASS (10/10 tests passed) | `admin-ui.test.js` (10 unit tests cho Admin UI & RBAC) |
| Frontend Lint | `npm run lint` (trong `frontend/`) | PASS (0 errors, 0 warnings) | Oxlint kiểm tra 22 files sạch sẽ |
| Frontend Build | `npm run build` (trong `frontend/`) | PASS (built in 378ms) | Bundle client production thành công |
| Full System Test | `npm test` (tại thư mục gốc) | PASS (47/47 tests passed) | Chạy toàn bộ backend tests + frontend tests + frontend lint |

## Files Changed

- `frontend/src/hooks/useIdleTimeout.js`: Quản lý 30 phút bất hoạt & kích hoạt cảnh báo 2 phút cuối.
- `frontend/src/components/TimeoutWarning.jsx`: Modal cảnh báo đếm ngược 2 phút trước khi tự động đăng xuất.
- `frontend/src/context/AuthContext.jsx`: Bọc Modal TimeoutWarning và cung cấp các helper authentication.
- `frontend/src/routes/PrivateRoute.jsx`: Guard chặn người dùng chưa đăng nhập.
- `frontend/src/routes/RoleRoute.jsx`: Guard kiểm tra vai trò RBAC.
- `frontend/src/components/Layout/Sidebar.jsx`: Thanh điều hướng động theo 3 vai trò.
- `frontend/src/components/Layout/Header.jsx`: Header hiển thị breadcrumb, user badge và logout.
- `frontend/src/components/Layout/MainLayout.jsx`: Bố cục giao diện chính kết hợp Sidebar và Header.
- `frontend/src/pages/Auth/Login.jsx`: Màn hình đăng nhập kết nối API.
- `frontend/src/pages/Auth/ForgotPassword.jsx` & `ResetPassword.jsx`: Màn hình khôi phục mật khẩu.
- `frontend/src/pages/Dashboard/Dashboard.jsx`: Màn hình Dashboard tổng quan.
- `frontend/src/pages/Forbidden.jsx`: Màn hình 403 Forbidden.
- `frontend/src/pages/NotFound.jsx`: Màn hình 404 Not Found.
- `frontend/src/pages/Common/PlaceholderPage.jsx`: Khung hiển thị các phân hệ.
- `frontend/src/routes/AppRoutes.jsx`: Cấu hình danh sách toàn bộ các routes.
- `frontend/src/App.jsx`: Bọc BrowserRouter, AuthProvider và AppRoutes.
- `frontend/tests/admin-ui.test.js`: 10 unit tests cho Admin UI và RBAC.
- `frontend/package.json`: Thêm script `"test": "node --test tests/**/*.test.js"`.
- `package.json`: Đồng bộ `npm test` chạy cả backend, frontend test và frontend lint.
- `feature_list.json`: Cập nhật `feat-006` thành `completed`.
- `progress.md`: Cập nhật nhật ký tiến độ phiên.

## Decisions Made

- Sidebar điều hướng động tự động lọc menu theo vai trò người dùng (`ADMIN`: 9 mục, `SALE_MANAGER`: 8 mục, `SALESMAN`: 4 mục), ngăn chặn người dùng thấy các phân hệ không có quyền.
- Cơ chế Session Timeout 30 phút tuân thủ nghiêm ngặt SRS 5.3: Cảnh báo đếm ngược dạng modal bật lên trong 2 phút cuối (phút 28-30). Người dùng có thể nhấn "Tiếp tục làm việc" để reset timer hoặc hệ thống tự động xóa token và chuyển hướng về `/login` sau đúng 30 phút.

## Blockers / Risks

- Không có blocker. Hệ thống Frontend UI framework đã hoàn thiện đồng bộ với Backend API.

## Next Session Startup

1. Read `AGENTS.md`.
2. Read `feature_list.json`.
3. Review this handoff.
4. Run `npm test` tại thư mục gốc để xác nhận trạng thái xanh sạch.

## Recommended Next Step

- Tiến hành thực hiện tính năng tiếp theo: `feat-007` - "Frontend Màn hình Xác thực & Quản lý Người dùng (Users Management UI)" (Hoàn thiện `AdminUserPage`: bảng dữ liệu 20 dòng, bộ lọc vai trò, toggle trạng thái Active/Inactive, modal tạo mới nhân viên và modal đặt lại mật khẩu trực tiếp) (SRS 2.1, 3.13, 3.14).
