<!-- Chức năng: Biên bản bàn giao phiên: ghi lại việc đang làm dở, blocker và bước tiếp theo khi mở chat mới -->

# Session Handoff

## Current Objective

- Goal: Triển khai tính năng `feat-010` (Backend Quản lý Danh mục & Sản phẩm Kho - Products & Categories Module) và chuẩn bị chuyển giao sang `feat-011` (Frontend Products UI).
- Current status: `feat-010` HOÀN THÀNH (100% Definition of Done đạt chuẩn). Đạt cột mốc 10/20 tính năng hoàn thành (50% toàn bộ hệ thống Zen CRM).
- Branch / commit: `main`

## Completed This Session

- [x] Xây dựng Bộ điều khiển `backend/src/controllers/category.controller.js` quản lý Danh mục sản phẩm:
  - `getCategories`: Lấy danh sách danh mục có đếm số lượng sản phẩm liên kết (`products_count`).
  - `getCategoryById`: Lấy chi tiết 1 danh mục.
  - `createCategory`: Tạo danh mục mới, chống trùng tên danh mục (HTTP 409).
  - `updateCategory`: Cập nhật tên và mô tả danh mục.
  - `deleteCategory`: Xóa danh mục (bảo vệ toàn vẹn: chặn xóa nếu danh mục đang chứa sản phẩm - HTTP 400).
- [x] Xây dựng Bộ điều khiển `backend/src/controllers/product.controller.js` quản lý Sản phẩm kho theo SRS 3.15, 3.16, 3.17:
  - `getProducts`: Lấy danh sách sản phẩm phân trang mặc định đúng 20 dòng theo BR-03, tìm kiếm theo tên hoặc mã SP, lọc theo danh mục (`category_id`) và chiến dịch (`campaign_id`), sắp xếp linh hoạt theo ngày/giá/kho.
  - `getProductById`: Xem chi tiết sản phẩm kèm thông tin danh mục và chiến dịch.
  - `createProduct`: Tạo mới sản phẩm, kiểm tra đơn giá và số lượng kho không âm, chống trùng mã sản phẩm `product_code` (HTTP 409).
  - `updateProduct`: Cập nhật thông tin sản phẩm và chặn trùng mã sản phẩm.
  - `deleteProduct`: Xóa sản phẩm (bảo vệ toàn vẹn: chặn xóa nếu sản phẩm đã phát sinh cơ hội hoặc đơn hàng - HTTP 400).
  - `getProductOpportunities` (SRS 3.16): Xem toàn bộ danh sách các Cơ hội bán hàng liên quan đến sản phẩm kèm thông tin chi tiết khách hàng Lead.
  - `getProductOrders` (SRS 3.17): Xem toàn bộ danh sách các Đơn hàng thực tế đã xuất bán sản phẩm kèm thông tin khách hàng và tổng doanh số.
- [x] Xây dựng Tuyến đường `category.routes.js` và `product.routes.js` bọc bởi `authMiddleware` và `authorizeRoles`:
  - Quyền Quản lý (`SALE_MANAGER`) và Quản trị viên (`ADMIN`) có toàn quyền CRUD.
  - Quyền Nhân viên bán hàng (`SALESMAN`) được xem danh mục và sản phẩm để tạo cơ hội.
- [x] Mount vào `backend/src/app.js` tại prefix `/api/categories` và `/api/products`.
- [x] Xây dựng bộ kiểm thử tích hợp 18 bài test tại `backend/tests/product.test.js` kiểm tra toàn bộ luồng RBAC, validation, chống trùng mã SP/danh mục, phân trang 20 dòng, tìm kiếm, lọc danh mục, 2 APIs đặc thù SRS 3.16 & 3.17, và ràng buộc khóa ngoại khi xóa.
- [x] Khôi phục toàn bộ mật khẩu tài khoản mặc định `admin`, `manager`, `salesman` về `11111111` bằng `npm run db:seed`.
- [x] Chạy kiểm thử toàn hệ thống đạt 105/105 tests pass (70 backend + 35 frontend), build client production thành công.

## Verification Evidence

| Check | Command | Result | Notes |
|---|---|---|---|
| Backend Test Suite | `npm test` (trong `backend/`) | PASS (70/70 tests passed) | `app.test.js` (2), `auth.test.js` (12), `db.test.js` (4), `forgot-password.test.js` (6), `user.test.js` (13), `lead.test.js` (15), `product.test.js` (18) |
| Frontend Test Suite | `npm test` (trong `frontend/`) | PASS (35/35 tests passed) | `admin-ui.test.js` (10 tests) + `leads-ui.test.js` (10 tests) + `login-flow.test.js` (5 tests) + `user-management.test.js` (10 tests) |
| Frontend Lint | `npm run lint` (trong `frontend/`) | PASS (0 errors) | Oxlint kiểm tra 37 files sạch sẽ |
| Frontend Build | `npm run build` (trong `frontend/`) | PASS (built in 241ms) | Vite production bundle hoàn tất |
| Full System Test | `npm test` (tại thư mục gốc) | PASS (105/105 tests passed) | Chạy đồng bộ toàn bộ backend tests, frontend tests và frontend lint |

## Files Changed

- `backend/src/controllers/category.controller.js`: Xử lý CRUD Danh mục sản phẩm.
- `backend/src/controllers/product.controller.js`: Xử lý CRUD Sản phẩm, lọc, tìm kiếm và 2 APIs đặc thù SRS 3.16, 3.17.
- `backend/src/routes/category.routes.js`: Định tuyến và phân quyền RBAC cho module Categories.
- `backend/src/routes/product.routes.js`: Định tuyến và phân quyền RBAC cho module Products.
- `backend/src/app.js`: Mount `/api/categories` và `/api/products`.
- `backend/tests/product.test.js`: 18 bài kiểm thử tích hợp cho Products & Categories module.
- `feature_list.json`: Cập nhật `feat-010` thành `completed`.
- `progress.md`: Cập nhật tiến độ 10/20 tính năng hoàn thành (50%).
- `session-handoff.md`: Cập nhật biên bản bàn giao.

## Decisions Made

- Phân quyền RBAC: Chỉ `SALE_MANAGER` và `ADMIN` được quyền tạo, sửa, xóa sản phẩm và danh mục; `SALESMAN` được xem danh sách.
- Toàn vẹn dữ liệu: Không cho phép xóa sản phẩm nếu đã có Cơ hội hoặc Đơn hàng liên kết (HTTP 400); không cho phép xóa danh mục nếu đang có sản phẩm (HTTP 400).
- Hai APIs đặc thù theo SRS: `GET /api/products/:id/opportunities` (SRS 3.16) và `GET /api/products/:id/orders` (SRS 3.17) được triển khai đầy đủ và kiểm thử tự động.

## Blockers / Risks

- Không có rào cản kỹ thuật. Backend Products & Categories module hoạt động trơn tru và toàn vẹn.

## Next Steps

1. Bắt đầu triển khai **`feat-011: Frontend Giao diện Sản phẩm & Kho hàng (Products UI)`**:
   - Xây dựng `frontend/src/api/productApi.js` (kết nối APIs sản phẩm và danh mục).
   - Xây dựng `ProductListPage.jsx` (`/products`): Bảng danh sách sản phẩm 20 dòng, tìm kiếm theo tên/mã, bộ lọc danh mục dropdown, nút Thêm sản phẩm và Quản lý danh mục.
   - Xây dựng `ProductModal.jsx`: Form thêm/sửa sản phẩm, chọn danh mục, chọn chiến dịch, kiểm tra trùng mã SP.
   - Xây dựng `CategoryModal.jsx`: Modal popup quản lý danh mục (danh sách danh mục, thêm mới, sửa, xóa danh mục).
   - Xây dựng `ProductDetailPage.jsx` (`/products/:id`): Xem chi tiết sản phẩm và 2 tabs con riêng biệt:
     - Tab 1: **View Opportunities** (SRS 3.16) - danh sách khách hàng đang quan tâm.
     - Tab 2: **View Orders** (SRS 3.17) - lịch sử các đơn hàng đã xuất bán sản phẩm.
   - Cập nhật định tuyến `AppRoutes.jsx` gắn các trang vào router hệ thống.
   - Viết unit tests kiểm thử Products UI và chạy kiểm thử toàn hệ thống.
