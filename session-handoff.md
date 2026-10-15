<!-- Chức năng: Biên bản bàn giao phiên: ghi lại việc đang làm dở, blocker và bước tiếp theo khi mở chat mới -->

# Session Handoff

## Current Objective

- Goal: Hoàn thành `feat-018` (Backend Lập Kế hoạch Doanh số 12 Tháng & Báo cáo Đối soát Performance) và sẵn sàng chuyển sang `feat-019` (Frontend Màn hình Lập Kế hoạch & Dashboard Đối soát Doanh số - Dashboard UI).
- Current status: `feat-018` HOÀN THÀNH 100% (100% Definition of Done đạt chuẩn). Đạt cột mốc 18/20 tính năng hoàn thành (90% toàn bộ hệ thống Zen CRM).
- Branch / commit: `main`

- [x] **`feat-018`: Backend Lập Kế hoạch Doanh số 12 Tháng & Báo cáo Đối soát Performance (Sales Forecast & Planning Module theo SRS 3.20, 3.21, SRS 2.1, BR-07):**
  - **Controllers & Routers:**
    - [backend/src/controllers/forecast.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/forecast.controller.js): Xây dựng đầy đủ các methods `setupPlan`, `getPlansByYear`, `getPerformanceReport`, `getAvailableYears`.
    - [backend/src/routes/forecast.routes.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/routes/forecast.routes.js): Cấu hình router `/api/forecasts`, bảo vệ bởi xác thực JWT và RBAC chỉ dành cho `SALE_MANAGER` và `ADMIN`.
    - [backend/src/app.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/app.js): Mount router `/api/forecasts`.
  - **Thiết lập Kế hoạch Doanh số 12 Tháng (`POST /api/forecasts/setup` - SRS 3.20):**
    - Cho phép Sale Manager và Admin thiết lập hoặc cập nhật chỉ tiêu doanh số cho 12 tháng của năm tài chính (`fiscal_year`).
    - Hỗ trợ linh hoạt cả định dạng mảng `plans` và object `targets`.
    - Validate nghiêm ngặt: Kiểm tra năm tài chính `2000 <= fiscal_year <= 2100`, chỉ tiêu `target_amount >= 0`.
    - Sử dụng PostgreSQL Database Transaction ACID với cơ chế UPSERT (`INSERT INTO sale_forecasts ... ON CONFLICT (fiscal_year, month) DO UPDATE`).
  - **Lấy Kế hoạch theo Năm (`GET /api/forecasts/plans` - SRS 3.20):**
    - Lấy kế hoạch 12 tháng của năm tài chính, luôn trả về đủ 12 tháng kể cả tháng chưa nhập chỉ tiêu (mặc định 0), tính tổng chỉ tiêu năm (`total_plan`).
  - **Báo cáo Đối soát Kế hoạch vs Thực tế (`GET /api/forecasts/performance` - SRS 3.21 & BR-07):**
    - Truy vấn đối soát 12 tháng bằng SQL (`generate_series(1, 12)` kết hợp `LEFT JOIN` giữa `sale_forecasts` và `orders`).
    - Tự động tính toán các cột chuẩn SRS 3.21.3 REQ-1: `Month`, `Plan ($)`, `Actually Value ($)`, `%`, `Variance ($)`.
    - Thực thi chuẩn xác toán tử so sánh BR-07: `% = (Actually Value / Plan Value) * 100`, nếu `Plan = 0` thì `% = 0%`.
    - Tổng kết toàn diện KPI cả năm: `total_plan`, `total_actual`, `total_orders`, `total_items_sold`, `variance`, `overall_percentage`.
  - **Helper API (`GET /api/forecasts/years`):**
    - Lấy danh sách các năm tài chính khả dụng có dữ liệu để phục vụ dropdown chọn năm ở frontend.
  - **Phân quyền RBAC:**
    - Cấm 100% quyền truy cập của SALESMAN (HTTP 403 Forbidden).
    - Toàn quyền quản trị và đối soát thuộc về `SALE_MANAGER` và `ADMIN`.
  - **Kiểm thử Tích hợp (Integration Tests):**
    - Viết 15 bài integration tests tại [backend/tests/forecast.test.js](file:///Users/zen/CNTT/Fullstack/internship/backend/tests/forecast.test.js).
    - Kết quả kiểm thử toàn hệ thống: **223/223 tests PASS 100%** (139 backend + 84 frontend).
    - Vite production client build thành công trong 243ms, 0 lỗi linter.

- [x] **`feat-017`: Frontend Giao diện Chiến dịch & Báo cáo Hiệu quả (Campaigns & Reports UI theo SRS 3.18, 3.19, SRS 2.1, BR-03, BR-05):**
  - **API Services Client:**
    - [frontend/src/api/campaignApi.js](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/api/campaignApi.js): Cung cấp các methods `getCampaigns`, `getCampaignById`, `createCampaign`, `updateCampaign`, `deleteCampaign`, `assignProducts`, `removeProduct`, `getCampaignReport`.
    - [frontend/src/api/reportApi.js](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/api/reportApi.js): Cung cấp các methods `getSummaryReport`, `getLeadReport`, `getOrderReport`, `getRevenueReport`.
  - **CampaignModal ([frontend/src/pages/Campaigns/CampaignModal.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Campaigns/CampaignModal.jsx)):**
    - Biểu mẫu tạo mới và chỉnh sửa chiến dịch (SRS 3.18.1): Bắt buộc tên chiến dịch, kiểm tra ngày bắt đầu/kết thúc (`end_date >= start_date`), kiểm soát ngân sách `budget >= 0`.
    - Hiển thị spinner và thông báo lỗi thân thiện tiếng Việt.
  - **CampaignAssignProductsModal ([frontend/src/pages/Campaigns/CampaignAssignProductsModal.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Campaigns/CampaignAssignProductsModal.jsx)):**
    - Modal gán sản phẩm vào chiến dịch tiếp thị (SRS 3.18.1): Tìm kiếm sản phẩm nhanh theo mã/tên/danh mục, checkbox chọn hàng loạt, đánh dấu rõ sản phẩm đã gán và tồn kho còn lại.
  - **CampaignListPage ([frontend/src/pages/Campaigns/CampaignListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Campaigns/CampaignListPage.jsx) - `/campaigns`):**
    - Danh sách chiến dịch phân trang chuẩn 20 dòng theo BR-03.
    - 4 thẻ KPI nhanh: Tổng chiến dịch, Đang chạy (`ACTIVE`), Sắp diễn ra (`UPCOMING`), Tổng ngân sách.
    - Ô tìm kiếm đa năng có debounce, bộ lọc trạng thái thời gian, bộ lọc khoảng ngày (BR-05), sắp xếp linh hoạt.
    - Cột Thao tác: Xem Báo cáo hiệu quả ROI, Gán sản phẩm, Sửa, Xóa kèm Modal xác nhận an toàn.
  - **CampaignReportPage ([frontend/src/pages/Campaigns/CampaignReportPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Campaigns/CampaignReportPage.jsx) - `/campaigns/:id/report`):**
    - Màn hình Báo cáo Hiệu quả Chiến dịch (SRS 3.19) với 6 Thẻ KPI: Ngân sách đầu tư, Doanh thu thực tế mang về, Chỉ số **ROI (%)** đổi màu trực quan, Tổng số Leads, Tổng số Cơ hội, Tỷ lệ chuyển đổi Leads -> Orders.
    - 2 Bảng chi tiết: Danh sách Sản phẩm quảng bá (có nút gỡ sản phẩm) và Danh sách Khách hàng tiềm năng phát sinh.
    - Tích hợp nút In Báo Cáo chuyên nghiệp với `window.print()` và layout in ấn chuẩn.
  - **GeneralReportsPage ([frontend/src/pages/Reports/GeneralReportsPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Reports/GeneralReportsPage.jsx) - `/reports`):**
    - Màn hình Báo cáo Bán hàng & Doanh số toàn diện dành riêng cho `SALE_MANAGER` và `ADMIN` theo SRS 2.1.
    - Bộ lọc toàn cục: Khoảng ngày (`from_date`, `to_date`), Chu kỳ (`day` / `month`), nút In ấn và Làm mới.
    - 4 Tabs nghiệp vụ: Executive Summary, Leads Report, Orders Report, Revenue by Product/Category kèm % tỷ trọng đóng góp và thanh progress sinh động.
  - **Cập nhật Routing ([frontend/src/routes/AppRoutes.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/routes/AppRoutes.jsx)):**
    - Thay thế các `PlaceholderPage` của `/campaigns`, `/campaigns/:id/report` và `/reports`.
  - **Kiểm thử Unit Tests:**
    - Viết 14 bài tests tại [frontend/tests/campaigns-ui.test.js](file:///Users/zen/CNTT/Fullstack/internship/frontend/tests/campaigns-ui.test.js).
    - Kết quả kiểm thử toàn hệ thống: **208/208 tests PASS 100%** (124 backend + 84 frontend).
    - Vite production client build thành công trong 254ms, 0 lỗi linter.

- [x] **`feat-016`: Backend Quản lý Chiến dịch Marketing & Báo cáo Bán hàng (Campaigns & Sales Reporting theo SRS 3.18, 3.19, SRS 2.1):**
  - **Controllers & Routers:**
    - [backend/src/controllers/campaign.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/campaign.controller.js)
    - [backend/src/routes/campaign.routes.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/routes/campaign.routes.js)
    - [backend/src/controllers/report.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/report.controller.js)
    - [backend/src/routes/report.routes.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/routes/report.routes.js)
    - [backend/src/app.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/app.js) (mount `/api/campaigns` và `/api/reports`)
  - **CRUD Campaigns (SRS 3.18):**
    - `GET /api/campaigns`: Phân trang 20 dòng chuẩn BR-03, tìm kiếm theo tên/mô tả, lọc khoảng ngày BR-05, lọc trạng thái `ACTIVE` (đang chạy), `UPCOMING` (sắp diễn ra), `ENDED` (đã kết thúc), sắp xếp linh hoạt.
    - `POST /api/campaigns`: Thêm mới chiến dịch với validate tên, ngày bắt đầu/kết thúc (`end_date >= start_date`) và ngân sách (`budget >= 0`).
    - `GET /api/campaigns/:id`: Lấy chi tiết chiến dịch kèm danh sách sản phẩm gán và số Leads phát sinh.
    - `PUT /api/campaigns/:id`: Cập nhật thông tin chiến dịch.
    - `DELETE /api/campaigns/:id`: Xóa chiến dịch an toàn, tự động ngắt liên kết `campaign_id` trên bảng `products` và `leads`.
  - **Gán Sản phẩm vào Chiến dịch (SRS 3.18.1):**
    - `POST /api/campaigns/:id/products`: Gán danh sách mã sản phẩm vào chiến dịch tiếp thị.
    - `DELETE /api/campaigns/:id/products/:productId`: Gỡ sản phẩm khỏi chiến dịch.
  - **Báo cáo Hiệu quả Chiến dịch (Campaign Performance Report - SRS 3.19):**
    - `GET /api/campaigns/:id/report`: Đo lường toàn diện hiệu quả chiến dịch gồm ngân sách (`budget`), tổng số Leads thu được, tổng số Cơ hội chuyển đổi, tổng số Đơn hàng thành công, doanh thu thực tế, chỉ số ROI (`(doanh thu - ngân sách) / ngân sách * 100%`) và tỷ lệ chuyển đổi (`conversion_rate`).
    - Trả về danh sách chi tiết các Leads thu được và các Sản phẩm đang quảng bá trong chiến dịch.
  - **Hệ thống Báo cáo Bán hàng Tổng hợp (Sales & Business Reports - SRS 2.1):**
    - `GET /api/reports/summary`: Báo cáo nhanh KPI hôm nay / tháng này / năm nay và so sánh tiến độ với chỉ tiêu kế hoạch năm tài chính.
    - `GET /api/reports/leads`: Báo cáo chuỗi thời gian Leads theo ngày/tháng và phân bổ nguồn theo từng chiến dịch.
    - `GET /api/reports/orders`: Báo cáo chuỗi thời gian số lượng đơn hàng, giá trị trung bình đơn (AOV) và trạng thái đơn hàng.
    - `GET /api/reports/revenue`: Báo cáo doanh thu theo chu kỳ, phân bổ doanh thu theo từng Sản phẩm (Revenue by Product) kèm tỷ trọng đóng góp `%` và phân bổ theo Danh mục sản phẩm (SRS 2.1).
  - **Phân quyền RBAC:**
    - Salesman được phép xem danh sách chiến dịch để gắn Lead nhưng bị chặn 100% quyền tạo/sửa/xóa và xem báo cáo (HTTP 403 Forbidden).
    - Toàn quyền quản trị và phân tích báo cáo thuộc về `SALE_MANAGER` và `ADMIN`.
  - **Bộ kiểm thử & Build:**
    - Viết 19 bài integration tests tại `backend/tests/campaign.test.js`.
    - Kết quả kiểm thử toàn hệ thống: **194/194 tests PASS 100%** (124 backend + 70 frontend).
    - Vite build client thành công trong 250ms, 0 lỗi linter.
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
