<!-- Chức năng: Nhật ký tiến độ phiên làm việc: theo dõi trạng thái hiện tại, việc đã làm, đang làm, rủi ro và bằng chứng kiểm thử -->

# Session Progress Log - Nhật Ký Tiến Độ Phiên Làm Việc

## Current State (Hiện Trạng Hệ Thống)

**Last Updated:** 2026-10-14 14:21
**Active Feature:** `feat-013` - Frontend Giao diện Quản lý Cơ hội & Timeline Follow-up (Opportunities UI)
**Current Status:** HOÀN THÀNH 100% (13/20 tính năng đã nghiệm thu đạt chuẩn DoD - Đạt 65% toàn bộ hệ thống Zen CRM)
**Next Feature:** `feat-014` - Backend Chốt đơn hàng bằng Database Transaction (Make an Order)

---

## Status (Trạng Thái Tính Năng)

### What's Done (Những việc đã hoàn thành)

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
| `npm test` (trong `backend/`) | **PASS (70/70 passed, 0 failures)** | `app.test.js` (2) + `auth.test.js` (12) + `db.test.js` (4) + `forgot-password.test.js` (6) + `user.test.js` (13) + `lead.test.js` (15) + `product.test.js` (18) |
| `npm test` (trong `frontend/`) | **PASS (45/45 passed, 0 failures)** | `admin-ui.test.js` (10 tests) + `leads-ui.test.js` (10 tests) + `login-flow.test.js` (5 tests) + `products-ui.test.js` (10 tests) + `user-management.test.js` (10 tests) |
| `npm run lint` (trong `frontend/`) | **PASS (0 errors)** | Oxlint kiểm tra 43 files sạch sẽ |
| `npm run build` (trong `frontend/`) | **PASS (built in 237ms)** | Vite production bundle hoàn tất |
| `npm test` (tại thư mục gốc) | **PASS (115/115 tests passed toàn hệ thống)** | Chạy test backend (70) + test frontend (45) + lint frontend |
