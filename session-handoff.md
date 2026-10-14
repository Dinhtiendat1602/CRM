<!-- Chức năng: Biên bản bàn giao phiên: ghi lại việc đang làm dở, blocker và bước tiếp theo khi mở chat mới -->

# Session Handoff

## Current Objective

- Goal: Triển khai tính năng `feat-004` (Backend Quên mật khẩu & Gửi mail SMTP Nodemailer)
- Current status: `feat-004` HOÀN THÀNH (100% Definition of Done đạt chuẩn)
- Branch / commit: `main`

## Completed This Session

- [x] Nâng cấp cấu hình gửi mail `backend/src/config/mailer.js`: Thiết kế template HTML thư điện tử đặt lại mật khẩu với giao diện Zen CRM đồng bộ, nút bấm hành động và cảnh báo bảo mật thời hạn 15 phút.
- [x] Xây dựng các chức năng tại `backend/src/controllers/auth.controller.js`:
  - `forgotPassword` (`POST /api/auth/forgot-password`): Kiểm tra email hợp lệ, sinh mã token 64 ký tự hex ngẫu nhiên bảo mật cao, thiết lập hạn sử dụng 15 phút, lưu vào CSDL PostgreSQL và gửi email qua Gmail SMTP (`dinhtiendat1602@gmail.com`).
  - `verifyResetToken` (`GET /api/auth/verify-reset-token/:token`): Kiểm tra token hợp lệ và còn thời hạn trước khi người dùng truy cập form đặt lại mật khẩu.
  - `resetPassword` (`POST /api/auth/reset-password`): Xác thực token hợp lệ, băm mật khẩu mới (bcrypt 10 rounds), cập nhật CSDL, xóa token (single-use) và cho phép đăng nhập ngay với mật khẩu mới.
- [x] Cập nhật định tuyến `backend/src/routes/auth.routes.js`.
- [x] Viết bộ kiểm thử tích hợp chuyên biệt 6 kịch bản tại `backend/tests/forgot-password.test.js`: Kiểm tra gửi mail, xác thực token trong CSDL, đặt lại mật khẩu, đăng nhập mật khẩu mới và chặn tái sử dụng token. Toàn bộ 24/24 tests backend pass 100%.

## Verification Evidence

| Check | Command | Result | Notes |
|---|---|---|---|
| Backend Test Suite | `npm test` (trong `backend/`) | PASS (24/24 tests passed) | `app.test.js` (2), `auth.test.js` (12), `db.test.js` (4), `forgot-password.test.js` (6) |
| Frontend Lint | `npm run lint` (trong `frontend/`) | PASS (0 errors, 0 warnings) | Oxlint kiểm tra 7 files sạch sẽ |
| Frontend Build | `npm run build` (trong `frontend/`) | PASS (built in 306ms) | Bundle client production thành công |
| Full Suite Test | `npm test` (tại thư mục gốc) | PASS (0 failures) | Toàn bộ kiểm thử hệ thống đạt 100% |

## Files Changed

- `backend/src/config/mailer.js`: Nâng cấp template email HTML.
- `backend/src/controllers/auth.controller.js`: Thêm `forgotPassword`, `verifyResetToken`, `resetPassword`.
- `backend/src/routes/auth.routes.js`: Định tuyến thêm các endpoint khôi phục mật khẩu.
- `backend/tests/forgot-password.test.js`: 6 integration tests cho luồng quên mật khẩu và đổi mật khẩu.
- `feature_list.json`: Cập nhật trạng thái `feat-004` thành `completed`.
- `progress.md`: Cập nhật tiến độ `feat-004`.
- `session-handoff.md`: Ghi nhận biên bản bàn giao.

## Decisions Made

- Token đặt lại mật khẩu có thời hạn 15 phút theo đặc tả SRS 3.14 và bị vô hiệu hóa ngay sau khi sử dụng thành công (single-use token) nhằm ngăn chặn tấn công replay.
- Kiểm tra tính hợp lệ của token cả ở bước truy cập liên kết (`/verify-reset-token/:token`) và bước submit mật khẩu mới (`/reset-password`).

## Blockers / Risks

- Không có blocker. Dịch vụ Gmail SMTP và CSDL hoạt động ổn định.

## Next Session Startup

1. Read `AGENTS.md`.
2. Read `feature_list.json`.
3. Review this handoff.
4. Run verification commands in `backend/` hoặc `frontend/` trước khi sửa mã nguồn.

## Recommended Next Step

- Tiến hành thực hiện tính năng tiếp theo: `feat-005` - "Backend Quản trị Người dùng & Phân quyền (Admin Users Management)" (`GET /api/admin/users`, `GET /api/admin/roles`, `POST /api/admin/users`, `PATCH /api/admin/users/:id/status`, `POST /api/admin/users/:id/reset-password` theo SRS 2.1).
