# CRM - Zen CRM System

> Hệ thống Quản trị Quan hệ Khách hàng Toàn diện (Zen CRM) — Xây dựng bằng Node.js / Express, PostgreSQL và React 18 Vite.

---

## 🌟 Tổng Quan Dự Án

**Zen CRM** là giải pháp phần mềm quản trị quan hệ khách hàng chuẩn mực, đáp ứng 100% tài liệu đặc tả nghiệp vụ SRS. Hệ thống hỗ trợ đa phân hệ nghiệp vụ, cơ chế phân quyền RBAC đa cấp độ, kiểm soát phiên làm việc tự động và hỗ trợ song ngữ toàn diện (Tiếng Việt 🇻🇳 / Tiếng Anh 🇬🇧).

### 🚀 Tính Năng Chính

- **Xác Thực & Phân Quyền (RBAC):**
  - Hỗ trợ 3 nhóm vai trò: Quản trị viên (`ADMIN`), Quản lý bán hàng (`SALE_MANAGER`), Nhân viên kinh doanh (`SALESMAN`).
  - Đăng nhập JWT, cơ chế quên/đổi mật khẩu qua SMTP Email bảo mật.
  - Tự động đăng xuất sau 30 phút bất hoạt và đồng hồ đếm ngược phiên làm việc thời gian thực (SRS 5.3).
- **Quản Trị Người Dùng:**
  - Danh sách nhân sự phân trang, tìm kiếm, lọc theo vai trò, gán đổi quyền, khóa/mở khóa và xóa an toàn (`ON DELETE SET NULL`).
- **Khách Hàng Tiềm Năng (Leads):**
  - Quản lý danh sách khách hàng phân trang 20 dòng, bộ lọc ngày tháng và tìm kiếm.
  - Kiểm tra chống trùng SĐT/Email realtime (HTTP 409 Conflict).
  - Tích hợp công tắc Flick: tự động tạo ngay Cơ hội bán hàng khi vừa lưu khách mới.
- **Danh Mục & Sản Phẩm (Products & Warehouse):**
  - Quản lý 5 nhóm danh mục chuẩn và sản phẩm công nghệ.
  - Phân quyền sản phẩm bán hàng cho từng nhân viên Salesman (`salesman_products`).
  - Xem danh sách cơ hội và đơn hàng liên quan đến từng sản phẩm.
- **Cơ Hội Bán Hàng & Nhật Ký Chăm Sóc (Opportunities & Follow-up):**
  - Quản lý quy trình bán hàng qua 6 trạng thái cơ hội chuẩn.
  - Nhật ký chăm sóc Follow-up với Timeline trực quan, chuẩn múi giờ Việt Nam (UTC+7).
- **Chốt Đơn Hàng (Make an Order):**
  - Chốt đơn qua PostgreSQL ACID Transaction kết hợp Row-level Locking (`SELECT FOR UPDATE`).
  - Kiểm tra tồn kho tự động, trừ kho an toàn, sinh mã đơn `ORD-YYYYMMDD-XXXX`.
  - Hỗ trợ xem chi tiết đơn hàng và in hóa đơn / phiếu xuất kho bán hàng (`window.print()`).
- **Chiến Dịch Tiếp Thị (Campaigns):**
  - Quản lý chiến dịch, gán sản phẩm mục tiêu và đo lường báo cáo hiệu quả ROI, tỷ lệ chuyển đổi.
- **Kế Hoạch Doanh Số 12 Tháng & Báo Cáo Đối Soát (Forecast & Performance):**
  - Thiết lập chỉ tiêu doanh số 12 tháng theo năm tài chính.
  - Báo cáo đối soát Kế hoạch vs Thực tế kèm biểu đồ kết hợp (Mixed Bar & Line Chart).
- **Giao Diện & Trải Nghiệm Người Dùng:**
  - Thiết kế theo bảng màu thương hiệu chuẩn: Mint Pastel & Brand Green (`#3CB371`).
  - Hỗ trợ đa ngôn ngữ song ngữ Tiếng Việt 🇻🇳 và Tiếng Anh 🇬🇧 toàn diện (i18n).

---

## 🛠️ Công Nghệ Sử Dụng

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js (Clean MVC Architecture)
- **Database:** PostgreSQL (10 bảng chuẩn 3NF, Foreign Keys & Performance Indexes)
- **Authentication:** JSON Web Token (JWT), bcrypt.js (hash mật khẩu)
- **Email:** Nodemailer (Gmail SMTP)
- **Testing:** Node.js native test runner & integration test suite (146 tests)

### Frontend
- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS v4, Lucide React Icons
- **HTTP Client:** Axios (Interceptors xử lý Bearer Token & lỗi 401)
- **Charts:** Chart.js
- **Testing:** Oxlint (Linter) & Unit test suite (117 tests)

---

## 💻 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu Cầu Môi Trường
- Node.js >= 18.x
- PostgreSQL >= 14.x
- Quản lý gói `npm`

### 2. Cấu Hình Cơ Sở Dữ Liệu
Tạo database `crm` trong PostgreSQL và cấu hình file `backend/.env`:
```env
PORT=5001
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=crm
JWT_SECRET=your_jwt_secret_key
```

Chạy khởi tạo cấu trúc bảng và nạp dữ liệu mẫu:
```bash
cd backend
npm run db:init
npm run db:seed
```

### 3. Cài Đặt Thư Viện & Khởi Động

Tại thư mục gốc dự án:
```bash
# Cài đặt dependencies cho cả backend và frontend
npm run install:all

# Khởi chạy đồng thời Backend (port 5001) và Frontend (port 8080)
npm run dev
```

Truy cập hệ thống tại: `http://localhost:8080`

### 4. Tài Khoản Đăng Nhập Mẫu
Tất cả các tài khoản mặc định đều có mật khẩu khởi tạo: `11111111`
- **Quản trị viên (Admin):** `admin` hoặc `admin@crm.com`
- **Quản lý bán hàng (Sale Manager):** `manager` hoặc `manager@crm.com`
- **Nhân viên bán hàng (Salesman):** `sale` hoặc `salesman@crm.com`

---

## 🧪 Kiểm Thử Hệ Thống (Verification)

Toàn bộ hệ thống vượt qua 100% các bài kiểm thử tự động (263/263 tests PASS):

```bash
# Chạy kiểm thử Backend (146 tests)
cd backend && npm test

# Chạy kiểm thử Frontend (117 tests) & Build
cd frontend && npm test
cd frontend && npm run build
```

---

## 📄 Bản Quyền
Dự án được phát triển phục vụ đồ án thực tập tốt nghiệp và quản trị quan hệ khách hàng.

