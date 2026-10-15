<!-- Chức năng: Biên bản bàn giao phiên: ghi lại việc đang làm dở, blocker và bước tiếp theo khi mở chat mới -->

# Session Handoff

## Current Objective

- Goal: Hoàn thành `feat-015` (Frontend Màn hình Chốt đơn & Quản lý Đơn hàng - Make Order & Orders UI) và sẵn sàng chuyển sang `feat-016` (Backend Quản lý Chiến dịch Marketing & Báo cáo Bán hàng - Campaigns & Sales Reporting).
- Current status: `feat-015` HOÀN THÀNH 100% (100% Definition of Done đạt chuẩn). Đạt cột mốc 15/20 tính năng hoàn thành (75% toàn bộ hệ thống Zen CRM).
- Branch / commit: `main`

- [x] **`feat-015`: Frontend Màn hình Chốt đơn & Quản lý Đơn hàng (Make Order & Orders UI theo SRS 3.12, BR-03, BR-05, BR-07):**
  - **MakeOrderModal (`MakeOrderModal.jsx`):**
    - Modal chốt đơn từ Cơ hội bán hàng, tự động kế thừa đơn giá niêm yết, số lượng và địa chỉ của Lead.
    - Tính tổng tiền thời gian thực (`total_amount = quantity * unit_price`), kiểm tra tồn kho và cảnh báo đỏ tức thì nếu vượt quá tồn kho (SRS 3.12, AC-08).
    - Cung cấp preset phương thức thanh toán và bắt buộc nhập thông tin thanh toán (`payment_info`) cùng địa chỉ giao hàng (`shipping_address`) theo SRS 3.12.3 REQ-1.
    - Gọi API `oppApi.makeOrder` với transaction ACID, xử lý trạng thái loading và phản hồi lỗi thân thiện.
  - **Tích hợp vào Opportunity Pages:**
    - `OpportunityDetailPage.jsx`: Kích hoạt `MakeOrderModal`, reload tự động chi tiết cơ hội sau khi chốt (hiển thị ngay card Đơn Hàng Đã Được Khởi Tạo Thành Công và badge `ORDERED`).
    - `OpportunityListPage.jsx`: Cột Thao tác bổ sung nút `ShoppingBag` màu xanh lá cho các cơ hội chưa chốt.
  - **OrderListPage (`OrderListPage.jsx`):**
    - Trang danh sách đơn hàng đã chốt tại `/orders`.
    - Phân trang chuẩn 20 dòng/trang theo quy chuẩn BR-03 (`limit=20`).
    - 3 thẻ thống kê KPI: Tổng số đơn hàng, Tổng doanh thu đã chốt (VND), Tổng số lượng sản phẩm xuất kho.
    - Tìm kiếm đa năng (mã đơn, tên khách hàng, tên sản phẩm), bộ lọc khoảng ngày chốt đơn theo BR-05 (`from_date`, `to_date`), bộ lọc trạng thái và sắp xếp theo ngày chốt/tổng tiền.
  - **OrderDetailPage (`OrderDetailPage.jsx`):**
    - Trang chi tiết đơn hàng tại `/orders/:id`.
    - Hiển thị hóa đơn bán hàng chuyên nghiệp bảo tồn giá bán tại thời điểm chốt (SRS 3.12).
    - Tích hợp tính năng In phiếu xuất kho / Hóa đơn (`window.print()`) kèm mẫu chữ ký khách hàng và nhân viên lập phiếu.
  - **AppRoutes & orderApi:**
    - Gắn `OrderListPage` và `OrderDetailPage` vào `AppRoutes.jsx` thay thế `PlaceholderPage`.
    - `orderApi.js` cung cấp đầy đủ các phương thức kết nối API đơn hàng.
  - **Bộ kiểm thử & Build:**
    - Viết 12 bài unit tests tại `frontend/tests/orders-ui.test.js` kiểm tra validation, tính tiền realtime, query params BR-03/BR-05, format mã đơn và thống kê KPI.
    - Kết quả kiểm thử toàn hệ thống: **175/175 tests PASS 100%** (105 backend + 70 frontend).
    - Vite build client thành công trong 306ms, 0 lỗi linter.
- [x] **Khắc phục lỗi Foreign Key `leads_assigned_to_fkey` và Dropdown Sản Phẩm trong Cơ Hội:**
  - **Lỗi 1 (Thêm Lead bị vi phạm khóa ngoại `leads_assigned_to_fkey`):**
    - Đã xác thực an toàn ID người dùng phụ trách (`assigned_to`) và chiến dịch (`campaign_id`) trong `lead.controller.js` trước khi lưu vào CSDL; nâng cấp `auth.middleware.js` kiểm tra tài khoản còn tồn tại và active.
  - **Lỗi 2 (Dropdown "Sản phẩm quan tâm" bị rỗng trong Modal Cơ hội):**
    - Sửa `prodRes.data?.products` thành `prodRes.products || prodRes.data?.products || []` trong [OpportunityModal.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/OpportunityModal.jsx) do `axiosClient` đã unbox `response.data`.
- [x] **Khắc phục triệt để lỗi Màn hình trắng khi đăng nhập Manager (`SALE_MANAGER`):**
  - **Nguyên nhân:** Thiếu import `Package` từ `lucide-react` trong [Dashboard.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Dashboard/Dashboard.jsx) ở nhánh KPI của Manager (`currentRole === 'SALE_MANAGER'`), gây `ReferenceError: Package is not defined` làm crash React tree dẫn đến màn hình trắng.
  - **Khắc phục:** Đã import `Package`, sửa nhãn badge phân quyền trong Dashboard, và bổ sung component [ErrorBoundary.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Common/ErrorBoundary.jsx) bọc ngoài [App.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/App.jsx) để chống trắng màn hình trong toàn ứng dụng.
- [x] **Điều chỉnh phân quyền hiển thị theo Role (RBAC Visibility Control chuẩn SRS 2.1):**
  - **Nguyên tắc:** Role nào không quản lý phân hệ nào thì **tuyệt đối không được hiển thị lên**:
    - `ADMIN` (Quản trị viên): CHỈ hiển thị `Dashboard` và `User Mgmt` (`/admin/users`). Tuyệt đối **ẨN** khỏi Sidebar và cấm Route: `Leads`, `Opportunities`, `Orders`, `Products`, `Campaigns`, `Forecast`, `Reports`.
    - `SALE_MANAGER` (Quản lý bán hàng): CHỈ hiển thị `Dashboard`, `Products`, `Campaigns`, `Forecast`, `Reports`. Tuyệt đối **ẨN** khỏi Sidebar và cấm Route: `User Mgmt` và các mục bán hàng trực tiếp `Leads`, `Opportunities`, `Orders`.
    - `SALESMAN` (Nhân viên bán hàng): CHỈ hiển thị `Dashboard`, `Leads`, `Opportunities`, `Orders`. Tuyệt đối **ẨN** `Products`, `Campaigns`, `Forecast`, `Reports`, `User Mgmt`.
  - Chuẩn hóa vai trò: `currentRole = (role || user?.role_name || user?.role || '').trim().toUpperCase()`.
  - Cập nhật `Dashboard.jsx`: Khối "Chức năng Nghiệp vụ Được Phép Quản Lý" và KPI Cards tự động hiển thị độc lập đúng theo vai trò.
- [x] **Sửa lỗi hiển thị chữ vai trò trong Dropdown phân quyền (`UserManagement.jsx`):**
  - Backend `user.controller.js` hàm `getRoles`: `SELECT id, name, name AS role_name, description FROM roles`.
  - Frontend `UserManagement.jsx`: Hàm `getRoleLabel` hiển thị nhãn tiếng Việt rõ ràng (`Quản trị viên (ADMIN)`, `Quản lý bán hàng (SALE_MANAGER)`, `Nhân viên bán hàng (SALESMAN)`), cấu hình `min-w-[190px]` và padding cho select, giải quyết triệt để lỗi dropdown rỗng chữ.
- [x] **Sửa chức năng Thêm khách hàng tiềm năng (`LeadModal.jsx` & `lead.controller.js`):**
  - Backend `lead.controller.js`: Xử lý `cleanDob` để chuỗi rỗng chuyển thành `null` (tránh lỗi `invalid input syntax for type date: ""`), nhận cả `career` hoặc `title`.
  - Frontend `LeadModal.jsx`: Chuẩn hóa payload sạch sẽ khi submit, hiển thị thông báo lỗi rõ ràng từ response server, sửa `handleCheckDuplicate` kiểm tra đúng `res.isDuplicate || res.data?.isDuplicate` để cảnh báo trùng lặp realtime.
- [x] Xây dựng Service API `frontend/src/api/oppApi.js` kết nối toàn diện các endpoints:
  - `getOpportunities`, `getOpportunityById`, `getStatuses`, `checkDuplicate`, `createOpportunity`, `updateOpportunity`, `deleteOpportunity`, `addFollowUp`, `getFollowUps`.
- [x] Xây dựng `OpportunityModal.jsx`:
  - Biểu mẫu thêm mới & chỉnh sửa Cơ hội (SRS 3.6, 3.9).
  - Tự động nạp dropdown khách hàng và sản phẩm (kèm giá bán, tồn kho).
  - Tự động tính nhẩm giá trị ước tính (`estimated_value = quantity * unit_price`) hiển thị dạng badge tiền tệ VND trực quan.
  - Tích hợp kiểm tra trùng lặp realtime qua `oppApi.checkDuplicate` (BR-02, SRS 3.6.2 REQ-4), bắt lỗi HTTP 409 Conflict hiển thị cảnh báo đỏ và cung cấp checkbox xác nhận tiếp tục.
- [x] Xây dựng `FollowUpModal.jsx`:
  - Form ghi nhận nhật ký chăm sóc theo chuẩn SRS 3.11: ngày liên hệ, kênh tương tác (Điện thoại, Email, Gặp mặt, Zalo), nội dung bắt buộc, phản hồi khách, kế hoạch tiếp theo, đổi trạng thái cơ hội.
- [x] Xây dựng `OpportunityListPage.jsx` (`/opportunities`):
  - Bảng danh sách cơ hội chuẩn 20 dòng theo BR-03 (SRS 3.7.3 REQ-1).
  - Ô tìm kiếm đa năng theo tên Lead hoặc Sản phẩm có debounce 300ms (SRS 3.8).
  - Bộ lọc Trạng thái (6 statuses chuẩn), bộ lọc khoảng ngày tạo (BR-05), sắp xếp ngày tạo/ngày chốt/số lượng kèm nút đảo chiều ASC/DESC (BR-04).
  - Thẻ thống kê tổng số cơ hội và tổng doanh thu dự kiến ước tính trên trang.
  - Nút "+ Thêm Cơ Hội Mới", nút ghi nhanh Follow-up, nút xem chi tiết, sửa và xóa có ConfirmDialog.
  - Tự động mở modal khi có query param `createForLead` hoặc `createForProduct`.
- [x] Xây dựng `OpportunityDetailPage.jsx` (`/opportunities/:id`):
  - Hiển thị chi tiết cơ hội (SRS 3.7.3 REQ-4) gồm 3 thẻ: Thông số cơ hội, Hồ sơ Lead, Chi tiết Sản phẩm.
  - Thẻ thông tin Đơn hàng khi đã chốt (`ORDERED`).
  - **Dòng thời gian chăm sóc trực quan (Follow-up Activity Timeline - SRS 3.11)** hiển thị từng mốc tương tác, người thực hiện, nội dung, phản hồi của khách và kế hoạch tiếp theo.
  - Nút "+ Ghi Nhận Chăm Sóc", nút "Chốt Đơn Hàng (Make an Order)", nút Sửa, Xóa.
- [x] Cập nhật định tuyến `AppRoutes.jsx` thay thế PlaceholderPage bằng `OpportunityListPage` và `OpportunityDetailPage`.
- [x] Viết 10 bài unit tests tại `frontend/tests/opportunities-ui.test.js` kiểm tra validation, parse duplicate error 409, estimated value và timeline sorting.
- [x] Khôi phục toàn bộ mật khẩu tài khoản mặc định `admin`, `manager`, `salesman` về `11111111` bằng `npm run db:seed`.
- [x] Chạy kiểm thử toàn hệ thống đạt 142/142 tests pass (87 backend + 55 frontend), Oxlint 0 errors trên 49 files, build client production thành công trong 228ms.

## Verification Evidence

| Check | Command | Result | Notes |
|---|---|---|---|
| Backend Test Suite | `npm test` (trong `backend/`) | PASS (87/87 tests passed) | `app.test.js` (2), `auth.test.js` (12), `db.test.js` (4), `forgot-password.test.js` (6), `user.test.js` (13), `lead.test.js` (15), `product.test.js` (18), `opportunity.test.js` (17) |
| Frontend Test Suite | `npm test` (trong `frontend/`) | PASS (55/55 tests passed) | `admin-ui.test.js` (10) + `leads-ui.test.js` (10) + `login-flow.test.js` (5) + `products-ui.test.js` (10) + `user-management.test.js` (10) + `opportunities-ui.test.js` (10) |
| Frontend Lint | `npm run lint` (trong `frontend/`) | PASS (0 errors) | Oxlint kiểm tra 49 files sạch sẽ |
| Frontend Build | `npm run build` (trong `frontend/`) | PASS (built in 228ms) | Vite production bundle hoàn tất |
| Full System Test | `npm test` (tại thư mục gốc) | PASS (142/142 tests passed) | Chạy đồng bộ toàn bộ backend tests, frontend tests và frontend lint |

## Files Changed

- `frontend/src/api/oppApi.js`: API Service kết nối module Cơ hội và Follow-up.
- `frontend/src/pages/Opportunities/OpportunityModal.jsx`: Modal thêm/sửa cơ hội kèm kiểm tra trùng lặp và tính nhẩm giá trị.
- `frontend/src/pages/Opportunities/FollowUpModal.jsx`: Modal ghi nhận nhật ký tương tác tư vấn khách hàng.
- `frontend/src/pages/Opportunities/OpportunityListPage.jsx`: Bảng danh sách cơ hội 20 dòng, search, sort, filter ngày.
- `frontend/src/pages/Opportunities/OpportunityDetailPage.jsx`: Chi tiết cơ hội kèm dòng thời gian Follow-up timeline.
- `frontend/src/routes/AppRoutes.jsx`: Gắn định tuyến `/opportunities` và `/opportunities/:id`.
- `frontend/tests/opportunities-ui.test.js`: 10 bài unit tests cho Opportunities UI.
- `feature_list.json`: Cập nhật `feat-013` sang `completed` với evidence tiếng Việt.
- `progress.md`: Cập nhật tiến độ 13/20 tính năng (65%).

## Next Steps

1. Triển khai tính năng tiếp theo: **`feat-014: Backend Chốt đơn hàng bằng Database Transaction (Make an Order)`**:
   - `backend/src/controllers/order.controller.js` hoặc endpoint trong controller: `POST /api/opportunities/:id/make-order` (SRS 3.12).
   - Thiết kế PostgreSQL ACID Transaction (`BEGIN ... COMMIT / ROLLBACK`):
     - Khóa dòng sản phẩm bằng Row-level locking: `SELECT stock_qty, unit_price FROM products WHERE id = $1 FOR UPDATE`.
     - Kiểm tra tồn kho `stock_qty >= quantity`, nếu không đủ trả về HTTP 400 Bad Request kèm thông báo lỗi rõ ràng.
     - Tự động sinh mã đơn hàng duy nhất `order_code` (ví dụ: `ORD-YYYYMMDD-XXXX`).
     - INSERT đơn hàng mới vào bảng `orders` (bảo tồn đơn giá và tổng tiền tại thời điểm chốt).
     - Trừ tồn kho tự động trong bảng `products`: `UPDATE products SET stock_qty = stock_qty - $1 WHERE id = $2`.
     - Cập nhật trạng thái cơ hội trong bảng `opportunities` sang `'ORDERED'`.
     - COMMIT transaction.
   - Viết integration test tại `backend/tests/make-order.test.js`.
2. Chuyển giao sang `feat-015: Frontend Màn hình Chốt đơn & Quản lý Đơn hàng (Make Order & Orders UI)`.
