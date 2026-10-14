<!-- Chức năng: Biên bản bàn giao phiên: ghi lại việc đang làm dở, blocker và bước tiếp theo khi mở chat mới -->

# Session Handoff

## Current Objective

- Goal: Triển khai tính năng `feat-002` (Thiết kế CSDL PostgreSQL 10 Bảng & Dữ liệu Seed mẫu)
- Current status: `feat-002` HOÀN THÀNH (100% Definition of Done đạt chuẩn)
- Branch / commit: `main`

## Completed This Session

- [x] Tạo file DDL Schema PostgreSQL chuẩn 3NF: `backend/src/database/schema.sql` gồm 10 bảng (`roles`, `users`, `campaigns`, `product_categories`, `products`, `leads`, `opportunities`, `follow_ups`, `orders`, `sale_forecasts`) kèm các ENUM types (`opp_status`, `order_status`), ràng buộc khóa ngoại và 10 index hiệu năng (`idx_users_role_id`, `idx_products_category_id`, `idx_leads_entered_date`, `idx_leads_phone_email`, `idx_leads_name`, `idx_opportunities_created_at`, `idx_opp_lead_product`, `idx_orders_order_date`, `idx_orders_product_id`, `idx_orders_lead_id`).
- [x] Tạo kịch bản khởi tạo & nạp dữ liệu mẫu tự động: `backend/src/database/init-db.js` (`npm run db:init` / `npm run db:seed`).
- [x] Tạo dữ liệu mẫu chuẩn SRS: 3 Roles (ADMIN, SALE_MANAGER, SALESMAN), 3 Users với mật khẩu khởi tạo `11111111` đã băm bcrypt 10 rounds, 1 Campaign Q4 2026, 2 Danh mục sản phẩm, 2 Sản phẩm mẫu có gán chiến dịch và tồn kho, 2 Leads mẫu, 1 Opportunity (trạng thái CONTACTED), 1 Follow-up log, 12 tháng chỉ tiêu kế hoạch năm tài chính 2026 (SRS 3.20).
- [x] Lưu trữ file `backend/seeds/seed.sql` phục vụ đối soát và khôi phục nhanh.
- [x] Viết bộ kiểm thử tự động `backend/tests/db.test.js` kiểm tra toàn vẹn schema, index và seed records.

## Verification Evidence

| Check | Command | Result | Notes |
|---|---|---|---|
| DB Migration & Seed | `npm run db:init` (trong `backend/`) | PASS (Thành công 100%) | Tạo 10 bảng, enum, index và nạp toàn bộ seed data |
| Backend & DB Tests | `npm test` (trong `backend/`) | PASS (6/6 tests passed) | Kiểm tra 10 bảng, 10 index, 3 roles, 3 users (pass: 11111111), entities, 12 tháng forecast |
| Frontend Lint | `npm run lint` (trong `frontend/`) | PASS (0 errors, 0 warnings) | Oxlint sạch sẽ không cảnh báo |
| Frontend Build | `npm run build` (trong `frontend/`) | PASS (built in 264ms) | Bundle client production thành công |
| Full Suite Test | `npm test` (tại thư mục gốc) | PASS (0 failures) | Chạy đồng bộ cả backend tests và frontend lint |

## Files Changed

- `backend/src/database/schema.sql`: DDL 10 bảng, 2 enums, ràng buộc và performance indexes.
- `backend/src/database/init-db.js`: Kịch bản thực thi tạo bảng, sequence và nạp seed data.
- `backend/seeds/seed.sql`: File SQL lưu trữ dữ liệu seed mẫu.
- `backend/tests/db.test.js`: Bộ kiểm thử tự động 10 bảng, indexes và dữ liệu seed.
- `backend/package.json`: Bổ sung scripts `db:init` và `db:seed`.
- `feature_list.json`: Cập nhật trạng thái `feat-002` thành `completed`.
- `session-handoff.md`: Ghi nhận tiến độ bàn giao.

## Decisions Made

- Thống nhất mật khẩu mặc định của 3 tài khoản khởi tạo (admin, manager, salesman) là `11111111` theo yêu cầu người dùng, được mã hóa an toàn bằng `bcryptjs` với 10 rounds salt.
- Cấu hình hook `test.after` đóng kết nối pool ngay khi kiểm thử kết thúc, giúp bộ test chạy siêu tốc trong ~480ms.

## Blockers / Risks

- Không có blocker. CSDL đã sẵn sàng để tích hợp vào các API ở các tính năng tiếp theo.

## Next Session Startup

1. Read `AGENTS.md`.
2. Read `feature_list.json`.
3. Review this handoff.
4. Run verification commands in `backend/` hoặc `frontend/` trước khi sửa mã nguồn.

## Recommended Next Step

- Tiến hành thực hiện tính năng tiếp theo: `feat-003` - "Backend Xác thực JWT & Phân quyền RBAC" (`POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/profile`, `auth.middleware.js`, `role.middleware.js`).
