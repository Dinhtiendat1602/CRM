<!-- Chức năng: Biên bản bàn giao phiên: ghi lại việc đang làm dở, blocker và bước tiếp theo khi mở chat mới -->

# Session Handoff

## Current Objective

- Goal: Triển khai tính năng `feat-011` (Frontend Giao diện Sản phẩm & Kho hàng - Products UI) và chuẩn bị chuyển giao sang `feat-012` (Backend Quản lý Cơ hội & Nhật ký Chăm sóc).
- Current status: `feat-011` HOÀN THÀNH (100% Definition of Done đạt chuẩn). Đạt cột mốc 11/20 tính năng hoàn thành (55% toàn bộ hệ thống Zen CRM).
- Branch / commit: `main`

## Completed This Session

- [x] Xây dựng Service API `frontend/src/api/productApi.js` kết nối toàn diện các endpoints Backend:
  - `getCategories`, `getCategoryById`, `createCategory`, `updateCategory`, `deleteCategory`.
  - `getProducts`, `getProductById`, `createProduct`, `updateProduct`, `deleteProduct`.
  - 2 APIs đặc thù theo chuẩn SRS: `getProductOpportunities` (SRS 3.16) và `getProductOrders` (SRS 3.17).
- [x] Xây dựng `CategoryModal.jsx`:
  - Modal quản lý danh mục sản phẩm độc lập (SRS 3.15).
  - Hiển thị số lượng sản phẩm liên kết (`products_count`).
  - Thêm danh mục mới, chỉnh sửa và xóa danh mục có kiểm tra ràng buộc khóa ngoại (chặn xóa nếu danh mục đang chứa sản phẩm).
- [x] Xây dựng `ProductModal.jsx`:
  - Biểu mẫu thêm mới & chỉnh sửa sản phẩm kho (SRS 3.15).
  - Tích hợp dropdown chọn danh mục và chiến dịch quảng bá (SRS 3.18).
  - Kiểm tra đơn giá và số lượng kho không âm.
  - Bắt mã lỗi HTTP 409 Conflict hiển thị cảnh báo đỏ khi trùng mã sản phẩm `product_code`.
- [x] Xây dựng `ProductListPage.jsx` (`/products`):
  - Bảng danh sách sản phẩm phân trang đúng 20 dòng theo BR-03 (SRS 3.15).
  - Ô tìm kiếm đa năng theo mã sản phẩm hoặc tên sản phẩm có debounce 300ms.
  - Dropdown lọc theo danh mục sản phẩm, sắp xếp linh hoạt theo ngày/giá/kho.
  - Cảnh báo tồn kho sắp hết khi `stock_qty <= 5`.
  - Phân quyền giao diện: `SALE_MANAGER` và `ADMIN` được Thêm, Sửa, Xóa và Quản lý danh mục; `SALESMAN` chỉ được xem danh sách.
- [x] Xây dựng `ProductDetailPage.jsx` (`/products/:id`):
  - Hiển thị đầy đủ thông tin chi tiết sản phẩm: Mã SP, Tên, Danh mục, Đơn giá, Tồn kho, Chiến dịch, Mô tả, Ngày tạo, Ngày cập nhật.
  - Chứa 2 TABS CON ĐẶC THÙ THEO SRS:
    - **Tab 1: View Opportunities (SRS 3.16)**: Xem danh sách toàn bộ các Cơ hội bán hàng đang quan tâm sản phẩm này kèm thông tin khách hàng Lead.
    - **Tab 2: View Orders (SRS 3.17)**: Xem danh sách toàn bộ các Đơn hàng thực tế đã xuất bán sản phẩm này, tự động tổng hợp số lượng đã bán và tổng doanh thu thu về ($).
- [x] Cập nhật định tuyến `AppRoutes.jsx` gắn `ProductListPage` và `ProductDetailPage` vào router hệ thống (bọc bảo vệ bởi `RoleRoute` cho Manager & Admin).
- [x] Viết 10 bài unit tests tại `frontend/tests/products-ui.test.js` kiểm tra validation, category form, query params và tính toán đơn hàng.
- [x] Khôi phục toàn bộ mật khẩu tài khoản mặc định `admin`, `manager`, `salesman` về `11111111` bằng `npm run db:seed`.
- [x] Chạy kiểm thử toàn hệ thống đạt 115/115 tests pass (70 backend + 45 frontend), build client production thành công trong 237ms.

## Verification Evidence

| Check | Command | Result | Notes |
|---|---|---|---|
| Backend Test Suite | `npm test` (trong `backend/`) | PASS (70/70 tests passed) | `app.test.js` (2), `auth.test.js` (12), `db.test.js` (4), `forgot-password.test.js` (6), `user.test.js` (13), `lead.test.js` (15), `product.test.js` (18) |
| Frontend Test Suite | `npm test` (trong `frontend/`) | PASS (45/45 tests passed) | `admin-ui.test.js` (10 tests) + `leads-ui.test.js` (10 tests) + `login-flow.test.js` (5 tests) + `products-ui.test.js` (10 tests) + `user-management.test.js` (10 tests) |
| Frontend Lint | `npm run lint` (trong `frontend/`) | PASS (0 errors) | Oxlint kiểm tra 43 files sạch sẽ |
| Frontend Build | `npm run build` (trong `frontend/`) | PASS (built in 237ms) | Vite production bundle hoàn tất |
| Full System Test | `npm test` (tại thư mục gốc) | PASS (115/115 tests passed) | Chạy đồng bộ toàn bộ backend tests, frontend tests và frontend lint |

## Files Changed

- `frontend/src/api/productApi.js`: API Service cho module Sản phẩm và Danh mục.
- `frontend/src/pages/Products/CategoryModal.jsx`: Modal quản lý danh mục sản phẩm.
- `frontend/src/pages/Products/ProductModal.jsx`: Form thêm/sửa sản phẩm kho.
- `frontend/src/pages/Products/ProductListPage.jsx`: Bảng quản lý sản phẩm 20 dòng, search, filter danh mục.
- `frontend/src/pages/Products/ProductDetailPage.jsx`: Chi tiết sản phẩm kèm 2 tabs SRS 3.16 và SRS 3.17.
- `frontend/src/routes/AppRoutes.jsx`: Định tuyến `/products` và `/products/:id`.
- `frontend/tests/products-ui.test.js`: 10 bài unit tests cho Products UI.
- `feature_list.json`: Cập nhật `feat-011` thành `completed`.
- `progress.md`: Cập nhật tiến độ 11/20 tính năng hoàn thành (55%).
- `session-handoff.md`: Cập nhật biên bản bàn giao.

## Decisions Made

- Phân trang chuẩn BR-03: Mọi bảng dữ liệu hiển thị đúng 20 dòng mỗi trang.
- Chi tiết sản phẩm tách biệt 2 tabs con theo chuẩn SRS: Tab 1 xem Cơ hội quan tâm sản phẩm (SRS 3.16) và Tab 2 xem lịch sử Đơn hàng đã xuất bán kèm tổng doanh thu thu về (SRS 3.17).
- Cơ chế bảo vệ toàn vẹn: Không cho phép xóa sản phẩm nếu đã có Cơ hội hoặc Đơn hàng liên kết (HTTP 400); không cho phép xóa danh mục nếu đang chứa sản phẩm (HTTP 400).

## Blockers / Risks

- Không có rào cản kỹ thuật. Phân hệ Sản phẩm & Kho hàng (Backend + Frontend) đã hoàn thiện 100%.

## Next Steps

1. Bắt đầu triển khai **`feat-012: Backend Quản lý Cơ hội & Nhật ký Chăm sóc (Opportunities & Follow-up Log)`**:
   - Xây dựng Controller `opportunity.controller.js` và Tuyến đường `opportunity.routes.js`:
     - `GET /api/opportunities`: Phân trang 20 dòng mặc định (BR-03), lọc/sort theo `created_at` (BR-04, BR-05), tìm kiếm đa năng theo tên Lead hoặc tên Sản phẩm (SRS 3.8), lọc theo trạng thái (`OPEN`, `FOLLOWING`, `ORDERED`, `CANCELLED`).
     - `GET /api/opportunities/:id`: Xem chi tiết Cơ hội kèm toàn bộ lịch sử chăm sóc (Follow-up timeline) và thông tin Lead + Sản phẩm (SRS 3.7.3 REQ-4).
     - `POST /api/opportunities`: Tạo Cơ hội mới (chọn `lead_id`, `product_id`, `quantity`, `expected_close_date`, `notes`) (SRS 3.6).
     - `PUT /api/opportunities/:id`: Cập nhật thông tin Cơ hội (SRS 3.9).
     - `DELETE /api/opportunities/:id`: Xóa Cơ hội (SRS 3.10).
     - `POST /api/opportunities/:id/follow-up`: Ghi nhận nhật ký chăm sóc gồm: Ngày liên hệ (`follow_date`), Kênh liên hệ (`contact_method`: PHONE/EMAIL/MEETING), Nội dung (`content`), Phản hồi của khách (`customer_response`), Kế hoạch tiếp theo (`next_plan`) (SRS 3.11).
   - Mount vào `backend/src/app.js` tại prefix `/api/opportunities`.
   - Viết bài kiểm thử tích hợp tự động `backend/tests/opportunity.test.js`.
