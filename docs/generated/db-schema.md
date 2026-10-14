<!-- Chức năng: Thiết kế chi tiết CSDL: danh sách bảng, trường dữ liệu, khóa chính, khóa ngoại, quan hệ -->

# THIẾT KẾ CƠ SỞ DỮ LIỆU POSTGRESQL (DATABASE DESIGN & DDL)
> **Dự án:** Zen CRM  
> **Hệ quản trị CSDL:** PostgreSQL 14+ (Chuẩn hóa 3NF)  
> **Căn cứ:** SRS Version 1.1 — Mục 3.1 → 3.21 & Mục 2.1  
> **Tên Database:** `crm`

---

## 1. SƠ ĐỒ THỰC THỂ & QUAN HỆ (ERD RELATIONSHIPS)

```
roles (1) ───< users (N)           : Phân quyền vai trò người dùng (role_id)
users (1) ───< leads (N)           : Nhân viên được phân công phụ trách Lead (assigned_to)
users (1) ───< opportunities (N)   : Nhân viên tạo cơ hội (created_by)
users (1) ───< orders (N)          : Nhân viên chốt đơn (created_by)
users (1) ───< campaigns (N)       : Quản lý tạo chiến dịch (created_by)
users (1) ───< sale_forecasts (N)  : Quản lý thiết lập kế hoạch (created_by)

campaigns (1) ───< products (N)    : Sản phẩm được quảng bá trong chiến dịch (SRS 3.18.1)
product_categories (1) ───< products (N) : Phân loại danh mục sản phẩm (category_id)
campaigns (1) ───< leads (N)       : Lead thu thập được từ chiến dịch (SRS 1.4 Term)

leads (1)    ───< opportunities (N) : 1 Khách hàng có nhiều Cơ hội bán hàng (SRS 3.6)
products (1) ───< opportunities (N) : Cơ hội gắn với 1 Sản phẩm cụ thể (SRS 3.6)

opportunities (1) ───< follow_ups (N) : Lịch sử các lần tương tác chăm sóc (SRS 3.11)
opportunities (1) ─── (1) orders      : Chuyển đổi Cơ hội → Đơn hàng 1-1 (SRS 3.12)

sale_forecasts : Bảng độc lập lưu kế hoạch doanh số theo fiscal_year + month (SRS 3.20, 3.21)
```

**Giải thích quan hệ mối nối kép Campaign:**
- `campaigns` ←→ `products`: SRS 3.18.1 ghi rõ *"When users add a product, they can select a campaign to add this product to the campaign"* → `products.campaign_id FK`.
- `campaigns` ←→ `leads`: SRS 1.4 định nghĩa Campaign là *"program of marketing to collect the Lead information"* → `leads.campaign_id FK`.

---

## 2. KỊCH BẢN KHỞI TẠO BẢNG (SCHEMA DDL SCRIPT)

```sql
-- ==============================================================
-- KHỞI TẠO DATABASE (chạy một lần)
-- ==============================================================
-- CREATE DATABASE crm;
-- \c crm

-- ==============================================================
-- 1. ENUM TYPES
-- ==============================================================
CREATE TYPE opp_status AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'ORDERED', 'LOST');
CREATE TYPE order_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- ==============================================================
-- 2. ROLES TABLE (Bảng vai trò phân quyền người dùng)
-- Tạo trước USERS vì USERS có khóa ngoại role_id trỏ tới ROLES
-- ==============================================================
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50)  UNIQUE NOT NULL,            -- ADMIN | SALE_MANAGER | SALESMAN
    description VARCHAR(255),
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================
-- 3. USERS TABLE (SRS 3.13, 3.14 & Quản trị Admin SRS 2.1)
-- ==============================================================
CREATE TABLE users (
    id                     SERIAL PRIMARY KEY,
    username               VARCHAR(50)  UNIQUE NOT NULL,
    email                  VARCHAR(100) UNIQUE NOT NULL,
    password_hash          VARCHAR(255) NOT NULL,
    full_name              VARCHAR(100) NOT NULL,
    phone                  VARCHAR(20),
    role_id                INT          NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_active              BOOLEAN      DEFAULT TRUE NOT NULL,
    reset_password_token   VARCHAR(255),                     -- SRS 3.14 REQ-2
    reset_password_expires TIMESTAMP,                        -- SRS 3.14 REQ-2
    created_at             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_role_id ON users(role_id);

-- ==============================================================
-- 4. CAMPAIGNS TABLE (SRS 3.18, 3.19 & SRS 1.4 Term)
-- Tạo trước PRODUCTS và LEADS vì cả 2 bảng FK vào campaigns
-- ==============================================================
CREATE TABLE campaigns (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,           -- SRS 3.18.1: name of campaign
    description TEXT,                            -- SRS 3.18.1: description
    start_date  DATE         NOT NULL,           -- SRS 3.18.1: date start
    end_date    DATE         NOT NULL,           -- SRS 3.18.1: date end
    budget      NUMERIC(15, 2) DEFAULT 0,        -- SRS 3.18.1: budget
    created_by  INT REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================
-- 5. PRODUCT_CATEGORIES TABLE (Danh mục sản phẩm)
-- Tạo trước PRODUCTS vì PRODUCTS có FK trỏ tới product_categories
-- ==============================================================
CREATE TABLE product_categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) UNIQUE NOT NULL,            -- Tên danh mục (Điện tử, Phần mềm, v.v.)
    description TEXT,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================
-- 6. PRODUCTS TABLE (SRS 3.15, 3.16, 3.17)
-- ==============================================================
CREATE TABLE products (
    id           SERIAL PRIMARY KEY,
    product_code VARCHAR(50)    UNIQUE NOT NULL,           -- Mã sản phẩm (dùng để Search SRS 3.15)
    name         VARCHAR(150)   NOT NULL,                  -- Tên sản phẩm
    description  TEXT,
    category_id  INT REFERENCES product_categories(id) ON DELETE SET NULL, -- Danh mục phân loại
    unit_price   NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
    stock_qty    INT            DEFAULT 0 NOT NULL CHECK (stock_qty >= 0), -- Tồn kho (SRS 3.12 → trừ khi Make Order)
    campaign_id  INT REFERENCES campaigns(id) ON DELETE SET NULL,         -- SRS 3.18.1: gán SP vào Campaign
    created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_products_category_id ON products(category_id);

-- ==============================================================
-- 7. LEADS TABLE (SRS 3.1 → 3.5 & SRS 1.4 Term)
-- REQ-1: Lưu thông tin cá nhân đầy đủ của khách hàng tiềm năng
-- ==============================================================
CREATE TABLE leads (
    id           SERIAL PRIMARY KEY,
    first_name   VARCHAR(50)  NOT NULL,                  -- SRS 3.1.2 REQ-1: họ
    last_name    VARCHAR(50)  NOT NULL,                  -- SRS 3.1.2 REQ-1: tên
    email        VARCHAR(100) NOT NULL,                  -- SRS 3.1.2 REQ-1: email (dùng check trùng REQ-4)
    phone        VARCHAR(20)  NOT NULL,                  -- SRS 3.1.2 REQ-1: phone (dùng check trùng REQ-4)
    date_of_birth DATE,                                  -- SRS 3.1.2 REQ-1: ngày sinh
    career       VARCHAR(100),                           -- SRS 3.1.2 REQ-1: nghề nghiệp
    address      TEXT,                                   -- SRS 3.1.2 REQ-1: địa chỉ
    campaign_id  INT REFERENCES campaigns(id) ON DELETE SET NULL, -- SRS 1.4: Lead đến từ Chiến dịch nào
    assigned_to  INT REFERENCES users(id) ON DELETE SET NULL,     -- Nhân viên phụ trách
    entered_date TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL, -- SRS 3.2.3 REQ-1, REQ-2, REQ-3: ngày nhập
    updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_leads_entered_date ON leads(entered_date DESC); -- Hỗ trợ sort/filter SRS 3.2.3 REQ-2, REQ-3
CREATE INDEX idx_leads_phone_email  ON leads(phone, email);      -- Hỗ trợ check trùng SRS 3.1.2 REQ-4
CREATE INDEX idx_leads_name         ON leads(first_name, last_name); -- Hỗ trợ Search theo tên SRS 3.3

-- ==============================================================
-- 8. OPPORTUNITIES TABLE (SRS 3.6 → 3.12)
-- REQ-1: Lưu thông tin Lead, Sản phẩm, Ngày tạo, Số lượng
-- ==============================================================
CREATE TABLE opportunities (
    id                 SERIAL PRIMARY KEY,
    lead_id            INT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,   -- SRS 3.6.2 REQ-1
    product_id         INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,-- SRS 3.6.2 REQ-1
    quantity           INT         DEFAULT 1 NOT NULL CHECK (quantity > 0),    -- SRS 3.6.2 REQ-1
    expected_close_date DATE,                                                  -- Ngày dự kiến chốt
    status             opp_status  DEFAULT 'NEW' NOT NULL,                     -- SRS 3.12: ORDERED khi chốt đơn
    notes              TEXT,
    created_by         INT REFERENCES users(id) ON DELETE SET NULL,
    created_at         TIMESTAMP   DEFAULT CURRENT_TIMESTAMP NOT NULL,         -- SRS 3.7.3 REQ-2, REQ-3
    updated_at         TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_opportunities_created_at ON opportunities(created_at DESC); -- Sort/filter SRS 3.7.3 REQ-2, REQ-3
CREATE INDEX idx_opp_lead_product ON opportunities(lead_id, product_id);     -- Check trùng SRS 3.6.2 REQ-4

-- ==============================================================
-- 9. FOLLOW_UPS TABLE (SRS 3.11)
-- REQ-1: date, content, customer_response, next_plan
-- ==============================================================
CREATE TABLE follow_ups (
    id               SERIAL PRIMARY KEY,
    opportunity_id   INT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE, -- SRS 3.11
    follow_date      TIMESTAMP   DEFAULT CURRENT_TIMESTAMP NOT NULL, -- SRS 3.11.3 REQ-1: date
    contact_method   VARCHAR(50) DEFAULT 'PHONE',                    -- PHONE | EMAIL | MEETING
    content          TEXT        NOT NULL,                           -- SRS 3.11.3 REQ-1: content of follow
    customer_response TEXT,                                          -- SRS 3.11.3 REQ-1: response of customer
    next_plan        TEXT,                                           -- SRS 3.11.3 REQ-1: next plan
    created_by       INT REFERENCES users(id) ON DELETE SET NULL
);

-- ==============================================================
-- 10. ORDERS TABLE (SRS 3.12: Make an Order)
-- REQ-1: Convert status + thêm ngày, payment_info, shipping_info
-- Quan hệ 1-1 với Opportunities (opportunity_id UNIQUE)
-- ==============================================================
CREATE TABLE orders (
    id               SERIAL PRIMARY KEY,
    order_code       VARCHAR(50)    UNIQUE NOT NULL,                       -- Mã đơn hàng tự sinh
    opportunity_id   INT UNIQUE REFERENCES opportunities(id) ON DELETE SET NULL, -- Quan hệ 1-1 với Opp
    lead_id          INT NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
    product_id       INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity         INT            NOT NULL CHECK (quantity > 0),
    unit_price       NUMERIC(15, 2) NOT NULL,                              -- Chụp giá tại thời điểm chốt đơn
    total_amount     NUMERIC(15, 2) NOT NULL,                              -- quantity * unit_price
    order_date       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL,    -- SRS 3.12.3 REQ-1: date to make Order
    payment_info     TEXT           NOT NULL,                              -- SRS 3.12.3 REQ-1: Payment information
    shipping_address TEXT           NOT NULL,                              -- SRS 3.12.3 REQ-1: shipping information
    status           order_status   DEFAULT 'COMPLETED' NOT NULL,
    created_by       INT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_orders_order_date ON orders(order_date DESC);             -- Filter theo ngày cho SRS 2.1 Reports
CREATE INDEX idx_orders_product_id ON orders(product_id);                  -- Hỗ trợ SRS 3.17: View Order for product
CREATE INDEX idx_orders_lead_id    ON orders(lead_id);

-- ==============================================================
-- 11. SALE_FORECASTS TABLE (SRS 3.20, 3.21)
-- REQ-1: Form nhập chỉ tiêu doanh thu 12 tháng trong năm
-- Làm rõ từ phân tích: cần thêm fiscal_year vì SRS chỉ có tháng
-- ==============================================================
CREATE TABLE sale_forecasts (
    id            SERIAL PRIMARY KEY,
    fiscal_year   INT            NOT NULL,                        -- Năm tài chính (VD: 2026, 2027)
    month         INT            NOT NULL CHECK (month BETWEEN 1 AND 12), -- Tháng 1-12 như SRS 3.20 mẫu bảng
    target_amount NUMERIC(15, 2) NOT NULL CHECK (target_amount >= 0),     -- SRS 3.20: Value($)
    created_by    INT REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (fiscal_year, month)                                   -- Mỗi tháng-năm chỉ có 1 kế hoạch
);
```

---

## 3. DỮ LIỆU SEED MẪU (seed.sql)

```sql
-- ==============================================================
-- SEED DATA: Tạo bảng Roles và 3 tài khoản khởi đầu
-- Mật khẩu mặc định: "Password123" đã băm bcrypt 10 rounds
-- ==============================================================

-- Bảng Roles (3 vai trò chuẩn hệ thống)
INSERT INTO roles (id, name, description) VALUES
    (1, 'ADMIN',        'Quản trị viên toàn quyền hệ thống'),
    (2, 'SALE_MANAGER', 'Trưởng phòng kinh doanh / Quản lý bán hàng'),
    (3, 'SALESMAN',     'Nhân viên kinh doanh');

-- Tài khoản Admin
INSERT INTO users (username, email, password_hash, full_name, phone, role_id)
VALUES (
    'admin',
    'admin@zencrm.com',
    '$2b$10$F7RHtmxXhZ1OZxFqwdQnNeCo5.7HFwbQdL5vPZhAfDiUxsKBmrW82', -- Password123
    'System Administrator',
    '0900000001',
    1
);

-- Tài khoản Sale Manager
INSERT INTO users (username, email, password_hash, full_name, phone, role_id)
VALUES (
    'manager',
    'manager@zencrm.com',
    '$2b$10$F7RHtmxXhZ1OZxFqwdQnNeCo5.7HFwbQdL5vPZhAfDiUxsKBmrW82', -- Password123
    'Nguyen Van Manager',
    '0900000002',
    2
);

-- Tài khoản Salesman
INSERT INTO users (username, email, password_hash, full_name, phone, role_id)
VALUES (
    'salesman',
    'salesman@zencrm.com',
    '$2b$10$F7RHtmxXhZ1OZxFqwdQnNeCo5.7HFwbQdL5vPZhAfDiUxsKBmrW82', -- Password123
    'Tran Thi Salesman',
    '0900000003',
    3
);

-- Chiến dịch mẫu
INSERT INTO campaigns (name, description, start_date, end_date, budget, created_by)
VALUES ('Campaign Q4 2026', 'Chiến dịch bán hàng quý 4 năm 2026', '2026-10-01', '2026-12-31', 50000.00, 1);

-- Danh mục sản phẩm mẫu
INSERT INTO product_categories (name, description)
VALUES
    ('Thiết bị điện tử', 'Laptop, máy tính bảng, điện thoại và phụ kiện công nghệ'),
    ('Phần mềm & Bản quyền', 'Phần mềm CRM, bản quyền hệ điều hành, dịch vụ cloud');

-- Sản phẩm mẫu (gán vào Category và Campaign Q4 2026)
INSERT INTO products (product_code, name, description, category_id, unit_price, stock_qty, campaign_id)
VALUES
    ('LAPTOP-01', 'Laptop Dell XPS 15', 'Máy tính xách tay cao cấp Dell', 1, 35000000.00, 10, 1),
    ('PHONE-01',  'iPhone 16 Pro Max',  'Điện thoại Apple iPhone 16',     1, 29000000.00, 20, 1);

-- Lead mẫu (đến từ Campaign Q4 2026, do salesman phụ trách)
INSERT INTO leads (first_name, last_name, email, phone, date_of_birth, career, address, campaign_id, assigned_to)
VALUES
    ('Nguyen', 'Van An',   'an@example.com',    '0901111001', '1990-05-15', 'Engineer',   '123 Nguyen Hue, Q1, HCM', 1, 3),
    ('Tran',   'Thi Bich', 'bich@example.com',  '0901111002', '1988-08-20', 'Marketing',  '456 Le Loi, Q3, HCM',     1, 3);

-- Cơ hội mẫu (Lead 1 quan tâm Laptop)
INSERT INTO opportunities (lead_id, product_id, quantity, expected_close_date, status, created_by)
VALUES (1, 1, 1, '2026-11-30', 'CONTACTED', 3);

-- Follow-up mẫu
INSERT INTO follow_ups (opportunity_id, contact_method, content, customer_response, next_plan, created_by)
VALUES (1, 'PHONE', 'Gọi điện giới thiệu Laptop Dell XPS 15', 'Khách muốn xem demo thực tế', 'Hẹn demo tại văn phòng khách vào tuần tới', 3);

-- Kế hoạch doanh số 12 tháng năm 2026
INSERT INTO sale_forecasts (fiscal_year, month, target_amount, created_by) VALUES
    (2026, 1,  15000.00, 2), (2026, 2,  20000.00, 2), (2026, 3,  25000.00, 2),
    (2026, 4,  10000.00, 2), (2026, 5,  15000.00, 2), (2026, 6,  25000.00, 2),
    (2026, 7,  20000.00, 2), (2026, 8,  15000.00, 2), (2026, 9,  15000.00, 2),
    (2026, 10, 20000.00, 2), (2026, 11, 10000.00, 2), (2026, 12, 15000.00, 2);
```

---

## 4. CHÚ THÍCH CÁC QUYẾT ĐỊNH THIẾT KẾ

| Quyết định | Lý do |
| :--- | :--- |
| Bảng `campaigns` tạo trước `leads` và `products` | Cả `leads` và `products` đều có FK trỏ tới `campaigns`. |
| `opportunities.status` ENUM 6 trạng thái | Theo dõi vòng đời cơ hội từ NEW → ORDERED/LOST. `ORDERED` được set khi Make an Order (SRS 3.12). |
| `orders.opportunity_id UNIQUE` | Ràng buộc quan hệ 1-1 giữa Opportunity và Order (SRS 3.12: 1 Opp chỉ được chốt thành 1 Đơn hàng duy nhất). |
| `orders.unit_price` lưu riêng | Chụp (snapshot) giá tại thời điểm chốt đơn, tránh bị ảnh hưởng khi sửa giá sản phẩm sau này. |
| `sale_forecasts.fiscal_year` bổ sung | SRS 3.20 chỉ có bảng tháng 1-12 không có năm → làm rõ theo phân tích để hỗ trợ lưu nhiều năm. |
| INDEX trên `entered_date`, `created_at`, `phone`, `email` | Hỗ trợ Sort, Filter, Search và Duplicate check hiệu năng cao theo SRS 3.2, 3.3, 3.7, 3.8. |
