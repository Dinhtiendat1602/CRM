<!-- Chức năng: Nhật ký tiến độ phiên làm việc: theo dõi trạng thái hiện tại, việc đã làm, đang làm, rủi ro và bằng chứng kiểm thử -->

# Session Progress Log - Nhật Ký Tiến Độ Phiên Làm Việc

## Current State (Hiện Trạng Hệ Thống)

**Last Updated:** 2026-10-15 10:45
**Active Task:** feat-019 - Frontend Màn hình Lập Kế hoạch & Dashboard Đối soát Doanh số (Dashboard UI)
**Current Status:** HOÀN THÀNH 100% (233/233 tests pass: 139 backend + 94 frontend, build 268ms, 0 lint errors)
**Next Feature:** `feat-020` - Kiểm thử E2E Toàn diện, Nghiệm thu 100% SRS & Kịch bản Bảo vệ Đồ án

---

## Status (Trạng Thái Tính Năng)

### What's Done (Những việc đã hoàn thành)

- [x] **feat-019: Frontend Màn hình Lập Kế hoạch & Dashboard Đối soát Doanh số (Dashboard UI theo SRS 3.20, 3.21, SRS 2.1, BR-07):**
  - **API Service Client (`forecastApi.js`):**
    - Cung cấp đầy đủ các phương thức: `setupPlan` (POST /api/forecasts/setup), `getPlans` (GET /api/forecasts/plans), `getPerformanceReport` (GET /api/forecasts/performance), `getAvailableYears` (GET /api/forecasts/years).
  - **Màn hình Lập Kế hoạch Doanh số 12 Tháng (`SetupPlanPage.jsx` - `/forecast/setup`):**
    - Tuân thủ 100% biểu mẫu bảng SRS 3.20 (`Month (1->12) | Value ($)`).
    - Hộp chọn năm tài chính linh hoạt (mặc định năm hiện hành và kế tiếp).
    - 3 thẻ thống kê KPI tổng quan: Tổng chỉ tiêu năm, Mục tiêu trung bình/tháng, Phân bổ chi tiết 4 Quý (Q1-Q4).
    - Bộ công cụ phân bổ nhanh thông minh (Smart Allocation Tools): Chia đều tổng năm cho 12 tháng, Tăng trưởng +10%, +20%, Đặt lại về 0.
    - Bảng nhập chỉ tiêu 12 tháng trực quan kèm thanh phân bổ % tỷ trọng năm thời gian thực.
    - Lưu dữ liệu an toàn qua PostgreSQL Transaction ACID, thông báo thành công / lỗi thân thiện.
  - **Màn hình Báo cáo Đối soát Kế hoạch vs Thực tế (`PerformanceReportPage.jsx` - `/forecast/performance`):**
    - Bảng đối soát 12 tháng chuẩn SRS 3.21: `Month | Plan ($) | Actually Value ($) | % Đạt`.
    - 5 Thẻ KPIs tổng kết cả năm: Kế hoạch (Plan $), Thực tế (Actually Value $) từ N đơn chốt, Tỷ lệ hoàn thành %, Chênh lệch Variance (đổi màu xanh/đỏ trực quan), Đánh giá tiến độ (Xuất sắc, Tăng trưởng tốt, Cần đẩy mạnh).
    - Biểu đồ trực quan hóa kết hợp (Mixed Bar & Line Chart) bằng Chart.js: Cột Kế hoạch (xanh dương), Cột Thực tế (xanh ngọc) và Đường Tỷ lệ hoàn thành % (vàng cam) với 2 trục Y độc lập.
    - Bảng số liệu chi tiết 12 tháng kèm badge đánh giá (Vượt chỉ tiêu / Đạt tốt / Đang tiến triển / Chưa đạt).
    - Layout In Báo Cáo chuyên nghiệp (`window.print()`): Ẩn các nút điều khiển không cần thiết, tự động hiển thị tiêu đề báo cáo, ngày giờ in ấn và khu vực ký duyệt của Trưởng phòng kinh doanh & Ban Giám đốc.
  - **Cập nhật Điều hướng AppRoutes:**
    - Gắn `SetupPlanPage` và `PerformanceReportPage` vào `/forecast/setup` và `/forecast/performance` thay thế `PlaceholderPage`.
    - Tích hợp sẵn trong menu Sidebar và Header điều hướng.
  - **Bộ kiểm thử & Build:**
    - Viết 10 bài unit tests tại `frontend/tests/forecast-ui.test.js` kiểm tra validation năm tài chính, định mức tháng, tính toán tổng năm/quý, phân bổ nhanh, quy tắc BR-07 (% = Actually/Plan * 100, Plan = 0 => % = 0) và cấu hình Chart.js.
    - Kết quả kiểm thử toàn hệ thống: **233/233 tests PASS 100%** (139 backend + 94 frontend).
    - Vite build client thành công trong 268ms, 0 lỗi linter.

- [x] **feat-018: Backend Lập Kế hoạch Doanh số 12 Tháng & Báo cáo Đối soát Performance (Sales Forecast & Planning Module theo SRS 3.20, 3.21, SRS 2.1, BR-07):**
  - **Controllers & Routers:**
    - `forecast.controller.js`: Xây dựng đầy đủ các methods `setupPlan`, `getPlansByYear`, `getPerformanceReport`, `getAvailableYears`.
    - `forecast.routes.js`: Cấu hình router `/api/forecasts`, bảo vệ bởi xác thực JWT và RBAC chỉ dành cho `SALE_MANAGER` và `ADMIN`.
    - `app.js`: Mount router `/api/forecasts`.
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
    - Viết 15 bài integration tests tại `backend/tests/forecast.test.js`.
    - Kết quả kiểm thử toàn hệ thống: **223/223 tests PASS 100%** (139 backend + 84 frontend).
    - Vite production client build thành công trong 243ms, 0 lỗi linter.

- [x] **feat-017: Frontend Giao diện Chiến dịch & Báo cáo Hiệu quả (Campaigns & Reports UI theo SRS 3.18, 3.19, SRS 2.1, BR-03, BR-05):**
  - **API Services Client (`campaignApi.js` & `reportApi.js`):**
    - `campaignApi.js`: Cung cấp các methods `getCampaigns`, `getCampaignById`, `createCampaign`, `updateCampaign`, `deleteCampaign`, `assignProducts`, `removeProduct`, `getCampaignReport`.
    - `reportApi.js`: Cung cấp các methods `getSummaryReport`, `getLeadReport`, `getOrderReport`, `getRevenueReport`.
  - **CampaignModal (`CampaignModal.jsx`):**
    - Biểu mẫu tạo mới và chỉnh sửa chiến dịch (SRS 3.18.1): Bắt buộc tên chiến dịch, kiểm tra ngày bắt đầu/kết thúc (`end_date >= start_date`), kiểm soát ngân sách `budget >= 0`.
    - Hiển thị spinner và thông báo lỗi thân thiện tiếng Việt.
  - **CampaignAssignProductsModal (`CampaignAssignProductsModal.jsx`):**
    - Modal gán sản phẩm vào chiến dịch tiếp thị (SRS 3.18.1): Tìm kiếm sản phẩm nhanh theo mã/tên/danh mục, checkbox chọn hàng loạt, đánh dấu rõ sản phẩm đã gán và tồn kho còn lại.
  - **CampaignListPage (`CampaignListPage.jsx` - `/campaigns`):**
    - Danh sách chiến dịch phân trang chuẩn 20 dòng theo BR-03.
    - 4 thẻ KPI nhanh: Tổng chiến dịch, Đang chạy (`ACTIVE`), Sắp diễn ra (`UPCOMING`), Tổng ngân sách.
    - Ô tìm kiếm đa năng có debounce, bộ lọc trạng thái thời gian, bộ lọc khoảng ngày (BR-05), sắp xếp linh hoạt.
    - Cột Thao tác: Xem Báo cáo hiệu quả ROI, Gán sản phẩm, Sửa, Xóa kèm Modal xác nhận an toàn.
  - **CampaignReportPage (`CampaignReportPage.jsx` - `/campaigns/:id/report`):**
    - Màn hình Báo cáo Hiệu quả Chiến dịch (SRS 3.19) với 6 Thẻ KPI: Ngân sách đầu tư, Doanh thu thực tế mang về, Chỉ số **ROI (%)** đổi màu trực quan, Tổng số Leads, Tổng số Cơ hội, Tỷ lệ chuyển đổi Leads -> Orders.
    - 2 Bảng chi tiết: Danh sách Sản phẩm quảng bá (có nút gỡ sản phẩm) và Danh sách Khách hàng tiềm năng phát sinh.
    - Tích hợp nút In Báo Cáo chuyên nghiệp với `window.print()` và layout in ấn chuẩn.
  - **GeneralReportsPage (`GeneralReportsPage.jsx` - `/reports`):**
    - Màn hình Báo cáo Bán hàng & Doanh số toàn diện dành riêng cho `SALE_MANAGER` và `ADMIN` theo SRS 2.1.
    - Bộ lọc toàn cục: Khoảng ngày (`from_date`, `to_date`), Chu kỳ (`day` / `month`), nút In ấn và Làm mới.
    - 4 Tabs nghiệp vụ:
      * Tab 1 (Executive Summary): So sánh doanh thu, đơn hàng, leads hôm nay / tháng này / năm nay và % hoàn thành kế hoạch năm; Sức khỏe pipeline bán hàng.
      * Tab 2 (Leads Report): Chuỗi thời gian leads mới, phân bổ theo nguồn chiến dịch, phân bổ theo nhân viên phụ trách.
      * Tab 3 (Orders Report): Chuỗi thời gian đơn hàng & giá trị trung bình đơn AOV, phân bổ theo trạng thái đơn, top nhân viên chốt sale hiệu quả nhất.
      * Tab 4 (Revenue Report): Phân bổ doanh thu theo từng sản phẩm (Revenue by Product) kèm % tỷ trọng đóng góp và thanh progress sinh động; Phân bổ doanh thu theo danh mục sản phẩm (Revenue by Category).
  - **Cập nhật Routing (`AppRoutes.jsx`):**
    - Thay thế các `PlaceholderPage` của `/campaigns`, `/campaigns/:id/report` và `/reports`.
  - **Kiểm thử Unit Tests:**
    - Viết 14 bài tests tại `frontend/tests/campaigns-ui.test.js`.
    - Kết quả kiểm thử toàn hệ thống: **208/208 tests PASS 100%** (124 backend + 84 frontend).
    - Vite production client build thành công trong 254ms, 0 lỗi linter.

- [x] **feat-016: Backend Quản lý Chiến dịch Marketing & Báo cáo Bán hàng (Campaigns & Sales Reporting theo SRS 3.18, 3.19, SRS 2.1):**
  - **CRUD Campaigns (`campaign.controller.js` & `campaign.routes.js`):**
    - `GET /api/campaigns`: Phân trang 20 dòng chuẩn BR-03, tìm kiếm đa năng theo tên/mô tả, lọc theo khoảng ngày BR-05, lọc trạng thái thời gian chiến dịch `ACTIVE` (đang chạy), `UPCOMING` (sắp diễn ra), `ENDED` (đã kết thúc), sắp xếp linh hoạt.
    - `POST /api/campaigns`: Thêm chiến dịch mới với validate bắt buộc tên, ngày bắt đầu/kết thúc (`end_date >= start_date`) và ngân sách (`budget >= 0`).
    - `GET /api/campaigns/:id`: Lấy chi tiết chiến dịch kèm danh sách sản phẩm gán và số Leads phát sinh.
    - `PUT /api/campaigns/:id`: Cập nhật thông tin chiến dịch.
    - `DELETE /api/campaigns/:id`: Xóa chiến dịch an toàn, tự động ngắt liên kết `campaign_id` trên bảng `products` và `leads`.
  - **Gán Sản phẩm vào Chiến dịch (`assignProducts` & `removeProductFromCampaign` - SRS 3.18.1):**
    - `POST /api/campaigns/:id/products`: Gán mảng mã sản phẩm vào chiến dịch tiếp thị.
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
  - **Kiểm thử tích hợp:**
    - Viết 19 bài integration tests tại `backend/tests/campaign.test.js`.
    - Kết quả kiểm thử toàn hệ thống: **194/194 tests PASS 100%** (124 backend + 70 frontend).
    - Vite build client thành công trong 250ms, 0 lỗi linter.

- [x] **feat-015: Frontend Màn hình Chốt đơn & Quản lý Đơn hàng (Make Order & Orders UI theo SRS 3.12, BR-03, BR-05, BR-07):**
  - **MakeOrderModal (`MakeOrderModal.jsx`):**
    - Modal chốt đơn từ cơ hội bán hàng, tự động kế thừa thông tin Lead, Sản phẩm, Đơn giá niêm yết và số lượng nhu cầu.
    - Tính toán tổng giá trị đơn hàng thời gian thực (`total_amount = quantity * unit_price`) hiển thị dạng card nổi bật.
    - Tính nhẩm tồn kho còn lại sau khi chốt (`stock_qty - quantity`), tự động đổi màu cảnh báo và hiển thị banner đỏ nếu số lượng yêu cầu vượt quá tồn kho (SRS 3.12, AC-08).
    - Lựa chọn nhanh phương thức thanh toán (COD, Chuyển khoản, Thẻ tín dụng, Công nợ 30 ngày) và bắt buộc nhập thông tin thanh toán (`payment_info`) theo SRS 3.12.3 REQ-1.
    - Bắt buộc nhập địa chỉ giao nhận hàng (`shipping_address`) theo SRS 3.12.3 REQ-1, tự động điền địa chỉ Lead nếu có.
    - Xử lý submit gọi `oppApi.makeOrder(oppId, payload)` an toàn qua Database Transaction ACID, hiển thị spinner và bắt lỗi tồn kho 400 rõ ràng.
  - **Tích hợp MakeOrderModal vào Cơ hội bán hàng:**
    - `OpportunityDetailPage.jsx`: Thay thế nút bấm alert thành kích hoạt `MakeOrderModal`, reload tự động chi tiết cơ hội sau khi chốt (hiển thị ngay card Đơn Hàng Đã Được Khởi Tạo Thành Công và badge `ORDERED`).
    - `OpportunityListPage.jsx`: Cột Thao tác bổ sung nút `ShoppingBag` màu xanh lá cho các cơ hội chưa chốt, cho phép chốt đơn trực tiếp ngay tại danh sách.
  - **OrderListPage (`OrderListPage.jsx`):**
    - Trang danh sách đơn hàng đã chốt tại `/orders`.
    - Phân trang chuẩn 20 dòng/trang theo quy chuẩn BR-03 (`limit=20`).
    - 3 thẻ thống kê KPI: Tổng số đơn hàng, Tổng doanh thu đã chốt (VND), Tổng số lượng sản phẩm xuất kho.
    - Bộ lọc & Tìm kiếm: Ô tìm kiếm đa năng có debounce (mã đơn, tên khách hàng, tên sản phẩm), bộ lọc khoảng ngày chốt đơn theo BR-05 (`from_date`, `to_date`), bộ lọc trạng thái đơn hàng và sắp xếp linh hoạt theo ngày chốt hoặc tổng tiền.
  - **OrderDetailPage (`OrderDetailPage.jsx`):**
    - Trang chi tiết đơn hàng tại `/orders/:id`.
    - Hiển thị hóa đơn bán hàng chuyên nghiệp bảo tồn giá bán tại thời điểm chốt (SRS 3.12).
    - 4 khối thông tin: Thông số hóa đơn, Hồ sơ khách hàng nhận hàng, Chi tiết sản phẩm xuất kho (giá chốt vs giá niêm yết), Thông tin giao nhận và thanh toán.
    - Tích hợp tính năng In phiếu xuất kho / Hóa đơn (`window.print()`) kèm mẫu chữ ký khách hàng và nhân viên lập phiếu.
  - **AppRoutes & orderApi:**
    - Gắn `OrderListPage` và `OrderDetailPage` vào `AppRoutes.jsx` thay thế `PlaceholderPage`.
    - Tạo `orderApi.js` cung cấp đầy đủ các phương thức kết nối API đơn hàng.
  - **Bộ kiểm thử & Build:**
    - Viết 12 bài unit tests tại `frontend/tests/orders-ui.test.js` kiểm tra validation, tính tiền realtime, query params BR-03/BR-05, format mã đơn và thống kê KPI.
    - Kết quả kiểm thử toàn hệ thống: **175/175 tests PASS 100%** (105 backend + 70 frontend).
    - Vite build client thành công trong 306ms, 0 lỗi linter.

- [x] **feat-014: Backend Chốt đơn hàng bằng Database Transaction (Make an Order theo SRS 3.12, BR-03, BR-07):**
  - **Kiến trúc & Transaction ACID (`order.controller.js`):**
    - Hiện thực hóa `makeOrder` qua `POST /api/opportunities/:id/make-order` và `POST /api/orders` sử dụng PostgreSQL Client Transaction (`BEGIN ... COMMIT / ROLLBACK`).
    - Khóa dòng Row-level Locking (`SELECT ... FOR UPDATE`) đồng thời trên bảng `opportunities` và `products` để loại bỏ 100% nguy cơ race-condition.
    - Kiểm tra tồn kho tự động (BR-03, SRS 3.12, AC-08): Nếu tồn kho `product.stock_qty < requested_quantity`, hệ thống kích hoạt `ROLLBACK`, trả về HTTP 400 kèm thông tin tồn kho hiện tại và yêu cầu, đảm bảo nguyên vẹn dữ liệu (tồn kho không bị trừ, cơ hội không đổi trạng thái).
    - Tạo bản ghi đơn hàng mới vào bảng `orders`:
      - Tự sinh mã đơn hàng duy nhất `order_code` theo chuẩn CRM `ORD-YYYYMMDD-XXXX`.
      - Bảo lưu đơn giá niêm yết tại thời điểm chốt (`unit_price`) và tính tổng giá trị (`total_amount = quantity * unit_price`).
      - Bắt buộc lưu thông tin thanh toán (`payment_info`) và thông tin giao hàng (`shipping_address`) theo SRS 3.12.3 REQ-1.
    - Tự động trừ số lượng tồn kho sản phẩm (`UPDATE products SET stock_qty = stock_qty - $1`).
    - Cập nhật trạng thái cơ hội sang `ORDERED` (SRS 3.12.1).
    - Tự động ghi 1 bản ghi Follow-up (SRS 3.11) ghi nhận sự kiện chốt đơn.
    - Chặn chốt đơn lần thứ 2 đối với cơ hội đã `ORDERED` (bảo toàn quan hệ 1-1).
    - Chặn xóa cơ hội đã chuyển thành đơn hàng `ORDERED` (SRS 3.10) trả về HTTP 400.
  - **Quản lý đơn hàng (`order.controller.js` & `order.routes.js`):**
    - `GET /api/orders`: Danh sách đơn hàng phân trang chuẩn 20 dòng (BR-03), tìm kiếm đa năng theo mã đơn/tên khách hàng/tên sản phẩm, lọc theo khoảng ngày chốt đơn (BR-05), thống kê tổng số đơn và tổng doanh thu.
    - `GET /api/orders/:id`: Chi tiết đơn hàng theo ID hoặc `order_code` kèm đầy đủ thông tin Lead, Sản phẩm và Cơ hội.
    - Phân quyền RBAC chặt chẽ cho 3 vai trò: `SALESMAN`, `SALE_MANAGER`, `ADMIN`.
  - **Bộ kiểm thử & Đồng bộ tài khoản thật:**
    - Tạo `backend/tests/order.test.js` với 15 bài integration tests kiểm thử toàn diện mọi tình huống nghiệp vụ và biên.
    - Tạo `backend/tests/helpers/test-auth.js` giúp test suite tự động nhận diện và sử dụng chính 3 tài khoản THẬT của người dùng trong database (`admin1` / pass `11111111`, `manager1` / pass `22222222`, `sale1` / pass `11111111`), giữ nguyên 100% dữ liệu thật của người dùng.
    - **Kết quả kiểm thử toàn hệ thống:** 163/163 tests PASS 100% (105 backend + 58 frontend), Vite build thành công trong 250ms, 0 lỗi linter.

- [x] **Bổ sung tính năng Admin Xóa tài khoản nhân viên (giữ nguyên tính năng Khóa tài khoản):**
  - **Backend (`user.controller.js` & `user.routes.js`):**
    - API `DELETE /api/admin/users/:id` có phân quyền chặt chẽ `authorizeRoles('ADMIN')`.
    - Bảo vệ an toàn (Guards): Chặn Admin tự xóa tài khoản của chính mình (`req.user.id === targetId`), chặn xóa tài khoản root mặc định (`username === 'admin'`).
    - Nhờ thiết kế CSDL toàn bộ khóa ngoại trỏ tới `users(id)` đều dùng `ON DELETE SET NULL`, khi xóa nhân viên thì các dữ liệu liên quan (Leads, Campaigns, Opportunities, Orders, Forecasts) tự động chuyển sang `NULL` an toàn, không bị lỗi ràng buộc dữ liệu.
  - **Frontend (`UserManagement.jsx` & `adminApi.js`):**
    - Giữ nguyên 100% nút và chức năng **Khóa/Mở khóa tài khoản** (`u.is_active` toggle button ở cột Trạng thái).
    - Cột Thao tác: Bổ sung nút **"Xóa"** (icon `Trash2`, màu đỏ, disabled khi là tài khoản bản thân hoặc admin mặc định).
    - Tích hợp `ConfirmDialog` xác nhận xóa tài khoản nguy hiểm (`isDangerous={true}`) với thông báo rõ ràng trước khi xóa.
  - **Kiểm thử:** 90/90 backend tests pass (bao gồm 3 unit tests mới cho `DELETE user`), 58/58 frontend tests pass (bao gồm unit tests cho Admin User Deletion Guard).

- [x] **Khắc phục lỗi Foreign Key `leads_assigned_to_fkey` và Dropdown Sản Phẩm trong Cơ Hội:**
  - **Lỗi 1 (`leads_assigned_to_fkey` khi thêm Lead mới):**
    - *Nguyên nhân:* Khi người dùng thêm khách tiềm năng, backend gán `assigned_to = req.user?.id`. Nếu phiên đăng nhập mang user ID cũ (hoặc tài khoản đã bị thay đổi sau khi reseed database), PostgreSQL sẽ báo vi phạm ràng buộc khóa ngoại `leads_assigned_to_fkey` vì ID người dùng không tồn tại trong bảng `users`.
    - *Khắc phục:* Trong `lead.controller.js` (cả `createLead` và `updateLead`), đã bổ sung câu truy vấn kiểm tra xác thực ID người dùng và chiến dịch tồn tại trước khi gán (`SELECT id FROM users WHERE id = $1`), nếu không tồn tại sẽ an toàn gán `null`. Đồng thời nâng cấp `auth.middleware.js` kiểm tra tài khoản còn tồn tại và active trong CSDL để tự động thu hồi token cũ.
  - **Lỗi 2 (Dropdown "Sản phẩm quan tâm" bị rỗng trong Modal Cơ hội):**
    - *Nguyên nhân:* `OpportunityModal.jsx` trích xuất `prodRes.data?.products`. Do `axiosClient.interceptors.response` đã tự động unbox `response.data`, kết quả trả về `prodRes` là `{ success: true, products: [...] }`, dẫn đến `prodRes.data` bị `undefined` và danh sách sản phẩm thành mảng rỗng `[]`.
    - *Khắc phục:* Cập nhật thành `prodRes.products || prodRes.data?.products || []`, giúp nạp đầy đủ toàn bộ sản phẩm vào thẻ `<select>` kèm mã SP, tên, đơn giá và số lượng tồn kho.

- [x] **Khắc phục triệt để lỗi Màn hình trắng khi đăng nhập Manager (`SALE_MANAGER`):**
  - **Nguyên nhân cốt lõi (Root Cause):** Trong `Dashboard.jsx`, khi xây dựng hàm `getRoleKPIs()` cho vai trò `SALE_MANAGER`, KPI "Danh Mục Sản Phẩm Kho" sử dụng `icon: Package`. Tuy nhiên ở đầu file `Dashboard.jsx`, icon `Package` chưa được import từ `lucide-react`. Khi tài khoản `manager` đăng nhập, React cố gắng render `<Icon className="h-4 w-4" />` với `Icon = undefined`, dẫn đến `ReferenceError: Package is not defined`. Lỗi này làm crash toàn bộ cây component React và tạo ra màn hình trắng (Blank Screen).
  - **Biện pháp xử lý & Phòng vệ (Fix & Resilience):**
    1. Đã import bổ sung `Package` từ `lucide-react` trong `Dashboard.jsx`.
    2. Cập nhật nhãn phân quyền thẻ Quick Action (`action.roles.includes('SALE_MANAGER') ? 'Chỉ Manager' : ...`) hiển thị chính xác thay vì nhầm 'Chỉ Admin'.
    3. Tạo component `ErrorBoundary.jsx` bao bọc toàn bộ ứng dụng tại `App.jsx`, giúp hiển thị giao diện báo lỗi thân thiện kèm nút "Tải lại trang" / "Trang chủ" thay vì để màn hình trắng nếu có lỗi giao diện trong tương lai.

- [x] **Tinh chỉnh Chức Năng Quản Lý Của Mỗi Role (RBAC Visibility Control chuẩn SRS 2.1):**
  - **Quy tắc tuyệt đối:** Mỗi vai trò chỉ quản lý đúng phân hệ theo SRS 2.1, chức năng nào vai trò đó không quản lý thì **tuyệt đối không được hiển thị lên** (cả Sidebar, Routing, Dashboard KPIs và Quick Actions):
    - `ADMIN` (Quản trị viên): CHỈ hiển thị và quản lý 2 phân hệ: **`Dashboard`** và **`User Mgmt`** (`/admin/users`). Tuyệt đối **ẨN HOÀN TOÀN** và cấm truy cập toàn bộ các phân hệ nghiệp vụ kinh doanh: `Leads`, `Opportunities`, `Orders`, `Products`, `Campaigns`, `Forecast`, `Reports`.
    - `SALE_MANAGER` (Quản lý bán hàng): CHỈ hiển thị và quản lý 5 phân hệ: **`Dashboard`**, **`Products`** (`/products`), **`Campaigns`** (`/campaigns`), **`Forecast`** (`/forecast/setup`), **`Reports`** (`/reports`). Tuyệt đối **ẨN HOÀN TOÀN** và cấm truy cập `User Mgmt` (chỉ Admin) cũng như `Leads`, `Opportunities`, `Orders` (của nhân viên bán hàng).
    - `SALESMAN` (Nhân viên bán hàng): CHỈ hiển thị và quản lý 4 phân hệ: **`Dashboard`**, **`Leads`** (`/leads`), **`Opportunities`** (`/opportunities`), **`Orders`** (`/orders`). Tuyệt đối **ẨN HOÀN TOÀN** `Products`, `Campaigns`, `Forecast`, `Reports`, `User Mgmt`.
  - Chuẩn hóa xác định vai trò `currentRole = (role || user?.role_name || user?.role || '').trim().toUpperCase()` trên toàn bộ: `Sidebar.jsx`, `RoleRoute.jsx`, `Dashboard.jsx`.
  - Nâng cấp `Dashboard.jsx`: Thẻ KPI và Quick Actions tách biệt rạch ròi 100% cho 3 vai trò (Admin: Quản trị tài khoản & nhân sự; Manager: Kho sản phẩm, Chiến dịch & Doanh số; Salesman: Khách tiềm năng, Cơ hội & Đơn hàng).

- [x] **Sửa Lỗi Hiển Thị Vai Trò trong Dropdown Phân Quyền (`UserManagement.jsx`):**
  - Backend `user.controller.js` hàm `getRoles`: Thêm alias `SELECT id, name, name AS role_name, description FROM roles` để tương thích 100% với frontend.
  - Backend `auth.controller.js` hàm `login`: Trả về cả `role` và `role_name` trong user object.
  - Frontend `UserManagement.jsx`:
    - Tạo hàm `getRoleLabel`: hiển thị nhãn tiếng Việt rõ ràng, to đẹp (`Quản trị viên (ADMIN)`, `Quản lý bán hàng (SALE_MANAGER)`, `Nhân viên bán hàng (SALESMAN)`).
    - Cập nhật cả 3 vị trí dropdown: Bộ lọc vai trò, Cột Gán vai trò trong bảng người dùng (chỗ bị lỗi rỗng chữ), và Modal Thêm nhân viên mới.
    - Cấu hình style `min-w-[190px]` và padding hợp lý để chữ hiển thị rõ ràng, không bị co dúm.

- [x] **Sửa Lỗi Chức Năng Thêm Khách Hàng Tiềm Năng (`LeadModal.jsx` & `lead.controller.js`):**
  - Backend `lead.controller.js`: Xử lý `cleanDob = (date_of_birth && String(date_of_birth).trim() !== '') ? String(date_of_birth).trim() : null` để không bao giờ truyền chuỗi rỗng vào kiểu `DATE` của PostgreSQL; nhận cả `career` hoặc `title` (`cleanCareer = (career || req.body.title || '').trim() || null`).
  - Frontend `LeadModal.jsx`:
    - Chuẩn hóa payload sạch sẽ trước khi gửi API (gán `date_of_birth: formData.date_of_birth ? formData.date_of_birth : null`, map `career: formData.title || formData.career || null`, ghép địa chỉ `address`).
    - Sửa xử lý lỗi trong `handleSubmit`: trích xuất thông báo lỗi chính xác từ `err?.message || err?.response?.data?.message || err?.error`.
    - Sửa cơ chế phát hiện trùng lặp realtime `handleCheckDuplicate`: đọc đúng `res.isDuplicate || res.data?.isDuplicate` để hiển thị cảnh báo đỏ trực quan ngay dưới ô Email/SĐT khi người dùng rời chuột.

- [x] **`feat-013` - Frontend Giao diện Quản lý Cơ hội & Timeline Follow-up (Opportunities UI)**
  - Xây dựng trọn bộ giao diện người dùng Quản lý Cơ hội bán hàng theo phong cách Zoho CRM đáp ứng 100% SRS 3.6 - 3.11:
    - `OpportunityListPage.jsx` (`/opportunities`): Bảng danh sách cơ hội phân trang chuẩn 20 dòng theo BR-03 (SRS 3.7.3 REQ-1), ô tìm kiếm đa năng theo tên Lead hoặc tên/mã sản phẩm debounced 300ms (SRS 3.8), dropdown lọc theo 6 trạng thái cơ hội chuẩn, bộ lọc khoảng ngày tạo (BR-05), sắp xếp linh hoạt theo ngày tạo/ngày chốt/số lượng kèm nút đảo chiều ASC/DESC (BR-04), các thẻ thống kê tổng số cơ hội và tổng doanh thu dự kiến ước tính, nút 'Thêm Cơ Hội Mới'. Tự động mở modal khi có query param `createForLead` hoặc `createForProduct`.
    - `OpportunityModal.jsx`: Biểu mẫu thêm mới & chỉnh sửa Cơ hội (SRS 3.6, 3.9), dropdown chọn khách hàng Lead và sản phẩm Product (hiển thị kèm đơn giá và tồn kho), ô nhập số lượng nhu cầu và ngày dự kiến chốt; tự động tính nhẩm giá trị ước tính (`estimated_value`) hiển thị trực quan dạng thẻ badge tiền VND; tích hợp cơ chế phát hiện trùng lặp realtime qua `oppApi.checkDuplicate` (BR-02, SRS 3.6.2 REQ-4), bắt lỗi HTTP 409 Conflict hiển thị cảnh báo đỏ và cung cấp tùy chọn xác nhận trùng.
    - `FollowUpModal.jsx`: Modal ghi nhận nhật ký chăm sóc khách hàng (SRS 3.11), lưu thời gian liên hệ, phương thức liên hệ (Điện thoại, Email, Gặp trực tiếp, Zalo/Chat), nội dung trao đổi bắt buộc, phản hồi của khách hàng, kế hoạch tiếp theo và tùy chọn cập nhật trạng thái cơ hội mới.
    - `OpportunityDetailPage.jsx` (`/opportunities/:id`): Màn hình chi tiết cơ hội (SRS 3.7.3 REQ-4) gồm 3 thẻ thông tin: Thông số cơ hội, Hồ sơ khách hàng Lead, Chi tiết Sản phẩm; thẻ Đơn hàng khi đã chốt; và dòng thời gian trực quan (Follow-up Activity Timeline) hiển thị toàn bộ lịch sử các lần tương tác chăm sóc của nhân viên bán hàng kèm phản hồi của khách và kế hoạch tiếp theo.
    - `oppApi.js`: Service client axios kết nối đầy đủ các endpoints cơ hội và nhật ký chăm sóc.
    - Gắn định tuyến vào `AppRoutes.jsx` cho `/opportunities` và `/opportunities/:id` cho cả 3 vai trò `SALESMAN`, `SALE_MANAGER`, `ADMIN`.
  - Bộ kiểm thử: 10 bài unit tests tại `frontend/tests/opportunities-ui.test.js` (toàn bộ 55/55 tests frontend pass, build Vite thành công trong 228ms).

- [x] **`feat-012` - Backend Quản lý Cơ hội & Nhật ký Chăm sóc (Opportunities & Follow-up Log)**
  - Xây dựng trọn bộ RESTful API CRUD Cơ hội bán hàng và Nhật ký chăm sóc (`opportunity.controller.js` và `opportunity.routes.js`):
    - `GET /api/opportunities`: Lấy danh sách cơ hội phân trang chuẩn 20 dòng theo BR-03 (SRS 3.7.3 REQ-1), tìm kiếm đa năng theo tên Lead hoặc tên/mã Sản phẩm (SRS 3.8), sắp xếp theo ngày tạo (BR-04, SRS 3.7.3 REQ-2), lọc theo khoảng ngày (BR-05, SRS 3.7.3 REQ-3), lọc theo trạng thái status, lead_id, product_id; tính toán giá trị ước tính (`estimated_value`) và đếm số lượt chăm sóc (`follow_ups_count`).
    - `GET /api/opportunities/:id`: Xem chi tiết Cơ hội kèm toàn bộ hồ sơ khách hàng Lead, chi tiết Sản phẩm (giá bán, tồn kho, danh mục), danh sách dòng thời gian Follow-up (`follow_ups`) và thông tin đơn hàng nếu đã chốt (SRS 3.7.3 REQ-4).
    - `GET /api/opportunities/statuses`: Danh mục 6 trạng thái cơ hội chuẩn (`NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL`, `ORDERED`, `LOST`) kèm nhãn tiếng Việt.
    - `GET /api/opportunities/check-duplicate`: Kiểm tra realtime cơ hội đang mở giữa khách hàng và sản phẩm (BR-02, SRS 3.6.2 REQ-4).
    - `POST /api/opportunities`: Thêm mới Cơ hội gắn với Lead + Sản phẩm quan tâm + Số lượng + Ngày dự kiến chốt (SRS 3.6); chống trùng lặp theo BR-02 trả về HTTP 409 Conflict khi khách hàng đang có cơ hội chưa đóng cho sản phẩm đó.
    - `PUT /api/opportunities/:id`: Cập nhật Cơ hội (số lượng, trạng thái, ngày dự kiến, ghi chú) (SRS 3.9); bảo vệ không cho đổi sản phẩm/khách hàng khi đã chốt đơn.
    - `DELETE /api/opportunities/:id`: Xóa Cơ hội (SRS 3.10), tự động CASCADE dọn dẹp các bản ghi follow-ups liên quan, chặn xóa trả về HTTP 400 nếu cơ hội đã chuyển đổi thành đơn hàng ORDERED.
    - `POST /api/opportunities/:id/follow-ups` & `POST /api/opportunities/:id/follow-up`: Ghi nhận nhật ký chăm sóc (ngày, phương thức liên hệ, nội dung, phản hồi khách, kế hoạch tiếp) (SRS 3.11), tự động cập nhật trạng thái cơ hội sang `CONTACTED` hoặc theo trạng thái chỉ định.
    - `GET /api/opportunities/:id/follow-ups`: Lấy danh sách lịch sử tương tác chăm sóc của cơ hội.
  - Phân quyền RBAC bảo vệ toàn bộ endpoints cho 3 vai trò: `SALESMAN`, `SALE_MANAGER`, `ADMIN`.
  - Bộ kiểm thử: 17 integration tests tự động tại `backend/tests/opportunity.test.js` (toàn bộ 132/132 tests pass trên toàn hệ thống: 87 backend + 45 frontend).

- [x] **`feat-011` - Frontend Giao diện Sản phẩm & Kho hàng (Products UI)**
  - Xây dựng trọn bộ giao diện người dùng Quản lý Sản phẩm theo phong cách Zoho CRM và đáp ứng 100% SRS 3.15, 3.16, 3.17:
    - `ProductListPage.jsx` (`/products`): Bảng danh sách sản phẩm phân trang 20 dòng chuẩn BR-03 (SRS 3.15), ô tìm kiếm mã/tên sản phẩm debounced 300ms, dropdown lọc danh mục sản phẩm, sắp xếp linh hoạt theo ngày/giá/kho, nhãn cảnh báo tồn kho sắp hết khi `stock_qty <= 5`, nút Thêm Sản Phẩm và Quản Lý Danh Mục.
    - `ProductModal.jsx`: Form thêm mới & chỉnh sửa sản phẩm (SRS 3.15), dropdown chọn danh mục và chiến dịch quảng bá (SRS 3.18), kiểm tra đơn giá và số lượng kho không âm, bắt lỗi HTTP 409 Conflict hiển thị cảnh báo đỏ khi trùng mã sản phẩm `product_code`.
    - `CategoryModal.jsx`: Modal popup quản lý danh mục sản phẩm (SRS 3.15), hiển thị số lượng sản phẩm liên kết (`products_count`), thêm mới, sửa, xóa danh mục có kiểm tra ràng buộc.
    - `ProductDetailPage.jsx` (`/products/:id`): Màn hình chi tiết sản phẩm và chứa 2 TABS CON ĐẶC THÙ THEO SRS:
      - Tab 1: **View Opportunities** (SRS 3.16): Xem danh sách toàn bộ các Cơ hội bán hàng đang quan tâm sản phẩm này kèm thông tin khách hàng Lead.
      - Tab 2: **View Orders** (SRS 3.17): Xem danh sách toàn bộ các Đơn hàng thực tế đã xuất bán sản phẩm này, tự động tổng hợp số lượng đã bán và tổng doanh thu thu về ($).
    - `productApi.js`: Service client axios kết nối toàn bộ endpoints danh mục và sản phẩm.
    - Cập nhật định tuyến `AppRoutes.jsx` gắn `ProductListPage` và `ProductDetailPage` vào router hệ thống.
  - Bộ kiểm thử: 10 bài unit tests tại `frontend/tests/products-ui.test.js` (toàn bộ 45/45 tests frontend pass, build Vite thành công trong 237ms).

- [x] **`feat-010` - Backend Quản lý Danh mục & Sản phẩm Kho (Products & Categories Module)**
  - Xây dựng trọn bộ RESTful API CRUD Danh mục sản phẩm (`category.controller.js` và `category.routes.js`):
    - `GET /api/categories`: Lấy toàn bộ danh mục, tự động đếm số lượng sản phẩm liên kết (`products_count`).
    - `POST /api/categories`: Tạo danh mục mới, chống trùng tên danh mục (HTTP 409 Conflict).
    - `PUT /api/categories/:id`: Cập nhật thông tin danh mục.
    - `DELETE /api/categories/:id`: Xóa danh mục (bảo vệ toàn vẹn: chặn xóa nếu đang có sản phẩm thuộc danh mục - HTTP 400).
  - Xây dựng trọn bộ RESTful API CRUD Sản phẩm kho (`product.controller.js` và `product.routes.js`):
    - `GET /api/products`: Lấy danh sách sản phẩm phân trang 20 dòng mặc định theo BR-03 (SRS 3.15), tìm kiếm đa năng theo mã sản phẩm hoặc tên sản phẩm, lọc theo danh mục (`category_id`) và chiến dịch (`campaign_id`), sắp xếp linh hoạt theo ngày tạo/đơn giá/tồn kho.
    - `GET /api/products/:id`: Xem chi tiết sản phẩm kèm tên danh mục và tên chiến dịch quảng bá.
    - `POST /api/products`: Tạo mới sản phẩm, kiểm tra đơn giá và số lượng kho không âm, chống trùng mã sản phẩm `product_code` (HTTP 409 Conflict).
    - `PUT /api/products/:id`: Cập nhật thông tin sản phẩm và chặn đổi sang mã sản phẩm đã được sử dụng.
    - `DELETE /api/products/:id`: Xóa sản phẩm (bảo vệ toàn vẹn: chặn xóa nếu sản phẩm đã phát sinh cơ hội bán hàng hoặc đơn hàng - HTTP 400).
    - `GET /api/products/:id/opportunities`: API đặc thù theo SRS 3.16: Xem toàn bộ danh sách các Cơ hội bán hàng liên quan đến sản phẩm kèm thông tin chi tiết khách hàng Lead.
    - `GET /api/products/:id/orders`: API đặc thù theo SRS 3.17: Xem toàn bộ danh sách các Đơn hàng thực tế đã xuất bán sản phẩm kèm doanh số và khách hàng.
  - Phân quyền RBAC đa cấp độ: Quản lý (`SALE_MANAGER`) và Quản trị viên (`ADMIN`) có quyền toàn quyền CRUD; Nhân viên bán hàng (`SALESMAN`) được cấp quyền xem danh mục và sản phẩm để tạo cơ hội bán hàng.
  - Bộ kiểm thử: 18 integration tests tự động tại `backend/tests/product.test.js` (toàn bộ 70/70 tests backend pass 100%).

- [x] **`feat-009` - Frontend Giao diện Quản lý Khách tiềm năng (Leads UI)**
  - Xây dựng trọn bộ giao diện người dùng theo chuẩn phong cách Zoho CRM và đáp ứng 100% SRS 3.1 - 3.5:
    - `LeadListPage.jsx` (`/leads`): Bảng danh sách Leads phân trang đúng 20 dòng theo BR-03 (SRS 3.2.3 REQ-1), tích hợp `SearchInput` tìm kiếm theo tên có debounce 300ms (SRS 3.3), bộ lọc ngày nhập từ `startDate` đến `endDate` (BR-05), nút đảo chiều sắp xếp `entered_date` ASC/DESC (BR-04), nút "+ Thêm Khách Tiềm Năng" và nút xóa mở `ConfirmDialog`.
    - `LeadModal.jsx`: Biểu mẫu thêm mới & chỉnh sửa Lead với đầy đủ các trường thông tin (SRS 3.1, 3.4), chỉ rõ các trường bắt buộc có dấu `*` đỏ, kiểm tra hợp lệ dữ liệu, kiểm tra trùng lặp realtime qua `leadApi.checkDuplicate` kết hợp bắt mã lỗi HTTP 409 từ server hiển thị cảnh báo đỏ nổi bật (BR-02, SRS 3.1.2 REQ-4).
    - `LeadDetailPage.jsx` (`/leads/:id`): Màn hình xem chi tiết Lead theo SRS 3.2.3 REQ-4, các nút sửa thông tin, xóa và tạo cơ hội mới, cùng bảng danh sách các Cơ hội bán hàng liên quan (Associated Opportunities) tính toán doanh số dự kiến.
    - `leadApi.js`: API Service kết nối trọn bộ 6 endpoints backend.
    - Cập nhật định tuyến `AppRoutes.jsx` gắn `LeadListPage` và `LeadDetailPage` vào các route thực tế.
  - Bộ kiểm thử: 10 bài unit tests tại `frontend/tests/leads-ui.test.js` kiểm tra validation, parse duplicate error 409, query params và tính toán cơ hội liên quan (35/35 tests frontend pass, build Vite thành công trong 241ms).

- [x] **`feat-008` - Backend Quản lý Khách hàng tiềm năng (Leads Module)**
  - Xây dựng trọn bộ RESTful API CRUD Khách hàng tiềm năng (`lead.controller.js` và `lead.routes.js`) tuân thủ nghiêm ngặt SRS 3.1 - 3.5:
    - `GET /api/leads`: Lấy danh sách Leads có phân trang mặc định 20 bản ghi/trang (BR-03, SRS 3.2.3 REQ-1), lọc theo khoảng ngày nhập `startDate` / `endDate` (BR-05, SRS 3.2.3 REQ-2), sắp xếp tăng/giảm theo `entered_date` (BR-04, SRS 3.2.3 REQ-3), tìm kiếm theo tên khách hàng (SRS 3.3).
    - `GET /api/leads/:id`: Xem chi tiết Lead kèm theo danh sách Cơ hội (Opportunities) liên quan (SRS 3.2.3 REQ-4).
    - `GET /api/leads/check-duplicate`: API kiểm tra phát hiện trùng lặp Email hoặc Số điện thoại trong thời gian thực khi người dùng nhập liệu trên form.
    - `POST /api/leads`: Tạo mới Khách tiềm năng với cơ chế kiểm tra chống trùng SĐT/Email (BR-02, SRS 3.1.2 REQ-4), trả về mã lỗi HTTP 409 Conflict rõ ràng khi phát hiện trùng.
    - `PUT /api/leads/:id`: Cập nhật thông tin Khách tiềm năng, có ràng buộc chống đổi sang Email/SĐT đã thuộc về Lead khác (HTTP 409).
    - `DELETE /api/leads/:id`: Xóa Khách tiềm năng (SRS 3.5).
  - Tích hợp middleware phân quyền RBAC: Bảo vệ toàn bộ router với `authMiddleware` và `authorizeRoles('SALESMAN', 'SALE_MANAGER', 'ADMIN')`.
  - Bộ kiểm thử: 15 integration tests tự động tại `backend/tests/lead.test.js` (toàn bộ 52/52 tests backend pass 100%).

- [x] **`feat-001` - Khởi tạo môi trường & Cấu trúc khung dự án Full-Stack**
  - Cấu trúc monorepo hoàn chỉnh với orchestration script `npm run dev` (`concurrently`).
  - Backend Clean MVC (Express.js, cổng 5001): `config/` (DB Pool, Nodemailer), `middlewares/` (auth, role, error), `utils/` (validator), `routes/`, `app.js`, `server.js`.
  - Frontend Component-Based (Vite React 18, Tailwind CSS, cổng 8080): `api/axiosClient.js` (tự động gắn Bearer Token & bắt lỗi 401), `AuthContext.jsx`, `useIdleTimeout.js` (tự động đăng xuất sau 30 phút bất hoạt - SRS 5.3).
  - Kiểm thử: `npm test` backend (2/2 passed), `oxlint` frontend (0 lỗi, 0 cảnh báo), `npm run build` thành công.

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
  - Xây dựng Route Guards: `PrivateRoute.jsx` và `RoleRoute.jsx`.
  - Quản lý Phiên làm việc & Cảnh báo Timeout (SRS 5.3): `useIdleTimeout.js` và `TimeoutWarning.jsx` (popup đếm ngược 2 phút cuối).
  - Cập nhật địa chỉ Frontend dev server sang `http://localhost:8080`.
  - Kiểm thử: 10 unit tests tại `frontend/tests/admin-ui.test.js` pass 100%.

- [x] **`feat-007` - Frontend Màn hình Xác thực & Quản lý Người dùng (Users Management UI)**
  - Xây dựng `UserManagement.jsx` (`/admin/users`) theo SRS 2.1:
    - Bảng danh sách nhân viên: hiển thị avatar, họ tên, username, email, SĐT, role badge, trạng thái và ngày tạo.
    - Phân trang 20 dòng chuẩn BR-03 (`Pagination.jsx`).
    - Ô tìm kiếm debounced 300ms (`SearchInput.jsx`).
    - Bộ lọc dropdown theo vai trò (Roles) và trạng thái kích hoạt (Active / De-active).
    - Toggle kích hoạt/khóa tài khoản nhân viên kèm `ConfirmDialog` xác nhận (chặn Admin tự khóa tài khoản của chính mình).
    - Dropdown đổi vai trò nhân viên trực tiếp trên bảng.
    - `CreateUserModal`: Form tạo tài khoản nhân viên mới (validate bắt buộc, thông báo mật khẩu mặc định `11111111`).
    - `ResetPasswordModal`: Form đặt lại mật khẩu trực tiếp cho nhân viên khi gặp sự cố đăng nhập.
  - Xây dựng `ProfilePage.jsx` (`/profile`) theo SRS 3.13:
    - Xem thông tin cá nhân và vai trò đang đăng nhập.
    - Cập nhật họ tên và số điện thoại, đồng bộ ngay với Header qua `AuthContext`.
    - Form đổi mật khẩu tài khoản cá nhân: kiểm tra mật khẩu cũ, mật khẩu mới (tối thiểu 8 ký tự) và khớp mật khẩu xác nhận.
  - Xây dựng các Reusable Components: `Pagination.jsx`, `SearchInput.jsx`, `Modal.jsx`, `ConfirmDialog.jsx`.
  - Xây dựng các API Service: `authApi.js` và `adminApi.js`.
  - Kiểm thử: Viết 10 unit tests tại `frontend/tests/user-management.test.js` kiểm tra pagination range, self-deactivation guard, form validation. Toàn bộ 20/20 frontend tests và 57/57 system tests pass 100%.

---

### What's In Progress (Việc đang thực hiện)

- Sẵn sàng chuyển giao sang `feat-012` - Backend Quản lý Cơ hội & Nhật ký Chăm sóc (Opportunities & Follow-up Log: GET /api/opportunities phân trang 20 dòng, search tên Lead hoặc SP, POST tạo cơ hội, POST /api/opportunities/:id/follow-up lưu nhật ký ngày, kênh, nội dung, phản hồi khách, kế hoạch tiếp theo SRS 3.6 - 3.11).

---

### What's Next (Các bước tiếp theo)

1. `feat-012`: Backend Quản lý Cơ hội & Nhật ký Chăm sóc (Opportunities & Follow-up Log).
2. `feat-013`: Frontend Giao diện Quản lý Cơ hội & Timeline Follow-up (Opportunities UI).
3. `feat-014`: Backend Chốt đơn hàng bằng Database Transaction (Make an Order).

---

## Blockers / Risks (Rào Cản & Rủi Ro)

- **Không có rào cản**: Phân hệ Sản phẩm & Kho hàng (Products Module) đã hoàn thành 100% cả Backend API và Frontend UI, vượt qua toàn bộ 115 tests tự động toàn hệ thống và build Vite thành công trong 237ms.

---

## Decisions Made (Các Quyết Định Đã Thống Nhất)

- Backend chuyển sang cổng 8888, Frontend chạy cổng 8080 để tránh xung đột cổng.
- Toàn bộ các bảng danh sách tuân thủ nguyên tắc BR-03: hiển thị đúng 20 bản ghi mỗi trang kèm thanh phân trang chuẩn.
- Giao diện Sản phẩm tách biệt 2 tabs con theo chuẩn SRS: Tab 1 xem Cơ hội quan tâm sản phẩm (SRS 3.16) và Tab 2 xem lịch sử Đơn hàng đã xuất bán kèm tổng doanh thu thu về (SRS 3.17).
- Cơ chế bảo vệ toàn vẹn: Không cho phép xóa sản phẩm nếu đã có Cơ hội hoặc Đơn hàng liên kết (HTTP 400); không cho phép xóa danh mục nếu đang chứa sản phẩm (HTTP 400).

---

## Evidence of Completion (Bằng Chứng Kiểm Thử Hiện Tại)

| Lệnh kiểm thử | Kết quả | Chi tiết |
|---|---|---|
| `npm test` (trong `backend/`) | **PASS (87/87 passed, 0 failures)** | `app.test.js` (2) + `auth.test.js` (12) + `db.test.js` (4) + `forgot-password.test.js` (6) + `user.test.js` (13) + `lead.test.js` (15) + `product.test.js` (18) + `opportunity.test.js` (17) |
| `npm test` (trong `frontend/`) | **PASS (55/55 passed, 0 failures)** | `admin-ui.test.js` (10 tests) + `leads-ui.test.js` (10 tests) + `login-flow.test.js` (5 tests) + `products-ui.test.js` (10 tests) + `user-management.test.js` (10 tests) + `opportunities-ui.test.js` (10 tests) |
| `npm run lint` (trong `frontend/`) | **PASS (0 errors)** | Oxlint kiểm tra 49 files sạch sẽ |
| `npm run build` (trong `frontend/`) | **PASS (built in 230ms)** | Vite production bundle hoàn tất |
| `npm test` (toàn hệ thống) | **PASS (142/142 tests passed 100%)** | 87 tests backend + 55 tests frontend đều thành công mỹ mãn |
