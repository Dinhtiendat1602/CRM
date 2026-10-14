<!-- Chức năng: Biên bản bàn giao phiên: ghi lại việc đang làm dở, blocker và bước tiếp theo khi mở chat mới -->

# Session Handoff

## Current Objective

- Goal: Triển khai tính năng `feat-003` (Backend Xác thực JWT & Phân quyền RBAC)
- Current status: `feat-003` HOÀN THÀNH (100% Definition of Done đạt chuẩn)
- Branch / commit: `main`

## Completed This Session

- [x] Xây dựng Controller Xác thực & Hồ sơ cá nhân: `backend/src/controllers/auth.controller.js` gồm:
  - `login`: Hỗ trợ đăng nhập linh hoạt bằng username hoặc email, so khớp mật khẩu bcrypt, kiểm tra cờ kích hoạt `is_active`, sinh JWT Access Token thời hạn 24h kèm role payload.
  - `getProfile` (aliased `/me`): Lấy thông tin tài khoản người dùng đang đăng nhập kèm tên vai trò (không lộ mật khẩu).
  - `updateProfile`: Cập nhật họ tên, SĐT và đổi mật khẩu an toàn (kiểm tra mật khẩu cũ, hash mật khẩu mới).
- [x] Hoàn thiện `backend/src/middlewares/auth.middleware.js`: Trích xuất Bearer Token từ header Authorization, giải mã bằng `JWT_SECRET`, gắn `req.user` vào context xử lý của request. Chặn 401 khi token thiếu hoặc không hợp lệ.
- [x] Hoàn thiện `backend/src/middlewares/role.middleware.js`: Hàm `authorizeRoles('ADMIN', 'SALE_MANAGER', 'SALESMAN')` chặn truy cập 403 Forbidden nếu không đủ quyền.
- [x] Định tuyến RESTful API: `backend/src/routes/auth.routes.js` gắn vào `/api/auth` trong `backend/src/app.js`.
- [x] Viết bộ kiểm thử tích hợp 12 kịch bản tại `backend/tests/auth.test.js`: Kiểm tra đăng nhập (đúng/sai/thiếu trường/non-existent), xác thực token, xem/sửa profile, và chặn phân quyền RBAC giữa Admin và Salesman. Toàn bộ 18/18 tests backend pass 100%.

## Verification Evidence

| Check | Command | Result | Notes |
|---|---|---|---|
| Backend Auth & DB Tests | `npm test` (trong `backend/`) | PASS (18/18 tests passed) | `app.test.js` (2), `auth.test.js` (12), `db.test.js` (4) chạy trong 1.2s |
| Frontend Lint | `npm run lint` (trong `frontend/`) | PASS (0 errors, 0 warnings) | Oxlint sạch sẽ không cảnh báo |
| Frontend Build | `npm run build` (trong `frontend/`) | PASS (built in 267ms) | Vite bundle client production thành công |
| Full Suite Test | `npm test` (tại thư mục gốc) | PASS (0 failures) | Toàn bộ kiểm thử hệ thống đạt 100% |

## Files Changed

- `backend/src/controllers/auth.controller.js`: Xử lý login, getProfile, updateProfile.
- `backend/src/routes/auth.routes.js`: Định tuyến /api/auth/*.
- `backend/src/app.js`: Mount `/api/auth` routes.
- `backend/tests/auth.test.js`: 12 integration tests cho phân hệ xác thực và phân quyền RBAC.
- `feature_list.json`: Cập nhật trạng thái `feat-003` thành `completed`.
- `progress.md`: Cập nhật tiến độ `feat-003`.
- `session-handoff.md`: Ghi nhận biên bản bàn giao.

## Decisions Made

- Cho phép đăng nhập bằng cả `username` hoặc `email` để tiện lợi cho người dùng (vẫn tuân thủ chuẩn SRS 3.13).
- Tuyệt đối không trả `password_hash` trong bất kỳ response nào (kể cả GET/PUT profile cá nhân) nhằm tuân thủ quy chuẩn an ninh `docs/SECURITY.md`.
- Trả về mã lỗi HTTP 403 Forbidden chuẩn RESTful khi nhân viên truy cập các endpoint không đúng vai trò phân quyền.

## Blockers / Risks

- Không có blocker. Hệ thống sẵn sàng cho phân hệ Quên mật khẩu & Gửi mail SMTP (Nodemailer).

## Next Session Startup

1. Read `AGENTS.md`.
2. Read `feature_list.json`.
3. Review this handoff.
4. Run verification commands in `backend/` hoặc `frontend/` trước khi sửa mã nguồn.

## Recommended Next Step

- Tiến hành thực hiện tính năng tiếp theo: `feat-004` - "Backend Quên mật khẩu & Gửi mail SMTP (Nodemailer)" (`POST /api/auth/forgot-password`, `POST /api/auth/reset-password`).
