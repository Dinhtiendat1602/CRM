<!-- Chức năng: Lộ trình tổng thể: các mốc bàn giao (Milestones), deadline từng sprint và kịch bản demo bảo vệ -->

# LỘ TRÌNH THỰC THI 4 TUẦN VÀ KỊCH BẢN BẢO VỆ ĐỒ ÁN (ROADMAP & DEFENSE)
> **Dự án:** Zen CRM  
> **Thời gian:** 4 Tuần (Sprint Method)  
> **Mục tiêu:** Hoàn thiện 100% tất cả yêu cầu SRS Ver 1.1 và bảo vệ đồ án thực tập xuất sắc  
> **Căn cứ:** SRS Version 1.1 — iViettech Education

---

## 1. LỘ TRÌNH THỰC THI CHI TIẾT (SPRINT ROADMAP)

### Tuần 1: Khởi tạo Nền tảng — CSDL, Xác thực & Phân quyền

**SRS Coverage:** 3.13, 3.14, 5.3 & SRS 2.1 (Admin side)

**Nhiệm vụ:**
1. **Khởi tạo môi trường dự án:** Cài đặt Node.js, PostgreSQL, tạo database `crm`, khởi tạo thư mục `backend/` và `frontend/` theo đúng cấu trúc thiết kế.
2. **Schema CSDL:** Chạy file DDL (10 bảng + ENUM types + Indexes) và `seed.sql` tạo 3 tài khoản demo (`admin`, `manager`, `salesman`), danh mục sản phẩm và sản phẩm mẫu.
3. **Auth Backend:** JWT Login, middleware `auth.middleware.js`, middleware `role.middleware.js` (RBAC), API cập nhật Profile (SRS 3.13).
4. **Forget/Reset Password:** Nodemailer SMTP gửi link reset, API xác thực token và đổi mật khẩu (SRS 3.14).
5. **Admin — User Management (SRS 2.1):** API + UI Danh sách Users, Tạo User mới, Toggle Active/Inactive, Gán Role, Reset Password trực tiếp.
6. **Frontend Base:** MainLayout, Sidebar RBAC (menu chỉ hiện theo quyền), PrivateRoute, RoleRoute.
7. **Idle Timeout (SRS 5.3):** `useIdleTimeout` hook 30 phút tích hợp trong AuthContext.

**Tiêu chí nghiệm thu (DoD):**
* [ ] Đăng nhập 3 role khác nhau → Sidebar hiển thị menu đúng quyền hạn của mỗi role.
* [ ] Quên mật khẩu → Gửi email có link → Truy cập link → Đổi mật khẩu mới thành công.
* [ ] Admin tạo được tài khoản mới, khóa/mở khóa tài khoản, gán đổi role.
* [ ] Sau 30 phút không thao tác, phiên làm việc tự hủy và chuyển về trang Login (SRS 5.3).

---

### Tuần 2: Quản lý Khách hàng tiềm năng & Danh mục Sản phẩm

**SRS Coverage:** 3.1 → 3.5 (Leads), 3.15, 3.16, 3.17 (Products)

**Nhiệm vụ:**
1. **Leads API (SRS 3.1 → 3.5):**
   * `POST /api/leads` — Validate bắt buộc (REQ-2, REQ-3) + Kiểm tra trùng SĐT/Email (REQ-4).
   * `GET /api/leads` — Phân trang 20 dòng mới nhất (REQ-1), Sort `entered_date` (REQ-2), Filter date range (REQ-3), Search tên (SRS 3.3).
   * `GET /api/leads/:id` — Chi tiết Lead + Danh sách Opportunity liên quan (3.2.3 REQ-4).
   * `PUT /api/leads/:id`, `DELETE /api/leads/:id`.
2. **Leads UI:** `LeadList.jsx` (bảng 20 dòng + phân trang + sort/filter + search), `LeadModal.jsx` (form thêm/sửa + cảnh báo duplicate), `LeadDetail.jsx` (chi tiết + tab Opps).
3. **Products API (SRS 3.15, 3.16, 3.17):** CRUD Products, tìm kiếm tên/mã SP, `GET /api/products/:id/opportunities`, `GET /api/products/:id/orders`.
4. **Products UI:** `ProductList.jsx`, `ProductModal.jsx`, `ProductDetail.jsx` (2 tab: View Opps + View Orders).

**Tiêu chí nghiệm thu (DoD):**
* [ ] Nhập Lead trùng Email hoặc SĐT → Hệ thống từ chối và hiện cảnh báo rõ ràng với thông tin bản ghi trùng.
* [ ] Trang LeadList hiển thị đúng 20 bản ghi mới nhất theo `entered_date DESC`.
* [ ] Bộ lọc ngày tháng và thanh phân trang hoạt động chính xác.
* [ ] Tìm kiếm tên Lead cho kết quả chính xác (tìm một phần tên cũng tìm được).
* [ ] ProductDetail hiển thị 2 tab Cơ hội và Đơn hàng liên quan đến sản phẩm.

---

### Tuần 3: Vòng đời Bán hàng — Cơ hội, Chăm sóc & Chốt đơn

**SRS Coverage:** 3.6 → 3.12 (Opportunities, Follow-up, Make an Order)

**Nhiệm vụ:**
1. **Opportunities API (SRS 3.6 → 3.10):**
   * CRUD Opportunities (Lead + Product + Qty + Expected Close Date).
   * Phân trang 20 dòng, Sort/Filter theo `created_at`, Search theo tên Lead hoặc tên SP (SRS 3.8).
2. **Follow-up API (SRS 3.11):**
   * `POST /api/opportunities/:id/follow-ups` — Lưu: Ngày, Kênh liên hệ, Nội dung, Phản hồi khách, Kế hoạch tiếp theo.
   * `GET /api/opportunities/:id` — Trả về chi tiết Cơ hội kèm toàn bộ lịch sử Follow-up.
3. **Make an Order (DB Transaction — SRS 3.12):**
   * `POST /api/opportunities/:id/make-order` — Nhận `shipping_address` + `payment_info`.
   * Transaction: `BEGIN` → Lock row → Kiểm tra tồn kho → Tạo `orders` → Set `opportunities.status = 'ORDERED'` → Trừ `products.stock_qty` → `COMMIT`. Rollback nếu có lỗi.
4. **Orders API:** `GET /api/orders`, `GET /api/orders/:id`.
5. **UI:** `OppList.jsx`, `OppModal.jsx`, `FollowUpModal.jsx`, `MakeOrderModal.jsx`, `OrderList.jsx`, `OrderDetail.jsx`.

**Tiêu chí nghiệm thu (DoD):**
* [ ] Thêm Follow-up → Xem lại được toàn bộ lịch sử chăm sóc trong chi tiết Cơ hội.
* [ ] Chốt đơn hàng thành công → Opportunity chuyển trạng thái `ORDERED`, đơn hàng mới xuất hiện trong OrderList, tồn kho sản phẩm giảm chính xác đúng số lượng.
* [ ] Chốt đơn khi tồn kho không đủ → Hệ thống từ chối, rollback, hiện thông báo rõ ràng.
* [ ] Tìm kiếm Opportunity theo tên Lead hoặc tên Sản phẩm cho kết quả đúng.

---

### Tuần 4: Chiến dịch, Dự báo Doanh thu, Báo cáo & Hoàn thiện

**SRS Coverage:** 3.18, 3.19, 3.20, 3.21, 2.1 (Reports, C. EWEDDampaigns, Forecast)

**Nhiệm vụ:**
1. **Campaign API & UI (SRS 3.18):** CRUD Campaigns, tìm kiếm, gán sản phẩm vào chiến dịch.
2. **Campaign Performance Report (SRS 3.19):** `GET /api/campaigns/:id/report` — Tổng số Lead, Tổng số Opportunity, Danh sách Lead từ chiến dịch. UI: `CampaignReport.jsx`.
3. **Forecast Setup (SRS 3.20):** `POST /api/forecasts/setup` — Form nhập chỉ tiêu 12 tháng + chọn năm tài chính. UI: `SetupPlan.jsx`.
4. **Performance Report (SRS 3.21):** `GET /api/forecasts/performance?year=YYYY` — Bảng đối soát `Month | Plan | Actually Value | %`. UI: `PerformanceReport.jsx` + Biểu đồ Chart.js.
5. **General Reports (SRS 2.1):** 3 API thống kê Lead/Order/Revenue theo `period=day/month/year`. UI: `GeneralReports.jsx` (tab + DatePicker + Chart).
6. **Kiểm thử toàn diện:** Test 100% API qua Postman, test phân quyền từng role, test edge cases (tồn kho = 0, plan = 0, năm chưa có kế hoạch).
7. **Hoàn thiện tài liệu:** Báo cáo thực tập, bộ slide thuyết trình, seed data đầy đủ cho demo.

**Tiêu chí nghiệm thu (DoD):**
* [ ] Bảng Performance Report tính đúng `% = (Actual / Plan) * 100` cho 12 tháng; hiển thị 0% khi chưa có kế hoạch.
* [ ] Campaign Report liệt kê đúng Lead và đếm đúng Opportunity từ chiến dịch.
* [ ] Hệ thống đáp ứng **100%** các chức năng liệt kê trong SRS Ver 1.1.

---

## 2. MA TRẬN TIÊU CHÍ NGHIỆM THU TỔNG (ACCEPTANCE CRITERIA CHECKLIST)

| # | SRS Ref | Tiêu chí | Kết quả |
| :---: | :--- | :--- | :---: |
| AC-01 | SRS 3.2.3 REQ-1 | Danh sách Lead/Opp hiển thị đúng 20 bản ghi mới nhất | ☐ |
| AC-02 | SRS 3.1.2 REQ-4 | Chặn tạo Lead trùng SĐT hoặc Email | ☐ |
| AC-03 | SRS 3.2.3 REQ-2,3 | Sort & Filter Lead/Opp theo `entered_date` hoạt động | ☐ |
| AC-04 | SRS 3.3.3 REQ-1 | Tìm kiếm Lead bằng tên hoặc một phần tên | ☐ |
| AC-05 | SRS 3.8.3 REQ-1 | Tìm kiếm Opp theo tên Lead hoặc tên Sản phẩm | ☐ |
| AC-06 | SRS 3.11.3 REQ-1 | Follow-up lưu đủ: ngày, nội dung, phản hồi, kế hoạch tiếp | ☐ |
| AC-07 | SRS 3.12.3 REQ-1 | Make Order: chuyển `ORDERED` + trừ kho + tạo Order trong 1 Transaction | ☐ |
| AC-08 | SRS 3.12 | Make Order khi hết kho → Rollback, báo lỗi, không thay đổi dữ liệu | ☐ |
| AC-09 | SRS 3.14.3 REQ-2 | Quên mật khẩu → Email có link → Đổi mật khẩu thành công | ☐ |
| AC-10 | SRS 3.16.3 REQ-1 | ProductDetail hiển thị đúng danh sách Cơ hội liên quan | ☐ |
| AC-11 | SRS 3.17 | ProductDetail hiển thị đúng danh sách Đơn hàng liên quan | ☐ |
| AC-12 | SRS 3.19.3 REQ-1 | Campaign Report liệt kê Lead & đếm Opportunity từ chiến dịch | ☐ |
| AC-13 | SRS 3.21.3 REQ-1 | Performance Report: `Month \| Plan \| Actual \| %` chính xác | ☐ |
| AC-14 | SRS 5.3 | Tự động Timeout sau đúng 30 phút không tương tác | ☐ |
| AC-15 | SRS 5.3 | Phân quyền RBAC: User chỉ truy cập chức năng đúng với role | ☐ |

---

## 3. KỊCH BẢN BẢO VỆ ĐỒ ÁN TRƯỚC HỘI ĐỒNG (DEMO SCENARIO — 6 BƯỚC)

| Bước | Vai trò diễn | Thao tác Demo | Minh chứng đạt yêu cầu SRS |
| :---: | :--- | :--- | :--- |
| **1** | **Admin** | Đăng nhập Admin → Vào User Management → Tạo tài khoản Salesman mới → Gán role → Kích hoạt/khóa tài khoản. | Đáp ứng SRS 2.1 (Administration: tạo user, gán role, active/deactive) |
| **2** | **Salesman** | Đăng nhập Salesman → Vào Leads → Thử tạo Lead trùng SĐT (hệ thống chặn, báo lỗi) → Tạo Lead hợp lệ → Tìm kiếm → Xem chi tiết → Thấy tab Opportunities | Đáp ứng SRS 3.1 (REQ-4 duplicate), SRS 3.2 (20 dòng), SRS 3.3 (search), SRS 3.2.3 REQ-4 |
| **3** | **Salesman** | Từ Lead vừa tạo → Tạo Opportunity → Vào chi tiết Opp → Thêm Follow-up (nhật ký gọi điện) → Bấm Make an Order (nhập thông tin thanh toán, địa chỉ) → Xác nhận | Đáp ứng SRS 3.6 (tạo Opp), SRS 3.11 (Follow-up: ngày, ND, phản hồi, KH tiếp), SRS 3.12 (chuyển ORDERED, trừ kho, tạo Order) |
| **4** | **Sale Manager** | Đăng nhập Manager → Vào ProductDetail → Tab View Opportunity → Tab View Orders (thấy đơn hàng vừa chốt) → Vào CampaignReport → Xem Lead & Opp từ chiến dịch | Đáp ứng SRS 3.16, 3.17, 3.18, SRS 3.19 (Campaign Performance Report) |
| **5** | **Sale Manager** | Vào Forecast → Setup Plan (nhập chỉ tiêu 12 tháng) → Xem Performance Report → Giải thích bảng Plan vs Actual vs % → Xem biểu đồ Chart.js | Đáp ứng SRS 3.20 (Setup Plan), SRS 3.21 (Performance Report đối soát) |
| **6** | **Chung** | Chứng minh phiên hết hạn bằng cách giảm timeout trong demo xuống 10 giây → Không thao tác → Hệ thống tự logout và chuyển về Login | Đáp ứng SRS 5.3 (Security: auto timeout, role-based access) |

---

## 4. CÂU HỎI HỘI ĐỒNG THƯỜNG GẶP & GỢI Ý TRẢ LỜI

| Câu hỏi | Gợi ý trả lời |
| :--- | :--- |
| *"Tại sao phân trang 20 dòng?"* | SRS 3.2.3 REQ-1 quy định rõ: *"In default, 20 newest leads are displayed on the first page."* |
| *"Database Transaction là gì? Dùng ở đâu?"* | Transaction ACID đảm bảo toàn vẹn dữ liệu khi chốt đơn (Make an Order): hoặc cả 3 bước (tạo Order, cập nhật Opp, trừ kho) đều thành công, hoặc không có bước nào được lưu. Tránh mất dữ liệu khi có lỗi giữa chừng. |
| *"RBAC là gì? Triển khai như thế nào?"* | Role-Based Access Control: mỗi người dùng có role, mỗi API endpoint có middleware kiểm tra role. JWT chứa role thông tin. Middleware `authorizeRoles('ADMIN')` ngăn user không đúng role truy cập. |
| *"Duplicate check hoạt động như thế nào?"* | Khi tạo Lead, Backend query kiểm tra xem `email` hoặc `phone` đã tồn tại trong bảng `leads` chưa. Nếu trùng → HTTP 409 Conflict + trả về thông tin bản ghi trùng để User dễ xử lý. |
| *"Tại sao cần lưu `unit_price` trong bảng Orders?"* | Nếu chỉ FK tới Products, khi người dùng sau này sửa giá sản phẩm thì đơn hàng cũ sẽ bị sai giá. Lưu snapshot `unit_price` tại thời điểm chốt đơn để bảo toàn lịch sử giao dịch. |
| *"Actually Value trong Performance Report lấy từ đâu?"* | SUM(orders.total_amount) nhóm theo tháng-năm tương ứng từ bảng `orders`, loại trừ các đơn hàng bị hủy (status != 'CANCELLED'). |
