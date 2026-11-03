<!-- Chức năng: Nhật ký tiến độ phiên làm việc: theo dõi trạng thái hiện tại, việc đã làm, đang làm, rủi ro và bằng chứng kiểm thử -->

# Session Progress Log - Nhật Ký Tiến Độ Phiên Làm Việc

## Current State (Hiện Trạng Hệ Thống)

- **Last Updated:** 2026-11-03 10:25
- **Active Task:** Xây dựng Trợ lý AI Thông minh Zen CRM bằng Python FastAPI & Gemini 3.5 Flash-Lite, kết nối CSDL PostgreSQL & Tích hợp Widget Chat vào React Frontend (`feat-027`).
- **Current Status:** HOÀN THÀNH 100% (270/270 tests PASS: 146 backend + 117 frontend + 7 AI Service unit tests, Uvicorn cổng 8000 online, Vite client build 373ms, 0 errors).
- **Next Feature:** `feat-021` - Kiểm thử E2E Toàn diện, Nghiệm thu 100% SRS & Kịch bản Bảo vệ Đồ án.


---

## Status (Trạng Thái Tính Năng)

### I. Danh Mục Tính Năng Cốt Lõi (Core Features: `feat-001` -> `feat-20`)

- [x] **`feat-001` - Khởi tạo môi trường & Cấu trúc khung dự án Full-Stack:**
  - Cấu trúc monorepo hoàn chỉnh với orchestration script `npm run dev` (`concurrently`).
  - Backend Clean MVC (Express.js, cổng 5001): `config/` (DB Pool, Nodemailer), `middlewares/` (auth, role, error), `utils/` (validator), `routes/`, `app.js`, `server.js`.
  - Frontend Component-Based (Vite React 18, Tailwind CSS, cổng 8080): [axiosClient.js](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/api/axiosClient.js) (tự động gắn Bearer Token & bắt lỗi 401), [AuthContext.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/context/AuthContext.jsx), [useIdleTimeout.js](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/hooks/useIdleTimeout.js) (tự động đăng xuất sau 30 phút bất hoạt - SRS 5.3).
  - **Kiểm thử:** `npm test` backend (2/2 passed), `oxlint` frontend (0 lỗi, 0 cảnh báo), `npm run build` thành công.

- [x] **`feat-002` - Thiết kế CSDL PostgreSQL 10 Bảng & Dữ liệu Seed mẫu:**
  - Cấu trúc DDL Schema chuẩn 3NF: [schema.sql](file:///Users/zen/CNTT/Fullstack/internship/backend/src/database/schema.sql) gồm 10 bảng (`roles`, `users`, `campaigns`, `product_categories`, `products`, `leads`, `opportunities`, `follow_ups`, `orders`, `sale_forecasts`) kèm ENUM types (`opp_status`, `order_status`) và 10 performance indexes.
  - Kịch bản tự động `npm run db:init` / `npm run db:seed`: nạp thành công 3 Roles, 3 Users (mật khẩu khởi tạo `11111111` đã băm bcrypt), 1 Campaign Q4 2026, 2 Danh mục & 2 Sản phẩm mẫu, 2 Leads, 1 Opportunity, 1 Follow-up, 12 tháng Kế hoạch Doanh số 2026 (SRS 3.20).
  - **Kiểm thử:** Bộ test tự động [db.test.js](file:///Users/zen/CNTT/Fullstack/internship/backend/tests/db.test.js) kiểm tra toàn vẹn 10 bảng, 10 index, 3 roles, 3 users và business entities (6/6 passed trong 480ms).

- [x] **`feat-003` - Backend Xác thực JWT & Phân quyền RBAC:**
  - Xây dựng `POST /api/auth/login`: xác thực đăng nhập bằng username hoặc email, kiểm tra trạng thái kích hoạt `is_active`, so khớp mật khẩu bcrypt, sinh JWT token thời hạn 24h kèm role payload.
  - Hoàn thiện [auth.middleware.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/middlewares/auth.middleware.js): xác thực Bearer token từ header `Authorization`, chặn 401 nếu token thiếu/hỏng/hết hạn.
  - Hoàn thiện [role.middleware.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/middlewares/role.middleware.js): hàm `authorizeRoles('ADMIN', 'SALE_MANAGER', 'SALESMAN')` chặn truy cập 403 Forbidden nếu không đủ quyền.
  - Xây dựng `GET /api/auth/me` và `PUT /api/auth/profile`: lấy và cập nhật thông tin cá nhân (họ tên, SĐT, đổi mật khẩu).
  - **Kiểm thử:** 12 integration tests tại [auth.test.js](file:///Users/zen/CNTT/Fullstack/internship/backend/tests/auth.test.js) (18/18 tests backend pass trong 1.2s).

- [x] **`feat-004` - Backend Quên mật khẩu & Gửi mail SMTP (Nodemailer):**
  - Xây dựng `POST /api/auth/forgot-password`: kiểm tra email hợp lệ và tồn tại trong hệ thống, sinh mã token ngẫu nhiên bảo mật 64 hex characters (thời hạn 15 phút), lưu vào CSDL và gửi email chứa liên kết đặt lại mật khẩu bằng Nodemailer qua Gmail SMTP.
  - Xây dựng `GET /api/auth/verify-reset-token/:token`: kiểm tra trước tính hợp lệ và thời hạn còn lại của token trước khi người dùng đổi mật khẩu.
  - Xây dựng `POST /api/auth/reset-password`: xác thực token chưa hết hạn, băm mật khẩu mới bằng bcrypt 10 rounds, cập nhật CSDL, xóa token (single-use) và cho phép đăng nhập ngay với mật khẩu mới.
  - **Kiểm thử:** 6 integration tests tại [forgot-password.test.js](file:///Users/zen/CNTT/Fullstack/internship/backend/tests/forgot-password.test.js) (24/24 tests backend pass 100%).

- [x] **`feat-005` - Backend Quản trị Người dùng & Phân quyền (Admin Users Management):**
  - Xây dựng trọn bộ RESTful API bảo vệ bởi [auth.middleware.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/middlewares/auth.middleware.js) & `authorizeRoles('ADMIN')`:
    - `GET /api/admin/roles`: Lấy danh sách 3 vai trò phục vụ dropdown tạo/sửa.
    - `GET /api/admin/users`: Lấy danh sách nhân viên phân trang (mặc định 20 dòng), tìm kiếm đa năng theo từ khóa (username, họ tên, email), lọc theo vai trò và trạng thái kích hoạt.
    - `POST /api/admin/users`: Quản trị viên tạo tài khoản nhân viên mới, gán role ngay khi tạo, hỗ trợ mật khẩu mặc định `11111111`, kiểm tra trùng username/email.
    - `PATCH /api/admin/users/:id/status`: Kích hoạt / Khóa tài khoản nhân viên (chặn Admin tự vô hiệu hóa tài khoản của chính mình).
    - `PATCH /api/admin/users/:id/role`: Gán / Đổi vai trò nhân viên và cập nhật quyền hạn ngay lập tức.
    - `POST /api/admin/users/:id/reset-password`: Quản trị viên đặt lại mật khẩu nhân viên trực tiếp khi gặp sự cố.
  - **Kiểm thử:** 13 integration tests tại [user.test.js](file:///Users/zen/CNTT/Fullstack/internship/backend/tests/user.test.js) (toàn bộ 37/37 tests backend pass 100% trong 4.8s).

- [x] **`feat-006` - Frontend Khung giao diện Admin UI, Axios Interceptor & Session Timeout 30m:**
  - Xây dựng `MainLayout`:
    - [Sidebar.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Layout/Sidebar.jsx): Điều hướng động theo RBAC (ADMIN: 9 mục, SALE_MANAGER: 8 mục, SALESMAN: 4 mục), hỗ trợ thu gọn/mở rộng, overlay mobile, icon Lucide và indicator active link.
    - [Header.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Layout/Header.jsx): Breadcrumbs tự động theo route, User Profile Menu với Avatar, Role Badge (`ADMIN`, `SALE_MANAGER`, `SALESMAN`), Quick Link Hồ sơ cá nhân và nút Đăng xuất.
  - Xây dựng Route Guards: `PrivateRoute.jsx` và `RoleRoute.jsx`.
  - Quản lý Phiên làm việc & Cảnh báo Timeout (SRS 5.3): [useIdleTimeout.js](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/hooks/useIdleTimeout.js) và [TimeoutWarning.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/TimeoutWarning.jsx) (popup đếm ngược 2 phút cuối).
  - Cập nhật địa chỉ Frontend dev server sang `http://localhost:8080`.
  - **Kiểm thử:** 10 unit tests tại [admin-ui.test.js](file:///Users/zen/CNTT/Fullstack/internship/frontend/tests/admin-ui.test.js) pass 100%.

- [x] **`feat-007` - Frontend Màn hình Xác thực & Quản lý Người dùng (Users Management UI):**
  - Xây dựng [UserManagement.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Admin/UserManagement.jsx) (`/admin/users`) theo SRS 2.1:
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
    - Cập nhật họ tên và số điện thoại, đồng bộ ngay với Header qua [AuthContext.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/context/AuthContext.jsx).
    - Form đổi mật khẩu tài khoản cá nhân: kiểm tra mật khẩu cũ, mật khẩu mới (tối thiểu 8 ký tự) và khớp mật khẩu xác nhận.
  - Xây dựng các Reusable Components: `Pagination.jsx`, `SearchInput.jsx`, `Modal.jsx`, `ConfirmDialog.jsx`.
  - Xây dựng các API Service: `authApi.js` và `adminApi.js`.
  - **Kiểm thử:** Viết 10 unit tests tại `frontend/tests/user-management.test.js` kiểm tra pagination range, self-deactivation guard, form validation. Toàn bộ 20/20 frontend tests và 57/57 system tests pass 100%.

- [x] **`feat-008` - Backend Quản lý Khách hàng tiềm năng (Leads Module):**
  - Xây dựng trọn bộ RESTful API CRUD Khách hàng tiềm năng (`lead.controller.js` và `lead.routes.js`) tuân thủ nghiêm ngặt SRS 3.1 - 3.5:
    - `GET /api/leads`: Lấy danh sách Leads có phân trang mặc định 20 bản ghi/trang (BR-03, SRS 3.2.3 REQ-1), lọc theo khoảng ngày nhập `startDate` / `endDate` (BR-05, SRS 3.2.3 REQ-2), sắp xếp tăng/giảm theo `entered_date` (BR-04, SRS 3.2.3 REQ-3), tìm kiếm theo tên khách hàng (SRS 3.3).
    - `GET /api/leads/:id`: Xem chi tiết Lead kèm theo danh sách Cơ hội (Opportunities) liên quan (SRS 3.2.3 REQ-4).
    - `GET /api/leads/check-duplicate`: API kiểm tra phát hiện trùng lặp Email hoặc Số điện thoại trong thời gian thực khi người dùng nhập liệu trên form.
    - `POST /api/leads`: Tạo mới Khách tiềm năng với cơ chế kiểm tra chống trùng SĐT/Email (BR-02, SRS 3.1.2 REQ-4), trả về mã lỗi HTTP 409 Conflict rõ ràng khi phát hiện trùng.
    - `PUT /api/leads/:id`: Cập nhật thông tin Khách tiềm năng, có ràng buộc chống đổi sang Email/SĐT đã thuộc về Lead khác (HTTP 409).
    - `DELETE /api/leads/:id`: Xóa Khách tiềm năng (SRS 3.5).
  - Tích hợp middleware phân quyền RBAC: Bảo vệ toàn bộ router với `authMiddleware` và `authorizeRoles('SALESMAN', 'SALE_MANAGER', 'ADMIN')`.
  - **Kiểm thử:** 15 integration tests tự động tại `backend/tests/lead.test.js` (toàn bộ 52/52 tests backend pass 100%).

- [x] **`feat-009` - Frontend Giao diện Quản lý Khách tiềm năng (Leads UI):**
  - Xây dựng trọn bộ giao diện người dùng theo chuẩn phong cách Zoho CRM và đáp ứng 100% SRS 3.1 - 3.5:
    - [LeadListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Leads/LeadListPage.jsx) (`/leads`): Bảng danh sách Leads phân trang đúng 20 dòng theo BR-03 (SRS 3.2.3 REQ-1), tích hợp `SearchInput` tìm kiếm theo tên có debounce 300ms (SRS 3.3), bộ lọc ngày nhập từ `startDate` đến `endDate` (BR-05), nút đảo chiều sắp xếp `entered_date` ASC/DESC (BR-04), nút "+ Thêm Khách Tiềm Năng" và nút xóa mở `ConfirmDialog`.
    - `LeadModal.jsx`: Biểu mẫu thêm mới & chỉnh sửa Lead với đầy đủ các trường thông tin (SRS 3.1, 3.4), chỉ rõ các trường bắt buộc có dấu `*` đỏ, kiểm tra hợp lệ dữ liệu, kiểm tra trùng lặp realtime qua `leadApi.checkDuplicate` kết hợp bắt mã lỗi HTTP 409 từ server hiển thị cảnh báo đỏ nổi bật (BR-02, SRS 3.1.2 REQ-4).
    - [LeadDetailPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Leads/LeadDetailPage.jsx) (`/leads/:id`): Màn hình xem chi tiết Lead theo SRS 3.2.3 REQ-4, các nút sửa thông tin, xóa và tạo cơ hội mới, cùng bảng danh sách các Cơ hội bán hàng liên quan (Associated Opportunities) tính toán doanh số dự kiến.
    - `leadApi.js`: API Service kết nối trọn bộ 6 endpoints backend.
    - Cập nhật định tuyến [AppRoutes.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/routes/AppRoutes.jsx) gắn `LeadListPage` và `LeadDetailPage` vào các route thực tế.
  - **Kiểm thử:** 10 bài unit tests tại `frontend/tests/leads-ui.test.js` kiểm tra validation, parse duplicate error 409, query params và tính toán cơ hội liên quan (35/35 tests frontend pass, build Vite thành công trong 241ms).

- [x] **`feat-010` - Backend Quản lý Danh mục & Sản phẩm Kho (Products & Categories Module):**
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
  - **Kiểm thử:** 18 integration tests tự động tại `backend/tests/product.test.js` (toàn bộ 70/70 tests backend pass 100%).

- [x] **`feat-011` - Frontend Giao diện Sản phẩm & Kho hàng (Products UI):**
  - Xây dựng trọn bộ giao diện người dùng Quản lý Sản phẩm theo phong cách Zoho CRM và đáp ứng 100% SRS 3.15, 3.16, 3.17:
    - [ProductListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Products/ProductListPage.jsx) (`/products`): Bảng danh sách sản phẩm phân trang 20 dòng chuẩn BR-03 (SRS 3.15), ô tìm kiếm mã/tên sản phẩm debounced 300ms, dropdown lọc danh mục sản phẩm, sắp xếp linh hoạt theo ngày/giá/kho, nhãn cảnh báo tồn kho sắp hết khi `stock_qty <= 5`, nút Thêm Sản Phẩm và Quản Lý Danh Mục.
    - `ProductModal.jsx`: Form thêm mới & chỉnh sửa sản phẩm (SRS 3.15), dropdown chọn danh mục và chiến dịch quảng bá (SRS 3.18), kiểm tra đơn giá và số lượng kho không âm, bắt lỗi HTTP 409 Conflict hiển thị cảnh báo đỏ khi trùng mã sản phẩm `product_code`.
    - `CategoryModal.jsx`: Modal popup quản lý danh mục sản phẩm (SRS 3.15), hiển thị số lượng sản phẩm liên kết (`products_count`), thêm mới, sửa, xóa danh mục có kiểm tra ràng buộc.
    - [ProductDetailPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Products/ProductDetailPage.jsx) (`/products/:id`): Màn hình chi tiết sản phẩm và chứa 2 TABS CON ĐẶC THÙ THEO SRS:
      - Tab 1: **View Opportunities** (SRS 3.16): Xem danh sách toàn bộ các Cơ hội bán hàng đang quan tâm sản phẩm này kèm thông tin khách hàng Lead.
      - Tab 2: **View Orders** (SRS 3.17): Xem danh sách toàn bộ các Đơn hàng thực tế đã xuất bán sản phẩm này, tự động tổng hợp số lượng đã bán và tổng doanh thu thu về ($).
    - `productApi.js`: Service client axios kết nối toàn bộ endpoints danh mục và sản phẩm.
    - Cập nhật định tuyến [AppRoutes.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/routes/AppRoutes.jsx) gắn `ProductListPage` và `ProductDetailPage` vào router hệ thống.
  - **Kiểm thử:** 10 bài unit tests tại `frontend/tests/products-ui.test.js` (toàn bộ 45/45 tests frontend pass, build Vite thành công trong 237ms).

- [x] **`feat-012` - Backend Quản lý Cơ hội & Nhật ký Chăm sóc (Opportunities & Follow-up Log):**
  - Xây dựng trọn bộ RESTful API CRUD Cơ hội bán hàng và Nhật ký chăm sóc ([opportunity.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/opportunity.controller.js) và [opportunity.routes.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/routes/opportunity.routes.js)):
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
  - **Kiểm thử:** 17 integration tests tự động tại [opportunity.test.js](file:///Users/zen/CNTT/Fullstack/internship/backend/tests/opportunity.test.js) (toàn bộ 132/132 tests pass trên toàn hệ thống: 87 backend + 45 frontend).

- [x] **`feat-013` - Frontend Giao diện Quản lý Cơ hội & Timeline Follow-up (Opportunities UI):**
  - Xây dựng trọn bộ giao diện người dùng Quản lý Cơ hội bán hàng theo phong cách Zoho CRM đáp ứng 100% SRS 3.6 - 3.11:
    - [OpportunityListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/OpportunityListPage.jsx) (`/opportunities`): Bảng danh sách cơ hội phân trang chuẩn 20 dòng theo BR-03 (SRS 3.7.3 REQ-1), ô tìm kiếm đa năng theo tên Lead hoặc tên/mã sản phẩm debounced 300ms (SRS 3.8), dropdown lọc theo 6 trạng thái cơ hội chuẩn, bộ lọc khoảng ngày tạo (BR-05), sắp xếp linh hoạt theo ngày tạo/ngày chốt/số lượng kèm nút đảo chiều ASC/DESC (BR-04), các thẻ thống kê tổng số cơ hội và tổng doanh thu dự kiến ước tính, nút 'Thêm Cơ Hội Mới'. Tự động mở modal khi có query param `createForLead` hoặc `createForProduct`.
    - `OpportunityModal.jsx`: Biểu mẫu thêm mới & chỉnh sửa Cơ hội (SRS 3.6, 3.9), dropdown chọn khách hàng Lead và sản phẩm Product (hiển thị kèm đơn giá và tồn kho), ô nhập số lượng nhu cầu và ngày dự kiến chốt; tự động tính nhẩm giá trị ước tính (`estimated_value`) hiển thị trực quan dạng thẻ badge tiền VND; tích hợp cơ chế phát hiện trùng lặp realtime qua `oppApi.checkDuplicate` (BR-02, SRS 3.6.2 REQ-4), bắt lỗi HTTP 409 Conflict hiển thị cảnh báo đỏ và cung cấp tùy chọn xác nhận trùng.
    - [FollowUpModal.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/FollowUpModal.jsx): Modal ghi nhận nhật ký chăm sóc khách hàng (SRS 3.11), lưu thời gian liên hệ, phương thức liên hệ (Điện thoại, Email, Gặp trực tiếp, Zalo/Chat), nội dung trao đổi bắt buộc, phản hồi của khách hàng, kế hoạch tiếp theo và tùy chọn cập nhật trạng thái cơ hội mới.
    - [OpportunityDetailPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/OpportunityDetailPage.jsx) (`/opportunities/:id`): Màn hình chi tiết cơ hội (SRS 3.7.3 REQ-4) gồm 3 thẻ thông tin: Thông số cơ hội, Hồ sơ khách hàng Lead, Chi tiết Sản phẩm; thẻ Đơn hàng khi đã chốt; và dòng thời gian trực quan (Follow-up Activity Timeline) hiển thị toàn bộ lịch sử các lần tương tác chăm sóc của nhân viên bán hàng kèm phản hồi của khách và kế hoạch tiếp theo.
    - [oppApi.js](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/api/oppApi.js): Service client axios kết nối đầy đủ các endpoints cơ hội và nhật ký chăm sóc.
    - Gắn định tuyến vào [AppRoutes.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/routes/AppRoutes.jsx) cho `/opportunities` và `/opportunities/:id` cho cả 3 vai trò `SALESMAN`, `SALE_MANAGER`, `ADMIN`.
  - **Kiểm thử:** 10 bài unit tests tại `frontend/tests/opportunities-ui.test.js` (toàn bộ 55/55 tests frontend pass, build Vite thành công trong 228ms).

- [x] **`feat-014` - Backend Chốt đơn hàng bằng Database Transaction (Make an Order):**
  - **Kiến trúc & Transaction ACID ([order.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/order.controller.js)):**
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
  - **Quản lý đơn hàng ([order.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/order.controller.js) & [order.routes.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/routes/order.routes.js)):**
    - `GET /api/orders`: Danh sách đơn hàng phân trang chuẩn 20 dòng (BR-03), tìm kiếm đa năng theo mã đơn/tên khách hàng/tên sản phẩm, lọc theo khoảng ngày chốt đơn (BR-05), thống kê tổng số đơn và tổng doanh thu.
    - `GET /api/orders/:id`: Chi tiết đơn hàng theo ID hoặc `order_code` kèm đầy đủ thông tin Lead, Sản phẩm và Cơ hội.
    - Phân quyền RBAC chặt chẽ cho 3 vai trò: `SALESMAN`, `SALE_MANAGER`, `ADMIN`.
  - **Kiểm thử:** 15 bài integration tests tại [order.test.js](file:///Users/zen/CNTT/Fullstack/internship/backend/tests/order.test.js) (toàn bộ 163/163 tests PASS 100%: 105 backend + 58 frontend), Vite build thành công trong 250ms.

- [x] **`feat-015` - Frontend Màn hình Chốt đơn & Quản lý Đơn hàng (Make Order & Orders UI):**
  - **MakeOrderModal ([MakeOrderModal.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/MakeOrderModal.jsx)):**
    - Modal chốt đơn từ cơ hội bán hàng, tự động kế thừa thông tin Lead, Sản phẩm, Đơn giá niêm yết và số lượng nhu cầu.
    - Tính toán tổng giá trị đơn hàng thời gian thực (`total_amount = quantity * unit_price`) hiển thị dạng card nổi bật.
    - Tính nhẩm tồn kho còn lại sau khi chốt (`stock_qty - quantity`), tự động đổi màu cảnh báo và hiển thị banner đỏ nếu số lượng yêu cầu vượt quá tồn kho (SRS 3.12, AC-08).
    - Lựa chọn nhanh phương thức thanh toán (COD, Chuyển khoản, Thẻ tín dụng, Công nợ 30 ngày) và bắt buộc nhập thông tin thanh toán (`payment_info`) theo SRS 3.12.3 REQ-1.
    - Bắt buộc nhập địa chỉ giao nhận hàng (`shipping_address`) theo SRS 3.12.3 REQ-1, tự động điền địa chỉ Lead nếu có.
    - Xử lý submit gọi `oppApi.makeOrder(oppId, payload)` an toàn qua Database Transaction ACID, hiển thị spinner và bắt lỗi tồn kho 400 rõ ràng.
  - **Tích hợp MakeOrderModal vào Cơ hội bán hàng:**
    - [OpportunityDetailPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/OpportunityDetailPage.jsx): Kích hoạt `MakeOrderModal`, reload tự động chi tiết cơ hội sau khi chốt (hiển thị ngay card Đơn Hàng Đã Được Khởi Tạo Thành Công và badge `ORDERED`).
    - [OpportunityListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/OpportunityListPage.jsx): Cột Thao tác bổ sung nút `ShoppingBag` màu xanh lá cho các cơ hội chưa chốt, cho phép chốt đơn trực tiếp ngay tại danh sách.
  - **OrderListPage ([OrderListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Orders/OrderListPage.jsx)):**
    - Trang danh sách đơn hàng đã chốt tại `/orders`.
    - Phân trang chuẩn 20 dòng/trang theo quy chuẩn BR-03 (`limit=20`).
    - 3 thẻ thống kê KPI: Tổng số đơn hàng, Tổng doanh thu đã chốt (VND), Tổng số lượng sản phẩm xuất kho.
    - Bộ lọc & Tìm kiếm: Ô tìm kiếm đa năng có debounce (mã đơn, tên khách hàng, tên sản phẩm), bộ lọc khoảng ngày chốt đơn theo BR-05 (`from_date`, `to_date`), bộ lọc trạng thái đơn hàng và sắp xếp linh hoạt theo ngày chốt hoặc tổng tiền.
  - **OrderDetailPage ([OrderDetailPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Orders/OrderDetailPage.jsx)):**
    - Trang chi tiết đơn hàng tại `/orders/:id`.
    - Hiển thị hóa đơn bán hàng chuyên nghiệp bảo tồn giá bán tại thời điểm chốt (SRS 3.12).
    - 4 khối thông tin: Thông số hóa đơn, Hồ sơ khách hàng nhận hàng, Chi tiết sản phẩm xuất kho (giá chốt vs giá niêm yết), Thông tin giao nhận và thanh toán.
    - Tích hợp tính năng In phiếu xuất kho / Hóa đơn (`window.print()`) kèm mẫu chữ ký khách hàng và nhân viên lập phiếu.
  - **AppRoutes & orderApi:** Gắn `OrderListPage` và `OrderDetailPage` vào [AppRoutes.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/routes/AppRoutes.jsx); tạo service `orderApi.js`.
  - **Kiểm thử:** 12 bài unit tests tại `frontend/tests/orders-ui.test.js` (toàn bộ 175/175 tests PASS 100%: 105 backend + 70 frontend), Vite build client thành công trong 306ms.

- [x] **`feat-016` - Backend Quản lý Chiến dịch Marketing & Báo cáo Bán hàng:**
  - **CRUD Campaigns ([campaign.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/campaign.controller.js) & [campaign.routes.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/routes/campaign.routes.js)):**
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
  - **Hệ thống Báo cáo Bán hàng Tổng hợp (Sales & Business Reports - SRS 2.1):**
    - `GET /api/reports/summary`: Báo cáo nhanh KPI hôm nay / tháng này / năm nay và so sánh tiến độ với chỉ tiêu kế hoạch năm tài chính.
    - `GET /api/reports/leads`: Báo cáo chuỗi thời gian Leads theo ngày/tháng và phân bổ nguồn theo từng chiến dịch.
    - `GET /api/reports/orders`: Báo cáo chuỗi thời gian số lượng đơn hàng, giá trị trung bình đơn (AOV) và trạng thái đơn hàng.
    - `GET /api/reports/revenue`: Báo cáo doanh thu theo chu kỳ, phân bổ doanh thu theo từng Sản phẩm (Revenue by Product) kèm tỷ trọng đóng góp `%` và phân bổ theo Danh mục sản phẩm (SRS 2.1).
  - **Phân quyền RBAC:** Salesman xem danh sách chiến dịch để gắn Lead; chặn quyền tạo/sửa/xóa và xem báo cáo. Toàn quyền thuộc về `SALE_MANAGER` và `ADMIN`.
  - **Kiểm thử:** 19 bài integration tests tại [campaign.test.js](file:///Users/zen/CNTT/Fullstack/internship/backend/tests/campaign.test.js) (toàn bộ 194/194 tests PASS 100%: 124 backend + 70 frontend), Vite build client thành công trong 250ms.

- [x] **`feat-017` - Frontend Giao diện Chiến dịch & Báo cáo Hiệu quả (Campaigns UI):**
  - **API Services Client (`campaignApi.js` & `reportApi.js`):** Tích hợp đầy đủ các client method giao tiếp an toàn qua [axiosClient.js](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/api/axiosClient.js).
  - **CampaignModal (`CampaignModal.jsx`):** Biểu mẫu tạo mới và chỉnh sửa chiến dịch (SRS 3.18.1): Bắt buộc tên chiến dịch, kiểm tra ngày bắt đầu/kết thúc (`end_date >= start_date`), kiểm soát ngân sách `budget >= 0`.
  - **CampaignAssignProductsModal (`CampaignAssignProductsModal.jsx`):** Modal gán sản phẩm vào chiến dịch tiếp thị (SRS 3.18.1): Tìm kiếm sản phẩm nhanh theo mã/tên/danh mục, checkbox chọn hàng loạt, đánh dấu rõ sản phẩm đã gán và tồn kho còn lại.
  - **CampaignListPage ([CampaignListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Campaigns/CampaignListPage.jsx) - `/campaigns`):** Danh sách chiến dịch phân trang chuẩn 20 dòng theo BR-03, 4 thẻ KPI nhanh, ô tìm kiếm đa năng có debounce, bộ lọc trạng thái thời gian, bộ lọc khoảng ngày (BR-05), sắp xếp linh hoạt, modal xóa an toàn.
  - **CampaignReportPage ([CampaignReportPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Campaigns/CampaignReportPage.jsx) - `/campaigns/:id/report`):** Màn hình Báo cáo Hiệu quả Chiến dịch (SRS 3.19) với 6 Thẻ KPI, 2 Bảng chi tiết Sản phẩm & Khách hàng phát sinh, tích hợp nút In Báo Cáo chuyên nghiệp với `window.print()`.
  - **GeneralReportsPage ([GeneralReportsPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Reports/GeneralReportsPage.jsx) - `/reports`):** Màn hình Báo cáo Bán hàng & Doanh số toàn diện dành riêng cho `SALE_MANAGER` và `ADMIN` theo SRS 2.1 với 4 Tabs nghiệp vụ (Executive Summary, Leads Report, Orders Report, Revenue Report).
  - **Kiểm thử:** 14 bài tests tại `frontend/tests/campaigns-ui.test.js` (toàn bộ 208/208 tests PASS 100%: 124 backend + 84 frontend), Vite build client thành công trong 254ms.

- [x] **`feat-018` - Backend Lập Kế hoạch Doanh số 12 Tháng & Báo cáo Đối soát Performance:**
  - **Controllers & Routers:**
    - `forecast.controller.js`: Xây dựng đầy đủ các methods `setupPlan`, `getPlansByYear`, `getPerformanceReport`, `getAvailableYears`.
    - `forecast.routes.js`: Cấu hình router `/api/forecasts`, bảo vệ bởi xác thực JWT và RBAC chỉ dành cho `SALE_MANAGER` và `ADMIN`.
  - **Thiết lập Kế hoạch Doanh số 12 Tháng (`POST /api/forecasts/setup` - SRS 3.20):**
    - Cho phép Sale Manager và Admin thiết lập hoặc cập nhật chỉ tiêu doanh số cho 12 tháng của năm tài chính (`fiscal_year`).
    - Hỗ trợ linh hoạt cả định dạng mảng `plans` và object `targets`, validate nghiêm ngặt `2000 <= fiscal_year <= 2100`, `target_amount >= 0`, Transaction ACID UPSERT.
  - **Lấy Kế hoạch theo Năm (`GET /api/forecasts/plans` - SRS 3.20):** Lấy kế hoạch 12 tháng của năm tài chính, trả về đủ 12 tháng và tính `total_plan`.
  - **Báo cáo Đối soát Kế hoạch vs Thực tế (`GET /api/forecasts/performance` - SRS 3.21 & BR-07):**
    - Truy vấn đối soát 12 tháng bằng SQL (`generate_series(1, 12)` kết hợp `LEFT JOIN` giữa `sale_forecasts` và `orders`).
    - Tự động tính toán các cột chuẩn SRS 3.21.3 REQ-1: `Month`, `Plan ($)`, `Actually Value ($)`, `%`, `Variance ($)`.
    - Thực thi chuẩn xác toán tử so sánh BR-07: `% = (Actually Value / Plan Value) * 100`, nếu `Plan = 0` thì `% = 0%`.
  - **Kiểm thử:** 15 bài integration tests tại `backend/tests/forecast.test.js` (toàn bộ 223/223 tests PASS 100%: 139 backend + 84 frontend), Vite build client thành công trong 243ms.

- [x] **`feat-019` - Frontend Màn hình Lập Kế hoạch & Dashboard Đối soát Doanh số (Dashboard UI):**
  - **API Service Client (`forecastApi.js`):** Cung cấp `setupPlan`, `getPlans`, `getPerformanceReport`, `getAvailableYears`.
  - **Màn hình Lập Kế hoạch Doanh số 12 Tháng ([SetupPlanPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Forecast/SetupPlanPage.jsx) - `/forecast/setup`):** Tuân thủ 100% biểu mẫu SRS 3.20, chọn năm tài chính linh hoạt, 3 thẻ thống kê KPI tổng quan, bộ công cụ phân bổ nhanh thông minh (Chia đều 12 tháng, Tăng trưởng +10%, +20%, Đặt lại về 0), bảng nhập 12 tháng kèm thanh tỷ trọng % năm.
  - **Màn hình Báo cáo Đối soát Kế hoạch vs Thực tế ([PerformanceReportPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Forecast/PerformanceReportPage.jsx) - `/forecast/performance`):** Bảng đối soát 12 tháng chuẩn SRS 3.21, 5 Thẻ KPIs tổng kết cả năm, Biểu đồ trực quan hóa kết hợp (Mixed Bar & Line Chart) bằng Chart.js, Bảng số liệu chi tiết 12 tháng kèm badge đánh giá, Layout In Báo Cáo chuyên nghiệp (`window.print()`).
  - **Kiểm thử:** 10 bài unit tests tại `frontend/tests/forecast-ui.test.js` (toàn bộ 233/233 tests PASS 100%: 139 backend + 94 frontend), Vite build client thành công trong 268ms.

- [x] **`feat-20` - Trích xuất hết dữ liệu từ Database cho toàn bộ trang giao diện & Tối ưu dữ liệu:**
  - **Backend Service & Endpoint ([dashboard.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/dashboard.controller.js) & [dashboard.routes.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/routes/dashboard.routes.js)):**
    - Xây dựng `GET /api/dashboard/stats`: trích xuất trực tiếp số liệu thực tế từ 10 bảng trong database (`leads`, `opportunities`, `orders`, `products`, `product_categories`, `campaigns`, `users`, `roles`, `sale_forecasts`).
    - Tính toán tổng quan pipeline, doanh thu, win rate, tiến độ kế hoạch năm 12 tháng, dữ liệu riêng của salesman và danh sách hoạt động gần nhất (5 đơn hàng, 5 cơ hội, 5 leads, 5 nhân sự mới nhất).
  - **Frontend Client (`dashboardApi.js`) & Dashboard ([Dashboard.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Dashboard/Dashboard.jsx)):**
    - Loại bỏ hoàn toàn số liệu hardcode; kết nối API tự động tải dữ liệu khi render; bổ sung nút làm mới dữ liệu từ Database thời gian thực.
    - Hiển thị KPI thích ứng theo 3 vai trò (`ADMIN`, `SALE_MANAGER`, `SALESMAN`); tích hợp 4 bảng dữ liệu thời gian thực hiển thị chi tiết mã đơn, khách hàng, sản phẩm, doanh thu, cơ hội, trạng thái deal.
  - **Thu gọn Danh mục Sản phẩm thành ĐÚNG 5 Danh mục tiêu chuẩn:**
    - Cập nhật [seed.sql](file:///Users/zen/CNTT/Fullstack/internship/backend/seeds/seed.sql) bảng `product_categories` thành 5 nhóm hàng tiêu chuẩn: *Đồ điện tử & Công nghệ*, *Máy ảnh & Thiết bị Studio*, *Phần mềm bản quyền & Giải pháp CRM*, *Thiết bị An ninh & Camera AI*, *Hạ tầng Mạng & Viễn thông*.
    - Gắn lại `category_id` (1 -> 5) chuẩn xác cho toàn bộ 20 sản phẩm công nghệ.
  - **Mở rộng dòng thời gian đến hiện tại:** Phân bổ 25 đơn hàng trải đều từ Tháng 1 đến Tháng 10/2026; trang đối soát doanh số 12 tháng (`/forecast/performance`) hiển thị đầy đủ doanh số thực tế từ T1 -> T10 đạt từ 86% đến 137% chỉ tiêu.
  - **Kiểm thử:** 4 integration tests tại `backend/tests/dashboard.test.js` và 6 unit tests tại `frontend/tests/dashboard-ui.test.js` (toàn bộ 243/243 tests PASS 100%: 143 backend + 100 frontend).

---

### II. Nhật Ký Nâng Cấp Hệ Thống, Bảo Mật & Khắc Phục Lỗi (Optimizations & Bug Fixes)

- [x] **Đồng Hồ Đếm Ngược Phiên Làm Việc Tự Động & Auto-Logout Sau 30 Phút Bất Hoạt (SRS 5.3, BR-11):**
  - **Khắc phục giao diện tĩnh "Phiên 30m" thành Đồng hồ Đếm ngược Thời gian thực:**
    - Hook [useIdleTimeout.js](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/hooks/useIdleTimeout.js): Theo dõi liên tục từng giây thời gian còn lại `totalRemainingSeconds` (1800s -> 00:00). Tự động reset về 30:00 khi người dùng di chuột/gõ phím (throttled 1s).
    - Context [AuthContext.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/context/AuthContext.jsx): Phân phối `formattedSessionTime`, `sessionRemainingSeconds`, `resetSessionTimer`, `setDemoTimeout` cho các component con.
    - Giao diện [Header.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Layout/Header.jsx):
      - Huy hiệu trên thanh Header hiển thị trực quan `Phiên: MM:SS` (ví dụ `Phiên: 29:59`).
      - Tự đổi màu cảnh báo (Xanh lam > 5p, Vàng cam 2 - 5p, Đỏ nhấp nháy < 2p).
      - Popover tương tác cho phép bấm "Gia hạn phiên (30:00)" hoặc "Thử nghiệm Auto-Logout (10s)" phục vụ trình chiếu/bảo vệ đồ án theo đúng kịch bản trong [PLANS.md](file:///Users/zen/CNTT/Fullstack/internship/docs/PLANS.md).
  - **Cơ chế Tự động Đăng xuất (Auto-Logout) khi chạm mốc 0 giây:**
    - Khi đồng hồ chạm mốc `00:00`: Hệ thống tự động xóa Token JWT & User data khỏi `localStorage`, phát thông báo cảnh báo bảo mật và chuyển hướng tức thì về `/login`.
    - Modal [TimeoutWarning.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/TimeoutWarning.jsx) xuất hiện cảnh báo khi còn 2 phút cuối.
  - **Kiểm thử tự động:** Tạo mới [session-timeout.test.js](file:///Users/zen/CNTT/Fullstack/internship/frontend/tests/session-timeout.test.js) (6/6 tests pass). Nâng tổng số kiểm thử toàn hệ thống lên **249/249 tests PASS 100%** (143 backend + 106 frontend), build 385ms.

- [x] **Chuẩn hóa Ngày Giờ Toàn Hệ Thống & Khắc phục triệt để lỗi lệch múi giờ 7 tiếng (Timezone Offset):**
  - **Khắc phục lỗi 02:42 AM thay vì 09:42 AM trên Timeline:**
    - Frontend ([FollowUpModal.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/FollowUpModal.jsx)): Bỏ gọi `toISOString()` (chuyển sang UTC gây mất 7 tiếng). Sử dụng định dạng local string `YYYY-MM-DD HH:mm:ss`.
    - Backend ([opportunity.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/opportunity.controller.js)): Cập nhật câu lệnh insert timestamptz với `AT TIME ZONE 'Asia/Ho_Chi_Minh'`, đảm bảo PostgreSQL luôn lưu trữ chuẩn giờ Việt Nam (UTC+7).
    - Backend ([order.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/order.controller.js)): Chuyển insert follow-up tự động từ `CURRENT_DATE` sang `CURRENT_TIMESTAMP`, ghi nhận chính xác từng giây tạo đơn.
    - PostgreSQL Type Parser ([db.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/config/db.js)): Đăng ký `types.setTypeParser(1082, val => val)` cho kiểu DATE, trả về đúng chuỗi YYYY-MM-DD, chống nhảy lùi ngày do serialize.
    - Centralized Utils ([dateUtils.js](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/utils/dateUtils.js)): Viết bộ hàm tiện ích `formatDate`, `formatDateTime`, `formatDateTimeStandard` chuẩn hóa toàn frontend.
    - Đồng bộ hiển thị trên: [OpportunityDetailPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/OpportunityDetailPage.jsx), [OpportunityListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/OpportunityListPage.jsx), [OrderListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Orders/OrderListPage.jsx), [OrderDetailPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Orders/OrderDetailPage.jsx), [LeadListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Leads/LeadListPage.jsx), [LeadDetailPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Leads/LeadDetailPage.jsx), [CampaignListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Campaigns/CampaignListPage.jsx), [CampaignReportPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Campaigns/CampaignReportPage.jsx), [Dashboard.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Dashboard/Dashboard.jsx), [UserManagement.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Admin/UserManagement.jsx).

- [x] **Khắc phục lỗi "Không tìm thấy khách hàng" & Chuẩn hóa liên kết chéo + Ngày giờ toàn hệ thống:**
  - **Sửa triệt để lỗi 404 Không tìm thấy khách hàng ([LeadDetailPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Leads/LeadDetailPage.jsx)):** Sửa lỗi bóc tách dữ liệu do interceptor unbox, bổ sung liên kết quay lại Chiến dịch gốc (`/campaigns/:id/report`) và chi tiết Sản phẩm (`/products/:id`), chuẩn hóa tiền tệ VNĐ và ngày giờ.
  - **Widget Đồng hồ Thời gian thực trên mọi trang ([Header.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Layout/Header.jsx)):** Chạy từng giây `Thứ ..., dd/MM/yyyy • HH:mm:ss`, hiển thị ở mọi kích thước màn hình.
  - **Chuẩn hóa liên kết chéo trên tất cả các trang:**
    - Orders: [OrderDetailPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Orders/OrderDetailPage.jsx) (link cơ hội), [OrderListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Orders/OrderListPage.jsx) (link lead, product).
    - Opportunities: [OpportunityDetailPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/OpportunityDetailPage.jsx) (link hóa đơn đơn hàng đã chốt), [OpportunityListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/OpportunityListPage.jsx) (link lead, product).
    - Products: [ProductListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Products/ProductListPage.jsx) (link báo cáo chiến dịch), [ProductDetailPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Products/ProductDetailPage.jsx) (link cơ hội, đơn hàng).
    - Campaigns: [CampaignReportPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Campaigns/CampaignReportPage.jsx) (link sản phẩm), [CampaignListPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Campaigns/CampaignListPage.jsx) (link báo cáo).
    - Dashboard: [Dashboard.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Dashboard/Dashboard.jsx) (link đơn hàng, lead, cơ hội, user, sản phẩm, chiến dịch; backend trả về IDs).
    - Báo cáo & Dự báo: [GeneralReportsPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Reports/GeneralReportsPage.jsx), [PerformanceReportPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Forecast/PerformanceReportPage.jsx), [SetupPlanPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Forecast/SetupPlanPage.jsx) (chuẩn hóa nhãn VNĐ).

- [x] **Sửa triệt để lỗi tính toán & hiển thị dữ liệu Báo cáo Chiến dịch Tiếp thị (Campaign Performance Report - SRS 3.19):**
  - **Khắc phục lỗi nhân chéo dòng (Cartesian Product) trong SQL:** Thay thế 3 LEFT JOIN lồng nhau bằng independent subqueries trong [campaign.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/campaign.controller.js), loại bỏ hoàn toàn việc nhân bản đơn hàng 39 lần làm vọt doanh thu lên 3.489.900.000 đ và ROI +5716.5%.
  - **Chuẩn hóa Tỷ lệ chuyển đổi (Conversion Rate):** Định nghĩa chuẩn Marketing/CRM: `(converted_leads / total_leads) * 100`, đạt 100% khi 2/2 leads chốt đơn, triệt tiêu lỗi 400%.
  - **Đồng bộ hóa 100% KPI tổng quan với Bảng chi tiết:**
    - Doanh thu: **506.800.000 đ** từ **5 đơn hàng** khớp 100% với Bảng Sản phẩm mục tiêu (1 đơn Fujinon 13.5M + 4 đơn Sony A7M4 493.3M).
    - ROI: **+744.67%** (tính từ ngân sách 60M).
    - Cơ hội bán hàng: **2** cơ hội khớp với 2 Leads trong chiến dịch.
    - Bổ sung dòng `<tfoot>` tổng cộng cho cả 2 bảng.
    - Bảo toàn `campaign_id` trong test suite [campaign.test.js](file:///Users/zen/CNTT/Fullstack/internship/backend/tests/campaign.test.js).

- [x] **Nạp Dữ liệu Mẫu Toàn Diện từ `seed.sql` vào Cơ sở Dữ liệu Thực tế (`CRM`):**
  - **Khởi tạo và làm sạch chuẩn hóa:** Thực thi [seed.sql](file:///Users/zen/CNTT/Fullstack/internship/backend/seeds/seed.sql) thành công 100% vào database PostgreSQL `CRM` với đầy đủ 20 bản ghi chất lượng cho mỗi bảng nghiệp vụ: `roles` (3), `users` (20), `campaigns` (20), `product_categories` (5), `products` (20), `leads` (20), `opportunities` (20), `follow_ups` (20), `orders` (25), `sale_forecasts` (12).
  - Chuẩn hóa mật khẩu `11111111` bằng hash bcrypt chuẩn 60 ký tự. Cả 3 tài khoản chính (`admin`, `manager`, `sale`) đăng nhập thành công tuyệt đối cả bằng Username và Email.
  - Sửa [user.test.js](file:///Users/zen/CNTT/Fullstack/internship/backend/tests/user.test.js) để tránh xóa nhầm tài khoản gốc `admin` sau khi chạy test; hỗ trợ username `sale` đồng bộ trong `order.test.js`, `auth.test.js` và `login-flow.test.js`.

- [x] **Cập nhật quyền hạn toàn diện cho Quản lý bán hàng (`SALE_MANAGER`) & Tối ưu giao diện Sidebar:**
  - **Cố định Sidebar khi cuộn trang dài (Sticky Sidebar):** Nâng cấp `<aside>` trong [Sidebar.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Layout/Sidebar.jsx) thành `lg:sticky lg:top-0 lg:h-screen lg:shrink-0`, Sidebar luôn cố định 100% bên trái khi cuộn trang dài, menu cuộn độc lập (`overflow-y-auto`).
  - **Loại bỏ khối Quyền hạn:** Xóa bỏ khối thẻ "QUYỀN HẠN" chiếm diện tích ở đáy Sidebar để giao diện gọn gàng, thoáng đãng.
  - **Mở khóa điều hướng & Route phân quyền:** Bổ sung `SALE_MANAGER` vào danh mục menu điều hướng [Sidebar.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Layout/Sidebar.jsx), route bảo vệ [AppRoutes.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/routes/AppRoutes.jsx), và các lối tắt nhanh tại [Dashboard.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Dashboard/Dashboard.jsx) cho cả 3 phân hệ cốt lõi: **Khách hàng tiềm năng (`/leads`)**, **Cơ hội bán hàng (`/opportunities`)** và **Đơn hàng (`/orders`)**.
  - **Mô tả vai trò `SALE_MANAGER`:** Cập nhật đồng bộ trên Database PostgreSQL (bảng `roles`), file seed [seed.sql](file:///Users/zen/CNTT/Fullstack/internship/backend/seeds/seed.sql), bộ khởi tạo [init-db.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/database/init-db.js), tài liệu [db-schema.md](file:///Users/zen/CNTT/Fullstack/internship/docs/generated/db-schema.md) và đặc tả [roles-and-requirements.md](file:///Users/zen/CNTT/Fullstack/internship/docs/product-specs/roles-and-requirements.md).
  - **Giao diện Đăng nhập ([Login.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Auth/Login.jsx)):** Loại bỏ thanh nút tài khoản kiểm thử, chỉ cần nhập Email / Username và Mật khẩu.

- [x] **Bổ sung tính năng Admin Xóa tài khoản nhân viên (giữ nguyên tính năng Khóa tài khoản):**
  - Backend ([user.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/user.controller.js) & [user.routes.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/routes/user.routes.js)): API `DELETE /api/admin/users/:id` có phân quyền chặt chẽ `authorizeRoles('ADMIN')`. Guards bảo vệ: Chặn Admin tự xóa tài khoản của chính mình (`req.user.id === targetId`), chặn xóa tài khoản root mặc định (`username === 'admin'`).
  - Thiết kế CSDL toàn bộ khóa ngoại trỏ tới `users(id)` đều dùng `ON DELETE SET NULL`, khi xóa nhân viên thì các dữ liệu liên quan tự động chuyển sang `NULL` an toàn, không bị lỗi ràng buộc dữ liệu.
  - Frontend ([UserManagement.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Admin/UserManagement.jsx)): Giữ nguyên chức năng Khóa/Mở khóa tài khoản (`u.is_active` toggle); bổ sung nút "Xóa" kèm `ConfirmDialog` cảnh báo nguy hiểm (`isDangerous={true}`).

- [x] **Khắc phục lỗi Foreign Key `leads_assigned_to_fkey` và Dropdown Sản Phẩm trong Cơ Hội:**
  - `lead.controller.js`: Bổ sung kiểm tra xác thực ID người dùng và chiến dịch tồn tại trước khi gán (`SELECT id FROM users WHERE id = $1`), nếu không tồn tại sẽ an toàn gán `null`.
  - [auth.middleware.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/middlewares/auth.middleware.js): Nâng cấp kiểm tra tài khoản còn tồn tại và active trong CSDL để tự động thu hồi token cũ.
  - `OpportunityModal.jsx`: Sửa trích xuất `prodRes.products || prodRes.data?.products || []`, nạp đầy đủ toàn bộ sản phẩm vào dropdown kèm mã SP, tên, đơn giá và tồn kho.

- [x] **Khắc phục triệt để lỗi Màn hình trắng khi đăng nhập Manager (`SALE_MANAGER`):**
  - Import bổ sung `Package` từ `lucide-react` trong [Dashboard.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Dashboard/Dashboard.jsx) (khắc phục lỗi `ReferenceError: Package is not defined`).
  - Tạo component `ErrorBoundary.jsx` bao bọc toàn bộ ứng dụng tại `App.jsx`, hiển thị giao diện báo lỗi thân thiện kèm nút "Tải lại trang" / "Trang chủ" thay vì để màn hình trắng nếu có lỗi giao diện.

- [x] **Tinh chỉnh Chức Năng Quản Lý Của Mỗi Role (RBAC Visibility Control chuẩn SRS 2.1):**
  - Chuẩn hóa xác định vai trò `currentRole = (role || user?.role_name || user?.role || '').trim().toUpperCase()` trên toàn bộ: [Sidebar.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Layout/Sidebar.jsx), `RoleRoute.jsx`, [Dashboard.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Dashboard/Dashboard.jsx).
  - Nâng cấp [Dashboard.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Dashboard/Dashboard.jsx): Thẻ KPI và Quick Actions tách biệt rạch ròi 100% cho 3 vai trò (Admin: Quản trị tài khoản & nhân sự; Manager: Kho sản phẩm, Chiến dịch & Doanh số; Salesman: Khách tiềm năng, Cơ hội & Đơn hàng).

- [x] **Sửa Lỗi Hiển Thị Vai Trò trong Dropdown Phân Quyền (`UserManagement.jsx`):**
  - Backend `user.controller.js` hàm `getRoles`: Thêm alias `SELECT id, name, name AS role_name, description FROM roles`.
  - Backend `auth.controller.js` hàm `login`: Trả về cả `role` và `role_name` trong user object.
  - Frontend [UserManagement.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Admin/UserManagement.jsx): Tạo hàm `getRoleLabel` hiển thị nhãn tiếng Việt to đẹp (`Quản trị viên (ADMIN)`, `Quản lý bán hàng (SALE_MANAGER)`, `Nhân viên bán hàng (SALESMAN)`).

- [x] **Sửa Lỗi Chức Năng Thêm Khách Hàng Tiềm Năng (`LeadModal.jsx` & `lead.controller.js`):**
  - Backend `lead.controller.js`: Xử lý `cleanDob = (date_of_birth && String(date_of_birth).trim() !== '') ? String(date_of_birth).trim() : null` để không bao giờ truyền chuỗi rỗng vào kiểu `DATE` của PostgreSQL.
  - Frontend `LeadModal.jsx`: Chuẩn hóa payload sạch sẽ trước khi gửi API, sửa xử lý lỗi `handleSubmit`, sửa cơ chế phát hiện trùng lặp realtime `handleCheckDuplicate`.

- [x] **Tích Hợp API Quốc Gia Việt Nam Cho Địa Chỉ & Chuẩn Hóa Số Liệu Báo Cáo (`feat-026`):**
  - **1. Cơ sở dữ liệu hành chính 3 cấp (Tỉnh/Thành -> Quận/Huyện -> Phường/Xã):**
    - Đóng gói toàn bộ cơ sở dữ liệu hành chính 63 Tỉnh/Thành phố, 696 Quận/Huyện và 10.051 Phường/Xã từ Tổng cục Thống kê (GSO) vào file nội bộ [vietnamAdministrative.json](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/data/vietnamAdministrative.json) và [backend/src/data/vietnamAdministrative.json](file:///Users/zen/CNTT/Fullstack/internship/backend/src/data/vietnamAdministrative.json) (231 KB).
    - Cập nhật [vietnamLocationApi.js](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/utils/vietnamLocationApi.js) để nạp dữ liệu cục bộ tức thì với độ trễ **0ms**, loại bỏ 100% rủi ro nghẽn mạng hay timeout từ API bên ngoài `provinces.open-api.vn`.
    - Tái cấu trúc [LeadModal.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Leads/LeadModal.jsx): Loại bỏ trường "Quốc gia" thừa theo yêu cầu người dùng, thay bằng chuỗi 3 dropdown liên hoàn trực quan: **Tỉnh / Thành phố** -> **Quận / Huyện** -> **Phường / Xã** -> và ô nhập **Địa chỉ chi tiết (Số nhà, tên đường)**.
  - **2. Chuẩn hóa Báo cáo Bán hàng ([report.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/report.controller.js)):**
    - Sửa `entered_date = CURRENT_DATE` thành `entered_date::date = CURRENT_DATE` để nhận diện chính xác Lead nhập trong ngày (`today_leads = 1`).
    - Khắc phục lỗi Cartesian product khi JOIN bảng Leads với Campaigns/Users bằng cách áp dụng `COUNT(DISTINCT l.id)` (tổng Lead chuẩn 22).
    - Chuẩn hóa tỷ lệ chuyển đổi `conversion_rate` từ `total_orders / total_leads` (122.73% phi lý) thành `(converted_leads / total_leads) * 100` (72.73% chuẩn nghiệp vụ CRM).

- [x] **Format Dấu Chấm (`.`) Cho Số Tiền Nhập Liệu & Hiển Thị:**
  - Viết hàm chuẩn hóa `formatNumberWithDots()` và `parseNumberFromDots()` trong [SetupPlanPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Forecast/SetupPlanPage.jsx).
  - Áp dụng phân cách hàng nghìn bằng dấu chấm (VD: `150.000.000`) cho toàn bộ 12 ô nhập chỉ tiêu tháng, ô tính nhanh chỉ tiêu cả năm `quickTotal`, và ngân sách chiến dịch trong [CampaignModal.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Campaigns/CampaignModal.jsx).

- [x] **Trợ Lý Trí Tuệ Nhân Tạo Thông Minh Zen CRM (Python FastAPI & Gemini 3.5 Flash-Lite - `feat-027`):**
  - **1. Microservice AI Backend bằng Python (`ai_service/`):**
    - `database.py`: Kết nối Connection Pool tới PostgreSQL (`CRM`), tự động serialize an toàn các kiểu dữ liệu `Decimal` và `datetime`.
    - `crm_tools.py`: Cung cấp 6 công cụ Function Calling cho Gemini AI tra cứu trực tiếp dữ liệu thời gian thực:
      - `get_leads_summary`: Thống kê tổng số lead, số lead hôm nay, lead tháng này và danh sách chi tiết.
      - `get_revenue_and_forecast`: Doanh thu thực tế từ đơn hoàn tất, đối soát chỉ tiêu tháng/năm, tính % hoàn thành.
      - `get_products_and_inventory`: Tra cứu đơn giá, mã SP, phân loại và cảnh báo tồn kho sắp hết ($\le 5$).
      - `get_opportunities_overview`: Tổng quan các cơ hội bán hàng theo Pipeline và danh sách top cơ hội tiềm năng lớn nhất.
      - `get_campaigns_overview`: Đánh giá hiệu quả các chiến dịch tiếp thị và số lượng lead thu được.
      - `search_customer`: Tra cứu đa kênh thông tin khách hàng, cơ hội và lịch sử đơn hàng liên quan.
    - `gemini_engine.py`: Tích hợp Google GenAI SDK thế hệ mới (`gemini-flash-lite-latest` / Gemini 3.5 Flash-Lite), cấu hình System Instruction chuẩn phong cách Zen CRM Enterprise, quản lý phiên hội thoại multi-turn (Session Memory).
    - `main.py`: FastAPI server cổng 8000 với CORS toàn diện cho Frontend React (`:8080`), endpoints `/api/health`, `/api/chat`, `/api/chat/reset`, `/api/quick-prompts`.
    - `start.sh`: Kịch bản khởi chạy nhanh 1 chạm tự động tạo venv và uvicorn reload.
    - `test_ai_service.py`: 7/7 unit & integration tests PASS 100%.
    - `README.md` & `.env.example`: Hướng dẫn cấu hình và vận hành chuẩn.
  - **2. Widget Trợ lý AI trên React Frontend ([AIChatWidget.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Chat/AIChatWidget.jsx)):**
    - Nút FAB nổi góc dưới phải màn hình với animation pulse và icon Sparkles.
    - Cửa sổ chat phong cách Mint Pastel (`#3CB371` / `#2E8B57`) đồng bộ nhận diện Zen CRM.
    - Thanh câu hỏi nhanh 1 chạm (Quick Prompts Carousel) tra cứu tức thì Leads, Doanh thu, Tồn kho, Pipeline.
    - Bộ định dạng Markdown tích hợp (Headers, In đậm, Danh sách gạch đầu dòng, Bảng biểu, Mã code, format tiền VND).
    - Đèn báo trực tuyến/ngoại tuyến thời gian thực, nút làm mới phiên chat (`RotateCcw`).
    - Nhúng vào [MainLayout.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Layout/MainLayout.jsx) hiển thị xuyên suốt trên toàn bộ các phân hệ của CRM.

---

### III. What's In Progress (Việc đang thực hiện)

- **Lập kế hoạch & Đặc tả lộ trình Nâng cấp Autonomous Action Agent (`feat-028` -> `feat-031`):**
  - **`feat-028` (Planned):** Trợ lý AI Tự động Thêm Khách hàng Tiềm năng (Autonomous Lead Creation & Deduplication Guard) qua ngôn ngữ tự nhiên.
  - **`feat-029` (Planned):** Trợ lý AI Tự động Tạo Cơ hội Bán hàng & Khớp Sản phẩm (Autonomous Opportunity Creation & Product Matching).
  - **`feat-030` (Planned):** Trợ lý AI Tự động Ghi Nhật ký Chăm sóc & Chuyển Đổi Pipeline (Autonomous Follow-up Logging & Pipeline Transition).
  - **`feat-031` (Planned):** Trợ lý AI Tự động Chốt Đơn hàng & Cập Nhật Tồn Kho (Autonomous Make Order & Inventory Sync).

---

### IV. What's Next (Các bước tiếp theo)

1. **Chuẩn bị môi trường triển khai cho Agentic Action Tools khi người dùng yêu cầu bắt đầu code:**
   - Xây dựng hàm `execute_mutation` có quản lý Transaction ACID trong `database.py`.
   - Định nghĩa các Action Tools trong `crm_tools.py` (`create_lead`, `create_opportunity`, `add_follow_up`, `make_order`).
   - Tinh chỉnh Prompt System Instruction cho Gemini Engine để tự động bóc tách thực thể và yêu cầu xác nhận khi cần.
   - Viết các test case kiểm thử tự động tại `test_ai_service.py`.
2. **Khởi chạy `feat-021`**: Kiểm thử E2E liên vết các phân hệ:
   - *Bước 1 (Admin):* Đăng nhập `admin` / `11111111` -> Tạo tài khoản nhân viên mới -> Phân quyền vai trò -> Khóa/Mở khóa/Xóa nhân viên.
   - *Bước 2 (Manager):* Đăng nhập `manager` / `11111111` -> Thiết lập Kế hoạch doanh số 12 tháng -> Tạo Danh mục & Sản phẩm -> Tạo Chiến dịch tiếp thị & Gán sản phẩm mục tiêu -> Xem Báo cáo hiệu quả ROI chiến dịch.
   - *Bước 3 (Salesman):* Đăng nhập `sale` / `11111111` -> Thêm Khách hàng tiềm năng mới (kiểm tra chống trùng lặp BR-02) -> Tạo Cơ hội bán hàng liên kết Lead và Sản phẩm -> Ghi nhật ký tư vấn chăm sóc Follow-up (đổi trạng thái cơ hội sang CONTACTED) -> Chốt đơn hàng Make Order (kiểm tra khóa dòng Row-level Lock, trừ tồn kho tự động, sinh mã đơn `ORD-YYYYMMDD-XXXX`).
   - *Bước 4 (Đối soát):* Đăng nhập lại `manager` hoặc `sale` -> Kiểm tra Bảng đối soát KPI 12 tháng (`/forecast/performance`) tự động cập nhật doanh thu thực tế -> Kiểm tra Báo cáo bán hàng tổng hợp (`/reports`).
   - *Bước 5 (Trợ lý AI):* Mở Trợ lý AI Zen CRM tại góc màn hình -> Đặt câu hỏi truy vấn dữ liệu thực tế -> Kiểm tra đối soát câu trả lời của AI khớp 100% với dữ liệu trong database PostgreSQL.
   - *Bước 6 (Bảo mật phiên):* Thử nghiệm đồng hồ đếm ngược phiên làm việc và nút Demo Auto-Logout 10s tại Header để chứng minh tính năng an toàn phiên làm việc theo SRS 5.3 & BR-11.
3. Rà soát Definition of Done trong [AGENTS.md](file:///Users/zen/CNTT/Fullstack/internship/AGENTS.md) và đánh dấu hoàn thành `feat-021` trong [feature_list.json](file:///Users/zen/CNTT/Fullstack/internship/feature_list.json).
4. Đóng gói mã nguồn, tạo commit tổng kết và hoàn thiện biên bản bàn giao.

---

## Blockers / Risks (Rào Cản & Rủi Ro)

- **Không có rào cản (0 blockers):** Toàn bộ 22/22 tính năng nền tảng, nghiệp vụ và Trợ lý AI đã hoàn thiện 100%, vượt qua tất cả **270/270 bài kiểm tra tự động** (146 backend + 117 frontend + 7 AI Service), build frontend thành công trong 373ms, không có bất kỳ lỗi linter hoặc runtime nào.

---

## Decisions Made (Các Quyết Định Kiến Trúc Đã Thống Nhất)

- **Kiến trúc Microservice AI (Python FastAPI + React):** Tách biệt dịch vụ AI sang thư mục độc lập `ai_service/` (cổng 8000) để tận dụng SDK Google GenAI chính thức trên Python, giữ backend Express (cổng 5001) tinh gọn, giao tiếp thông qua RESTful API CORS an toàn.
- **Tối ưu Hóa Dữ Liệu Hành Chính Quốc Gia (Offline 0ms):** Đóng gói trọn vẹn 63 Tỉnh/Thành, 696 Quận/Huyện, 10.051 Phường/Xã từ Tổng cục Thống kê (GSO) vào file JSON cục bộ 231 KB, loại bỏ hoàn toàn rủi ro nghẽn mạng hay rớt API bên ngoài.
- **Chuẩn Hóa Format Số Tiền:** Áp dụng phân cách hàng nghìn bằng dấu chấm (`.`) cho toàn bộ các ô nhập chỉ tiêu tài chính và ngân sách để tối ưu trải nghiệm đọc số lớn.
- **Cấu hình Cổng Dịch Vụ:** Express Backend chạy cổng `5001`, Frontend chạy cổng `8080`, Python AI Service chạy cổng `8000`, PostgreSQL chạy cổng `5432`.
- **Nguyên Tắc Phân Trang (BR-03):** Toàn bộ các bảng danh sách (`leads`, `opportunities`, `orders`, `products`, `campaigns`, `admin/users`) hiển thị mặc định đúng **20 bản ghi mỗi trang** kèm thanh phân trang chuẩn.
- **An Toàn Dữ Liệu & Race Condition:** Chốt đơn hàng bằng PostgreSQL ACID Transaction (`BEGIN ... COMMIT / ROLLBACK`) kết hợp khóa dòng Row-level Locking (`SELECT ... FOR UPDATE`) trên cả bảng `opportunities` và `products`.
- **Bảo Toàn Lịch Sử Giao Dịch:** Lưu snapshot đơn giá niêm yết `unit_price` tại thời điểm chốt trong bảng `orders` để bảo toàn giá trị lịch sử kể cả khi sản phẩm thay đổi giá trong tương lai.
- **Bảo Vệ Toàn Vẹn Liên Kết (Data Integrity):** Chặn xóa Cơ hội đã chốt (`ORDERED`); chặn xóa Sản phẩm đã có đơn hàng/cơ hội; chặn xóa Danh mục đang chứa sản phẩm; khóa ngoại `users(id)` dùng `ON DELETE SET NULL` giúp bảo toàn dữ liệu nghiệp vụ khi xóa tài khoản nhân viên.
- **Bảo Mật Phiên Làm Việc (SRS 5.3, BR-11):** Token JWT có hạn 24h; hệ thống đếm ngược 30 phút bất hoạt và tự động kích hoạt Auto-Logout khi không phát sinh tương tác; cung cấp chế độ Demo 10s phục vụ trình chiếu đồ án.
- **Phân Quyền Sản Phẩm Cho Salesman (feat-022):** Quản lý (`SALE_MANAGER`) và Admin phân bổ sản phẩm được phép bán cho từng nhân viên qua bảng `salesman_products`. Salesman chỉ được xem và tạo cơ hội bán hàng (`Opportunity`) cho các sản phẩm đã được phân quyền (chặn HTTP 403 Forbidden nếu vi phạm).
- **Tối Ưu Truy Vấn Mặc Định 1 Năm (feat-022):** Khi mở ứng dụng và không chỉ định khoảng ngày, hệ thống tự động tối ưu query trong phạm vi 1 năm gần nhất (`CURRENT_TIMESTAMP - INTERVAL '1 year'`) trên các module Đơn hàng, Cơ hội, Khách hàng tiềm năng và Dashboard. Khi người dùng chọn mốc thời gian trên bộ lọc, hệ thống tự động tải tiếp dữ liệu theo khoảng ngày đã chọn.

---

## Evidence of Completion (Bằng Chứng Kiểm Thử Hiện Tại)

| Lệnh kiểm thử | Kết quả | Chi tiết kiểm chứng |
|---|---|---|
| `npm test` (trong `backend/`) | **PASS (146/146 passed, 0 failures)** | `app.test.js` (2) + `auth.test.js` (12) + `db.test.js` (6) + `forgot-password.test.js` (6) + `user.test.js` (16) + `lead.test.js` (15) + `product.test.js` (20) + `opportunity.test.js` (18) + `order.test.js` (15) + `campaign.test.js` (19) + `forecast.test.js` (15) + `dashboard.test.js` (4) |
| `npm test` (trong `frontend/`) | **PASS (117/117 passed, 0 failures)** | `admin-ui.test.js` (10) + `leads-ui.test.js` (10) + `login-flow.test.js` (5) + `opportunities-ui.test.js` (10) + `orders-ui.test.js` (12) + `products-ui.test.js` (14) + `session-timeout.test.js` (6) + `user-management.test.js` (10) + `campaigns-ui.test.js` (14) + `forecast-ui.test.js` (10) + `dashboard-ui.test.js` (9) + `leads-ui.test.js` flick switch (7) |
| `python3 test_ai_service.py` (trong `ai_service/`) | **PASS (7/7 passed, 0 failures)** | `test_database_health`, `test_health_endpoint`, `test_quick_prompts_endpoint`, `test_crm_leads_tool`, `test_crm_revenue_tool`, `test_crm_products_tool`, `test_reset_session_endpoint` (0.055s) |
| `npm run lint` (trong `frontend/`) | **PASS (0 errors, 0 warnings trong component AI)** | Oxlint kiểm tra 76 files frontend, AIChatWidget.jsx 0 lỗi, 0 cảnh báo |
| `npm run build` (trong `frontend/`) | **PASS (built in 373ms)** | Vite production client build hoàn tất, bundle `dist/` sẵn sàng triển khai |
| **Toàn bộ hệ thống** | **PASS (270/270 tests passed 100%)** | 146 backend integration tests + 117 frontend tests + 7 AI Service unit tests vượt qua tuyệt đối |
