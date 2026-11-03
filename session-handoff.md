<!-- Chức năng: Biên bản bàn giao phiên: ghi lại việc đang làm dở, blocker và bước tiếp theo khi mở chat mới -->

# Session Handoff

## Current Objective
1. Xây dựng Chatbot AI bằng Python (FastAPI microservice `ai_service/`) kết hợp Google Gemini API (`gemini-flash-lite-latest` / Gemini 3.5 Flash-Lite) và Function Calling tự động truy vấn CSDL PostgreSQL (`CRM`).
2. Tích hợp Trợ lý AI (AIChatWidget.jsx) vào ứng dụng Frontend React (`MainLayout.jsx`), cung cấp nút FAB góc dưới phải và hộp thoại chat thông minh có quick prompts.
3. Viết unit tests cho AI Service (`test_ai_service.py`), bảo vệ API key trong `.gitignore`, tạo script khởi động nhanh `start.sh` và tài liệu hướng dẫn `ai_service/README.md`.
- Current status: HOÀN THÀNH 100% (270/270 tests PASS: 146 backend + 117 frontend + 7 AI Service unit tests, Uvicorn cổng 8000 online, Vite client build 373ms không lỗi).
- Branch / commit: `main`

- [x] **Trợ Lý AI Thông Minh Zen CRM (Python FastAPI & Gemini 3.5 Flash-Lite - `feat-027`):**
  - **1. Microservice Backend Python (`ai_service/`):**
    - `database.py`: Quản lý pool kết nối PostgreSQL (`CRM`), helper truy vấn chuyển đổi an toàn các kiểu dữ liệu `Decimal` và `datetime`.
    - `crm_tools.py`: Cung cấp 6 công cụ Function Calling cho Gemini:
      - `get_leads_summary`: Thống kê tổng số lead, lead hôm nay, lead tháng này và danh sách chi tiết.
      - `get_revenue_and_forecast`: Doanh số thực tế từ đơn hoàn tất, đối soát chỉ tiêu tháng/năm, tính % hoàn thành.
      - `get_products_and_inventory`: Tra cứu đơn giá, mã SP, phân loại và cảnh báo tồn kho sắp hết (<= 5).
      - `get_opportunities_overview`: Tổng quan các cơ hội bán hàng theo Pipeline và top cơ hội lớn nhất.
      - `get_campaigns_overview`: Đánh giá hiệu quả chiến dịch tiếp thị và số lượng lead thu được.
      - `search_customer`: Tra cứu đa kênh lịch sử khách hàng, cơ hội và đơn hàng liên quan.
    - `gemini_engine.py`: Tích hợp Google GenAI SDK (`gemini-flash-lite-latest`), cấu hình System Instruction chuẩn phong cách Zen CRM Enterprise, quản lý phiên hội thoại multi-turn (Session Memory).
    - `main.py`: FastAPI server cổng 8000 với CORS toàn diện, endpoints `/api/health`, `/api/chat`, `/api/chat/reset`, `/api/quick-prompts`.
    - `start.sh`: Kịch bản khởi chạy nhanh 1 chạm.
    - `test_ai_service.py`: 7/7 unit & integration tests PASS 100%.
  - **2. Giao diện Chat Widget Frontend React (`frontend/src/components/Chat/AIChatWidget.jsx`):**
    - Nút FAB nổi góc dưới phải màn hình với hiệu ứng glowing pulse và icon Sparkles.
    - Cửa sổ chat phong cách Mint Pastel (`#3CB371` / `#2E8B57`) đồng bộ thiết kế Zen CRM.
    - Thanh câu hỏi nhanh 1 chạm (Quick Prompts Carousel).
    - Bộ định dạng Markdown tích hợp (Headers, In đậm, Danh sách gạch đầu dòng, Bảng biểu, Mã code).
    - Trạng thái online/offline thời gian thực, nút làm mới phiên chat (`RotateCcw`).
    - Nhúng vào `MainLayout.jsx` hiển thị xuyên suốt trên toàn bộ trang của ứng dụng.
  - **3. Bằng chứng kiểm thử:**
    - AI Service Unit Tests: 7/7 tests PASS (0.055s).
    - Frontend Build: `vite build` 373ms, 0 lỗi.
    - Frontend Unit Tests: 112/112 unit tests PASS (117/117 flow tests PASS).
    - Backend Unit Tests: 146/146 tests PASS (31.3s).
    - API curl kiểm tra thực tế: Trả lời tự động gọi tool PostgreSQL thành công 100%.



- [x] **Cập Nhật Giao Diện Theo Bảng Màu Thương Hiệu Trong Ảnh (`feat-024`):**
  - **1. Hệ thống Style Tokens & Layout Core:**
    - [index.css](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/index.css): Định nghĩa Tailwind `@theme` với các biến màu chuẩn: `--color-brand: #3cb371`, `--color-brand-hover: #38a169`, `--color-brand-dark: #2e7d32`, `--color-brand-mint: #eaf5ec`, `--color-brand-mint-subtle: #ddf0e2`, `--color-dark-gray: #1f2937`, `--color-muted-gray: #6b7280`, `--color-light-gray: #f3f4f6`, `--color-accent-blue: #7ca5f5`, `--color-accent-purple: #5d3ebc`.
    - [MainLayout.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Layout/MainLayout.jsx): Nền ứng dụng chuyển sang dải Mint Pastel `bg-gradient-to-br from-[#EAF5EC] via-[#EAF5EC] to-[#DDF0E2] text-[#1F2937]`.
    - [Sidebar.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Layout/Sidebar.jsx): Menu active sử dụng `bg-[#3CB371] text-white shadow-md shadow-[#3CB371]/30`, logo icon gradient `from-[#3CB371] via-[#2E7D32] to-[#7CA5F5]`.
    - [Header.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Layout/Header.jsx): Header bar viền `border-[#DDF0E2]`, đồng hồ và badge phiên bảo mật nền `bg-[#EAF5EC] text-[#2E7D32] border-[#DDF0E2]`, nút gia hạn phiên `bg-[#3CB371] hover:bg-[#38A169]`.
  - **2. Core Components:**
    - [Modal.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Common/Modal.jsx): Hộp thoại bo góc viền `#DDF0E2`, header dialog nền `bg-[#EAF5EC]/70`, tiêu đề `#1F2937`, nút đóng hover `#DDF0E2`.
    - [Pagination.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Common/Pagination.jsx): Nút trang active `bg-[#3CB371] text-white font-bold`, nút phân trang viền `#DDF0E2` hover `#EAF5EC`.
    - [SearchInput.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Common/SearchInput.jsx): Nền ô tìm kiếm Light Gray `#F3F4F6`, viền `#DDF0E2`, focus ring `#3CB371`.
    - [ConfirmDialog.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Common/ConfirmDialog.jsx): Nút xác nhận `bg-[#3CB371] hover:bg-[#38A169]`.
  - **3. Phân Hệ Nghiệp Vụ & Bảng Điều Khiển:**
    - [Dashboard.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Dashboard/Dashboard.jsx): Banner chào mừng áp dụng Accent Gradient `bg-gradient-to-r from-[#7CA5F5] to-[#5D3EBC]`, nút Xem dữ liệu 1 năm & Thao tác nhanh chuyển sang Brand Green `#3CB371` / `#38A169`, toàn bộ viền thẻ `#DDF0E2`.
    - [LeadListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Leads/LeadListPage.jsx) & [LeadModal.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Leads/LeadModal.jsx): Nút "Thêm Khách Tiềm Năng", Flick switch và nút Lưu dùng `#3CB371`.
    - [OpportunityListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/OpportunityListPage.jsx) & [OpportunityModal.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/OpportunityModal.jsx): Nút thêm cơ hội và thẻ ước tính giá trị dùng `#3CB371` & nền Mint `#EAF5EC`.
    - [OrderListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Orders/OrderListPage.jsx): Nút chốt đơn và KPI cards đồng bộ viền `#DDF0E2` và icon `#3CB371`.
    - [ProductListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Products/ProductListPage.jsx): Nút thêm sản phẩm `#3CB371`, nút phân quyền hover `#EAF5EC`.
    - [Login.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Auth/Login.jsx): Trang đăng nhập nền Mint Gradient `#EAF5EC` -> `#DDF0E2`, logo thương hiệu và nút Đăng nhập `#3CB371`.
  - **4. Bằng chứng kiểm thử:**
    - `npm run build` trong `frontend/`: Hoàn thành xuất sắc trong 258ms, 0 lỗi.
    - `npm test` trong `frontend/`: 117/117 tests PASS 100%.lưu.
- Current status: HOÀN THÀNH 100% (263/263 tests PASS: 146 backend + 117 frontend, Vite client production build 282ms không lỗi). Sẵn sàng cho `feat-021` (Nghiệm thu E2E & Kịch bản bảo vệ).
- Branch / commit: `main`

- [x] **Nút Flick Tự Động Thêm Vào Cơ Hội Bán Hàng Khi Tạo Khách Hàng Tiềm Năng:**
  - **1. Frontend Client ([LeadModal.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Leads/LeadModal.jsx)):**
    - Tích hợp công tắc gạt Flick switch hiện đại ("Tự động thêm vào cơ hội bán hàng").
    - Khi bật nút Flick: Tự động mở rộng vùng chọn sản phẩm quan tâm (nạp danh sách từ `productApi.getProducts()`), nhập số lượng chốt kỳ vọng, thời hạn dự kiến chốt và tính toán trực tiếp giá trị cơ hội (`quantity * unit_price`).
    - Khi bấm lưu: Hệ thống tạo khách hàng tiềm năng trước (`leadApi.createLead()`), sau đó tự động gọi `oppApi.createOpportunity()` gắn kết với Lead ID vừa sinh trong cùng một lượt lưu.
  - **2. Thông báo & Điều hướng ([LeadListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Leads/LeadListPage.jsx)):**
    - Hiển thị banner thành công với nút bấm nhanh "Xem Danh Sách Cơ Hội" chuyển hướng tức thì sang `/opportunities`.
  - **3. Cải tiến Modal Phân Quyền Bán Hàng ([ProductAssignmentModal.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Products/ProductAssignmentModal.jsx)):**
    - Khắc phục xung đột dark-mode hệ thống và sửa nút Lưu Phân Quyền (`bg-indigo-600 hover:bg-indigo-700 text-white`).
  - **4. Bằng chứng kiểm thử:**
    - Frontend: 117/117 tests PASS (thêm 4 unit tests cho Flick toggle và form validation tại [leads-ui.test.js](file:///Users/zen/CNTT/Fullstack/internship/frontend/tests/leads-ui.test.js)).
    - Backend: 146/146 tests PASS 100%.
    - Production build: `vite build` 282ms, 0 lỗi, 0 warnings mới.

- [x] **Phân Quyền Sản Phẩm Bán Hàng Cho Nhân Viên & Tối Ưu Truy Vấn 1 Năm Mặc Định (`feat-022`):**
  - **1. CSDL PostgreSQL (`salesman_products`):**
    - Tạo bảng `salesman_products` (`id`, `user_id`, `product_id`, `assigned_by`, `assigned_at`) kèm ràng buộc `UNIQUE(user_id, product_id)` và Foreign Key liên kết `users` và `products` (cascade delete).
    - Đánh 2 indexes hiệu năng: `idx_salesman_products_user` và `idx_salesman_products_product`.
    - Cập nhật [schema.sql](file:///Users/zen/CNTT/Fullstack/internship/backend/src/database/schema.sql) và [seed.sql](file:///Users/zen/CNTT/Fullstack/internship/backend/seeds/seed.sql).
  - **2. Backend APIs & Controllers:**
    - [product.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/product.controller.js):
      - `getProducts`: Nếu `req.user.role === 'SALESMAN'`, tự động cô lập danh sách chỉ trả về các sản phẩm nhân viên được phân quyền qua `salesman_products`. Hỗ trợ thêm `assigned_user_id` và `for_salesman_id` cho Quản lý.
      - `getSalesmenList`: `GET /api/products/salesmen` trả về danh sách nhân viên Salesman kèm số lượng sản phẩm được gán (`assigned_products_count`).
      - `getSalesmanAssignments`: `GET /api/products/assignments/:userId` trả về mảng `assigned_product_ids`.
      - `updateSalesmanAssignments`: `PUT /api/products/assignments/:userId` cập nhật mảng sản phẩm được phân quyền với PostgreSQL Transaction ACID.
    - [product.routes.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/routes/product.routes.js): Đăng ký 3 endpoints phân quyền sản phẩm trước route `/:id`.
    - [opportunity.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/opportunity.controller.js): Chặn nhân viên Salesman tạo cơ hội cho sản phẩm chưa được phân quyền (trả về HTTP 403: "Bạn chưa được phân quyền bán sản phẩm này. Vui lòng liên hệ Quản lý bán hàng.").
    - **Tối ưu query 1 năm mặc định:**
      - [order.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/order.controller.js): Mặc định lọc `ord.order_date >= CURRENT_TIMESTAMP - INTERVAL '1 year'` khi không truyền ngày.
      - [opportunity.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/opportunity.controller.js): Mặc định lọc `o.created_at >= CURRENT_TIMESTAMP - INTERVAL '1 year'`.
      - [lead.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/lead.controller.js): Mặc định lọc `entered_date >= CURRENT_TIMESTAMP - INTERVAL '1 year'`.
      - [dashboard.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/dashboard.controller.js): Tối ưu truy vấn đếm và tính tổng doanh thu/cơ hội trong 1 năm gần nhất.
  - **3. Frontend Client & UI:**
    - [productApi.js](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/api/productApi.js): Bổ sung `getSalesmenList`, `getSalesmanAssignments`, `updateSalesmanAssignments`.
    - [ProductAssignmentModal.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Products/ProductAssignmentModal.jsx): Modal chuyên nghiệp cho Quản lý & Admin chọn Salesman, xem danh sách sản phẩm kèm checkbox, tìm kiếm nhanh theo mã/tên, lọc theo danh mục, nút "Chọn tất cả" / "Bỏ chọn" và Lưu phân quyền thời gian thực.
    - [ProductListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Products/ProductListPage.jsx): Thêm nút "Phân Quyền Bán Hàng" cho `SALE_MANAGER` và `ADMIN`.
    - Gắn badge thông báo tối ưu truy vấn 1 năm mặc định và hướng dẫn chọn ngày để tải thêm dữ liệu trên [OrderListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Orders/OrderListPage.jsx), [OpportunityListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/OpportunityListPage.jsx), [LeadListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Leads/LeadListPage.jsx).
  - **4. Bằng chứng kiểm thử:**
    - Backend: 146/146 tests PASS (thêm 3 test phân quyền và chặn salesman tại `product.test.js` & `opportunity.test.js`).
    - Frontend: 110/110 tests PASS (thêm 4 unit tests tại `products-ui.test.js`).
    - Frontend build: Vite production build thành công trong 814ms.

- [x] **Đồng Hồ Đếm Ngược Phiên Làm Việc Tự Động & Auto-Logout Sau 30 Phút Bất Hoạt (SRS 5.3, BR-11):**
  - **Khắc phục giao diện tĩnh "Phiên 30m" thành Đồng hồ Đếm ngược Thời gian thực:**
    - Hook [useIdleTimeout.js](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/hooks/useIdleTimeout.js): Theo dõi liên tục từng giây thời gian còn lại `totalRemainingSeconds` (1800s -> 00:00). Tự động reset về 30:00 khi người dùng di chuột/gõ phím (throttled 1s).
    - Context [AuthContext.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/context/AuthContext.jsx): Phân phối `formattedSessionTime`, `sessionRemainingSeconds`, `resetSessionTimer`, `setDemoTimeout` cho các component con.
    - Giao diện [Header.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Layout/Header.jsx):
      - Huy hiệu trên thanh Header hiển thị trực quan `Phiên: MM:SS` (ví dụ `Phiên: 29:59`).
      - Tự đổi màu cảnh báo (Xanh lam > 5p, Vàng cam 2 - 5p, Đỏ nhấp nháy < 2p).
      - Popover tương tác cho phép bấm "Gia hạn phiên (30:00)" hoặc "Thử nghiệm Auto-Logout (10s)" phục vụ trình chiếu/bảo vệ đồ án.
  - **Cơ chế Tự động Đăng xuất (Auto-Logout) khi hết 30 phút:**
    - Khi đồng hồ chạm mốc `00:00`: Hệ thống tự động xóa Token JWT & User data khỏi `localStorage`, phát thông báo cảnh báo bảo mật và chuyển hướng tức thì về `/login`.
    - Modal [TimeoutWarning.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/TimeoutWarning.jsx) xuất hiện cảnh báo khi còn 2 phút cuối.
  - **Kiểm thử:** Tạo mới [session-timeout.test.js](file:///Users/zen/CNTT/Fullstack/internship/frontend/tests/session-timeout.test.js) (6/6 tests pass). Tổng 106 frontend tests pass, 143 backend tests pass, build 381ms.

- [x] **Chuẩn hóa Ngày Giờ Toàn Hệ Thống & Khắc phục triệt để lỗi lệch múi giờ 7 tiếng (Timezone Offset):**
  - **Khắc phục lỗi 02:42 AM thay vì 09:42 AM:**
    - Frontend ([FollowUpModal.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/FollowUpModal.jsx)): Bỏ gọi `toISOString()` (chuyển sang UTC gây mất 7 tiếng). Sử dụng `formatLocalPayload` giữ nguyên chuỗi `YYYY-MM-DD HH:mm:ss`.
    - Backend ([opportunity.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/opportunity.controller.js)): Cập nhật câu lệnh insert timestamptz với `AT TIME ZONE 'Asia/Ho_Chi_Minh'`.
    - Backend ([order.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/order.controller.js)): Chuyển insert follow-up tự động từ `CURRENT_DATE` sang `CURRENT_TIMESTAMP`, ghi nhận chính xác từng giây tạo đơn.
    - PostgreSQL Type Parser ([db.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/config/db.js)): Đăng ký `types.setTypeParser(1082, val => val)` cho kiểu DATE, trả về đúng chuỗi YYYY-MM-DD, chống nhảy lùi ngày.
    - Centralized Utils ([dateUtils.js](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/utils/dateUtils.js)): Viết bộ hàm tiện ích `formatDate`, `formatDateTime` chuẩn hóa toàn frontend.
    - Đồng bộ hiển thị trên: [OpportunityDetailPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/OpportunityDetailPage.jsx), [OpportunityListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/OpportunityListPage.jsx), [OrderListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Orders/OrderListPage.jsx), [OrderDetailPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Orders/OrderDetailPage.jsx), [LeadListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Leads/LeadListPage.jsx), [LeadDetailPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Leads/LeadDetailPage.jsx), [CampaignListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Campaigns/CampaignListPage.jsx), [CampaignReportPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Campaigns/CampaignReportPage.jsx), [Dashboard.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Dashboard/Dashboard.jsx), [UserManagement.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Admin/UserManagement.jsx).
    - Cập nhật lại bản ghi ID 25 thành `09:42:00 21/10/2026`, ID 24 thành `09:15:00 21/10/2026` trong CSDL.
  - **Kiểm thử:** 143/143 backend tests pass, 100/100 frontend tests pass, build 327ms.

- [x] **Khắc phục lỗi "Không tìm thấy khách hàng" & Chuẩn hóa liên kết + Ngày giờ toàn hệ thống:**
  - **Sửa triệt để lỗi 404 Không tìm thấy khách hàng ([LeadDetailPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Leads/LeadDetailPage.jsx)):** Sửa lỗi data unboxing từ axiosClient, bổ sung link Chiến dịch & Sản phẩm liên kết, tiền tệ VNĐ và ngày giờ chuẩn Việt Nam.
  - **Widget Ngày Giờ Thời Gian Thực trên mọi trang ([Header.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Layout/Header.jsx)):** Chạy từng giây `Thứ ..., dd/MM/yyyy • HH:mm:ss`, hiển thị ở mọi kích thước màn hình.
  - **Chuẩn hóa liên kết chéo và ngày giờ trên tất cả các trang:**
    - Orders: [OrderDetailPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Orders/OrderDetailPage.jsx) (link cơ hội), [OrderListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Orders/OrderListPage.jsx) (link lead, product, ngày giờ formatDateTime).
    - Opportunities: [OpportunityDetailPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/OpportunityDetailPage.jsx) (link hóa đơn đơn hàng đã chốt), [OpportunityListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/OpportunityListPage.jsx) (link lead, product, opportunity).
    - Products: [ProductListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Products/ProductListPage.jsx) (link báo cáo chiến dịch), [ProductDetailPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Products/ProductDetailPage.jsx) (link cơ hội, đơn hàng).
    - Campaigns: [CampaignReportPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Campaigns/CampaignReportPage.jsx) (link sản phẩm), [CampaignListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Campaigns/CampaignListPage.jsx) (link báo cáo).
    - Dashboard: [Dashboard.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Dashboard/Dashboard.jsx) (link đơn hàng, lead, cơ hội, user, sản phẩm, chiến dịch; backend trả về IDs).
    - Báo cáo & Dự báo: [GeneralReportsPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Reports/GeneralReportsPage.jsx) (link sản phẩm và chiến dịch), [PerformanceReportPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Forecast/PerformanceReportPage.jsx) và [SetupPlanPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Forecast/SetupPlanPage.jsx) (chuẩn hóa nhãn VNĐ).
  - **Kiểm thử:** 143 backend tests pass, 100 frontend tests pass, build thành công 467ms.

- [x] **Sửa triệt để lỗi tính toán & hiển thị dữ liệu Báo cáo Chiến dịch Tiếp thị (Campaign Performance Report - SRS 3.19):**
  - **Khắc phục lỗi nhân chéo dòng (Cartesian Product) trong SQL:** Thay thế 3 LEFT JOIN lồng nhau bằng independent subqueries trong `backend/src/controllers/campaign.controller.js`, loại bỏ hoàn toàn việc nhân bản đơn hàng 39 lần làm vọt doanh thu lên 3.489.900.000 đ và ROI +5716.5%.
  - **Chuẩn hóa Tỷ lệ chuyển đổi (Conversion Rate):** Định nghĩa chuẩn Marketing/CRM: `(converted_leads / total_leads) * 100`, đạt 100% khi 2/2 leads chốt đơn, triệt tiêu lỗi 400%.
  - **Đồng bộ hóa 100% KPI tổng quan với Bảng chi tiết:**
    - Doanh thu: **506.800.000 đ** từ **5 đơn hàng** khớp 100% với Bảng Sản phẩm mục tiêu (1 đơn Fujinon 13.5M + 4 đơn Sony A7M4 493.3M).
    - ROI: **+744.67%** (tính từ ngân sách 60M).
    - Cơ hội bán hàng: **2** cơ hội khớp với 2 Leads trong chiến dịch.
    - Bổ sung dòng `<tfoot>` tổng cộng cho cả 2 bảng.
    - Bảo toàn `campaign_id` trong test suite `backend/tests/campaign.test.js`.
  - **Bằng chứng kiểm thử:**
    - Backend: 143/143 tests PASS 100%.
    - Frontend: 100/100 tests PASS 100%.
    - Frontend build: 546ms (0 lỗi).

- [x] **`feat-20`: Trích xuất hết dữ liệu từ Database cho toàn bộ trang giao diện & Tối ưu dữ liệu đến ngày 20/10/2026:**
  - **Khắc phục triệt để hiển thị Khách hàng tiềm năng & Cơ hội bán hàng:**
    - [LeadListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Leads/LeadListPage.jsx): Sửa lỗi bóc tách dữ liệu (`res.data.leads` -> đọc trực tiếp mảng `res.data` từ axiosClient), hỗ trợ đồng bộ bộ lọc ngày `from_date`/`startDate`. Danh sách hiển thị đầy đủ 20 khách hàng tiềm năng.
    - [OpportunityListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/OpportunityListPage.jsx): Sửa lỗi bóc tách (`res.data.data` -> `res.data`), hiển thị ngay lập tức 20 cơ hội bán hàng.
  - **Thu gọn Danh mục Sản phẩm thành ĐÚNG 5 Danh mục:**
    - Cập nhật [seed.sql](file:///Users/zen/CNTT/Fullstack/internship/backend/seeds/seed.sql) bảng `product_categories` thành 5 nhóm hàng tiêu chuẩn:
      1. *Đồ điện tử & Công nghệ* (Màn hình Dell, Bàn phím Logitech, SSD SanDisk, Máy in Xprinter...)
      2. *Máy ảnh & Thiết bị Studio* (Sony A7M4, Canon R6M2, Lens Fujinon, Flycam DJI, Gimbal, Đèn Godox...)
      3. *Phần mềm bản quyền & Giải pháp CRM* (Zen CRM Standard, Enterprise, Zen WMS...)
      4. *Thiết bị An ninh & Camera AI* (Camera AI Hanwha/ZenCam, Đầu ghi NVR Dahua, Tủ chống ẩm...)
      5. *Hạ tầng Mạng & Viễn thông* (Router DrayTek, Cloud VPS Server...)
    - 20 sản phẩm công nghệ được gắn lại `category_id` (1 -> 5) chuẩn xác.
  - **Mở rộng dòng thời gian đến ngày 20/10/2026 (Hiện tại):**
    - Phân bổ 25 đơn hàng trải đều từ **Tháng 1 đến Tháng 10/2026** (có đơn chốt đúng ngày hôm nay 20/10/2026): Bảng đối soát doanh số 12 tháng (`/forecast/performance`) hiển thị đầy đủ doanh số thực tế từ T1 -> T10 đạt từ 86% đến 137% chỉ tiêu, không còn bị 0đ hay 0% nữa.
    - Gán phần lớn Leads, Opportunities, Orders cho tài khoản nhân viên của bạn (`sale` - ID 3) và quản lý (`manager` - ID 2), giúp trang cá nhân và Dashboard hiển thị rực rỡ dữ liệu thực tế.
  - **Bằng chứng kiểm thử:**
    - Backend: **143/143 tests PASS 100%**.
    - Frontend: **100/100 tests PASS 100%**.
    - Frontend Build: Hoàn tất trong **875ms**, 0 lỗi.

- [x] **Nạp Dữ liệu Mẫu Toàn Diện từ `seed.sql` vào Cơ sở Dữ liệu Thực tế (`CRM`):**
  - **Khởi tạo và làm sạch chuẩn hóa:** Thực thi `seed.sql` thành công 100% vào database PostgreSQL `CRM` với đầy đủ 20 bản ghi chất lượng cho mỗi bảng nghiệp vụ:
    - `roles`: 3 bản ghi (`ADMIN`, `SALE_MANAGER`, `SALESMAN`)
    - `users`: 20 bản ghi (IDs 1 -> 20), chuẩn hóa mật khẩu `11111111` bằng hash bcrypt chuẩn 60 ký tự (`$2b$10$b5ORgei1knYoXLLX/s1D8.zlK1PJWpGluXDbaTUY5oUpZn.gJvxLy`). Cả 3 tài khoản chính (`admin`, `manager`, `sale`) đăng nhập thành công tuyệt đối cả bằng Username và Email.
    - `campaigns`: 20 chiến dịch tiếp thị
    - `product_categories`: 20 danh mục sản phẩm
    - `products`: 20 sản phẩm công nghệ (Máy ảnh, Camera AI, Ống kính...)
    - `leads`: 20 khách hàng tiềm năng
    - `opportunities`: 20 cơ hội bán hàng
    - `follow_ups`: 20 nhật ký chăm sóc khách hàng
    - `orders`: 20 đơn hàng đã xuất hóa đơn
    - `sale_forecasts`: 20 bản ghi kế hoạch dự báo doanh số
  - **Khắc phục Cleanup Hook trong Test Suite:** Sửa `backend/tests/user.test.js` để tránh xóa nhầm tài khoản gốc `admin` sau khi chạy test; hỗ trợ username `sale` đồng bộ trong `order.test.js`, `auth.test.js` và `login-flow.test.js`.
  - **Bằng chứng kiểm thử:**
    - Backend: **139/139 tests PASS 100%** (0 lỗi).
    - Frontend: **94/94 tests PASS 100%** (0 lỗi).
    - Frontend Build: `npm run build` thành công trong 498ms (0 lỗi).

- [x] **Cập nhật quyền hạn toàn diện cho Quản lý bán hàng (`SALE_MANAGER`) & Tối ưu giao diện Sidebar:**
  - **Cố định Sidebar khi cuộn trang dài (Sticky Sidebar):** Nâng cấp `<aside>` trong [Sidebar.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Layout/Sidebar.jsx) thành `lg:sticky lg:top-0 lg:h-screen lg:shrink-0`, đảm bảo thanh Sidebar luôn cố định 100% bên trái màn hình khi cuộn nội dung trang dài, phần danh mục menu cuộn độc lập (`overflow-y-auto`).
  - **Loại bỏ khối Quyền hạn:** Xóa bỏ hoàn toàn khối thẻ "QUYỀN HẠN" chiếm diện tích ở đáy Sidebar theo yêu cầu để giao diện gọn gàng, thoáng đãng.
  - **Mở khóa điều hướng & Route phân quyền:** Bổ sung `SALE_MANAGER` vào danh mục menu điều hướng [Sidebar.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Layout/Sidebar.jsx), route bảo vệ [AppRoutes.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/routes/AppRoutes.jsx), và các lối tắt nhanh tại [Dashboard.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Dashboard/Dashboard.jsx) cho cả 3 phân hệ cốt lõi: **Khách hàng tiềm năng (`/leads`)**, **Cơ hội bán hàng (`/opportunities`)** và **Đơn hàng (`/orders`)**.
  - **Mô tả vai trò `SALE_MANAGER`:** Cập nhật đồng bộ mô tả thành: *"Quản lý toàn diện: Khách hàng tiềm năng (Leads), Cơ hội bán hàng (Opportunities), Đơn hàng (Orders), Sản phẩm, Chiến dịch tiếp thị, Dự báo doanh số và Báo cáo thống kê"* trên Database PostgreSQL (bảng `roles`), file seed [seed.sql](file:///Users/zen/CNTT/Fullstack/internship/backend/seeds/seed.sql), bộ khởi tạo [init-db.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/database/init-db.js), tài liệu [db-schema.md](file:///Users/zen/CNTT/Fullstack/internship/docs/generated/db-schema.md) và đặc tả [roles-and-requirements.md](file:///Users/zen/CNTT/Fullstack/internship/docs/product-specs/roles-and-requirements.md).
  - **Giao diện Đăng nhập ([Login.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Auth/Login.jsx)):** Loại bỏ khối nút chọn nhanh tài khoản kiểm thử (Admin, Manager, Salesman) và hàm `handleQuickLogin`, cập nhật placeholder thành `"Email hoặc tên đăng nhập"`.

- [x] **`feat-019`: Frontend Màn hình Lập Kế hoạch & Dashboard Đối soát Doanh số (Dashboard UI theo SRS 3.20, 3.21, SRS 2.1, BR-07):**
  - **API Service Client:**
    - [frontend/src/api/forecastApi.js](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/api/forecastApi.js): Cung cấp các methods `setupPlan`, `getPlans`, `getPerformanceReport`, `getAvailableYears`.
  - **SetupPlanPage ([frontend/src/pages/Forecast/SetupPlanPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Forecast/SetupPlanPage.jsx) - `/forecast/setup`):**
    - Biểu mẫu nhập định mức doanh số 12 tháng theo bảng SRS 3.20 (`Month (1->12) | Value ($)`).
    - Hộp chọn năm tài chính linh hoạt (mặc định năm hiện hành và kế tiếp).
    - 3 thẻ KPI nhanh: Tổng chỉ tiêu năm, Mục tiêu trung bình/tháng, Phân bổ chi tiết 4 Quý (Q1-Q4).
    - Bộ công cụ phân bổ nhanh thông minh (Smart Allocation Tools): Chia đều tổng năm cho 12 tháng, Tăng trưởng +10%, +20%, Đặt lại về 0.
    - Bảng nhập 12 tháng trực quan kèm thanh phân bổ % tỷ trọng năm thời gian thực.
    - Lưu dữ liệu an toàn qua PostgreSQL Transaction ACID, thông báo kết quả thân thiện.
  - **PerformanceReportPage ([frontend/src/pages/Forecast/PerformanceReportPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Forecast/PerformanceReportPage.jsx) - `/forecast/performance`):**
    - Bảng đối soát 12 tháng chuẩn SRS 3.21: `Month | Plan ($) | Actually Value ($) | % Đạt`.
    - 5 Thẻ KPIs tổng kết cả năm: Kế hoạch (Plan $), Thực tế (Actually Value $) từ N đơn chốt, Tỷ lệ hoàn thành %, Chênh lệch Variance (đổi màu xanh/đỏ trực quan), Đánh giá tiến độ (Xuất sắc, Tăng trưởng tốt, Cần đẩy mạnh).
    - Biểu đồ trực quan hóa kết hợp (Mixed Bar & Line Chart) bằng Chart.js: Cột Kế hoạch (xanh dương), Cột Thực tế (xanh ngọc) và Đường Tỷ lệ hoàn thành % (vàng cam) với 2 trục Y độc lập.
    - Bảng số liệu chi tiết 12 tháng kèm badge đánh giá (Vượt chỉ tiêu / Đạt tốt / Đang tiến triển / Chưa đạt).
    - Layout In Báo Cáo chuyên nghiệp (`window.print()`): Tự động hiển thị tiêu đề báo cáo, ngày giờ in ấn và khu vực ký duyệt của Trưởng phòng kinh doanh & Ban Giám đốc.
  - **Cập nhật Định tuyến ([frontend/src/routes/AppRoutes.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/routes/AppRoutes.jsx)):**
    - Gắn `SetupPlanPage` và `PerformanceReportPage` vào `/forecast/setup` và `/forecast/performance` thay thế `PlaceholderPage`.
    - Tích hợp sẵn trong menu Sidebar và Header điều hướng.
  - **Kiểm thử Unit Tests:**
    - Viết 10 bài unit tests tại [frontend/tests/forecast-ui.test.js](file:///Users/zen/CNTT/Fullstack/internship/frontend/tests/forecast-ui.test.js).
    - Kết quả kiểm thử toàn hệ thống: **233/233 tests PASS 100%** (139 backend + 94 frontend).
    - Vite production client build thành công trong 268ms, 0 lỗi linter.

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
| Backend Test Suite | `npm test` (trong `backend/`) | PASS (143/143 tests passed) | `app.test.js` (2), `auth.test.js` (12), `db.test.js` (6), `forgot-password.test.js` (6), `user.test.js` (16), `lead.test.js` (15), `product.test.js` (18), `opportunity.test.js` (17), `order.test.js` (15), `campaign.test.js` (19), `forecast.test.js` (15), `dashboard.test.js` (4) |
| Frontend Test Suite | `npm test` (trong `frontend/`) | PASS (106/106 tests passed) | `admin-ui.test.js` (10) + `leads-ui.test.js` (10) + `login-flow.test.js` (5) + `opportunities-ui.test.js` (10) + `orders-ui.test.js` (12) + `products-ui.test.js` (10) + `session-timeout.test.js` (6) + `user-management.test.js` (10) + `campaigns-ui.test.js` (14) + `forecast-ui.test.js` (10) + `dashboard-ui.test.js` (6) |
| Frontend Lint | `npm run lint` (trong `frontend/`) | PASS (0 errors) | Oxlint kiểm tra toàn bộ files sạch sẽ 100% |
| Frontend Build | `npm run build` (trong `frontend/`) | PASS (built in 385ms) | Vite production client bundle hoàn tất |
| Full System Test | Toàn bộ kiểm thử | PASS (249/249 tests passed) | 100% tests PASS (143 backend + 106 frontend), không có bất kỳ regression nào |

## Next Steps

1. Triển khai tính năng cuối cùng của dự án: **`feat-021: Kiểm thử E2E Toàn diện, Nghiệm thu 100% SRS & Kịch bản Bảo vệ Đồ án`**:
   - Viết kịch bản kiểm thử liên vết toàn hệ thống (E2E User Journey Script):
     - **Bước 1 (Admin):** Đăng nhập Admin (`admin1` / `11111111`) -> Tạo tài khoản nhân viên mới hoặc quản lý danh sách -> Thử khóa/mở khóa/xóa tài khoản.
     - **Bước 2 (Manager):** Đăng nhập Manager (`manager1` / `11111111`) -> Tạo danh mục & sản phẩm mới (test chống trùng mã SP `product_code`) -> Tạo chiến dịch tiếp thị mới & gán sản phẩm -> Thiết lập chỉ tiêu kế hoạch 12 tháng (`/forecast/setup`).
     - **Bước 3 (Salesman):** Đăng nhập Salesman (`sale1` / `11111111`) -> Thêm Khách hàng tiềm năng mới (kiểm tra chống trùng lặp Lead BR-02) -> Tạo Cơ hội bán hàng liên kết Lead và Sản phẩm vừa tạo (kiểm tra chống trùng lặp cơ hội) -> Ghi nhật ký tư vấn chăm sóc Follow-up (đổi trạng thái cơ hội sang CONTACTED) -> Chốt đơn hàng Make Order (kiểm tra khóa dòng Row-level Lock, trừ tồn kho tự động, sinh mã đơn `ORD-YYYYMMDD-XXXX`).
     - **Bước 4 (Manager & Executive):** Manager đăng nhập lại -> Xem Dashboard và Báo cáo Đối soát Doanh số (`/forecast/performance`): Xác nhận số tiền đơn hàng vừa chốt tự động nhảy lên cột Thực tế (Actually Value $), tỷ lệ hoàn thành % và chênh lệch Variance được tính đúng 100% theo quy tắc BR-07.
   - Chuẩn bị tài liệu kịch bản demo bảo vệ đồ án thực tập chi tiết theo từng role để người dùng tự tin thuyết trình.
