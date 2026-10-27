-- ==============================================================
-- ZEN CRM - DATABASE DDL SCHEMA (PostgreSQL 3NF)
-- Căn cứ: SRS v1.1 & docs/generated/db-schema.md
-- ==============================================================

-- Drop tables in reverse order of foreign keys
DROP TABLE IF EXISTS sale_forecasts CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS follow_ups CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Drop enum types if exist
DROP TYPE IF EXISTS opp_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;

-- 1. ENUM TYPES
CREATE TYPE opp_status AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'ORDERED', 'LOST');
CREATE TYPE order_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- 2. ROLES TABLE (Phân quyền 3 vai trò)
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50)  UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 3. USERS TABLE (Xác thực JWT & Quản trị Admin)
CREATE TABLE users (
    id                     SERIAL PRIMARY KEY,
    username               VARCHAR(50)  UNIQUE NOT NULL,
    email                  VARCHAR(100) UNIQUE NOT NULL,
    password_hash          VARCHAR(255) NOT NULL,
    full_name              VARCHAR(100) NOT NULL,
    phone                  VARCHAR(20),
    role_id                INT          NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_active              BOOLEAN      DEFAULT TRUE NOT NULL,
    reset_password_token   VARCHAR(255),
    reset_password_expires TIMESTAMP,
    created_at             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_role_id ON users(role_id);

-- 4. CAMPAIGNS TABLE (Chiến dịch tiếp thị)
CREATE TABLE campaigns (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    start_date  DATE         NOT NULL,
    end_date    DATE         NOT NULL,
    budget      NUMERIC(15, 2) DEFAULT 0,
    created_by  INT REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 5. PRODUCT_CATEGORIES TABLE (Danh mục sản phẩm)
CREATE TABLE product_categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 6. PRODUCTS TABLE (Sản phẩm & Tồn kho)
CREATE TABLE products (
    id           SERIAL PRIMARY KEY,
    product_code VARCHAR(50)    UNIQUE NOT NULL,
    name         VARCHAR(150)   NOT NULL,
    description  TEXT,
    category_id  INT REFERENCES product_categories(id) ON DELETE SET NULL,
    unit_price   NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
    stock_qty    INT            DEFAULT 0 NOT NULL CHECK (stock_qty >= 0),
    campaign_id  INT REFERENCES campaigns(id) ON DELETE SET NULL,
    created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_products_category_id ON products(category_id);

-- 7. LEADS TABLE (Khách hàng tiềm năng)
CREATE TABLE leads (
    id            SERIAL PRIMARY KEY,
    first_name    VARCHAR(50)  NOT NULL,
    last_name     VARCHAR(50)  NOT NULL,
    email         VARCHAR(100) NOT NULL,
    phone         VARCHAR(20)  NOT NULL,
    date_of_birth DATE,
    career        VARCHAR(100),
    address       TEXT,
    campaign_id   INT REFERENCES campaigns(id) ON DELETE SET NULL,
    assigned_to   INT REFERENCES users(id) ON DELETE SET NULL,
    entered_date  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_leads_entered_date ON leads(entered_date DESC);
CREATE INDEX idx_leads_phone_email  ON leads(phone, email);
CREATE INDEX idx_leads_name         ON leads(first_name, last_name);

-- 8. OPPORTUNITIES TABLE (Cơ hội bán hàng)
CREATE TABLE opportunities (
    id                  SERIAL PRIMARY KEY,
    lead_id             INT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    product_id          INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity            INT         DEFAULT 1 NOT NULL CHECK (quantity > 0),
    expected_close_date DATE,
    status              opp_status  DEFAULT 'NEW' NOT NULL,
    notes               TEXT,
    created_by          INT REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMP   DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at          TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_opportunities_created_at ON opportunities(created_at DESC);
CREATE INDEX idx_opp_lead_product ON opportunities(lead_id, product_id);

-- 9. FOLLOW_UPS TABLE (Nhật ký chăm sóc cơ hội)
CREATE TABLE follow_ups (
    id                SERIAL PRIMARY KEY,
    opportunity_id    INT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    follow_date       TIMESTAMP   DEFAULT CURRENT_TIMESTAMP NOT NULL,
    contact_method    VARCHAR(50) DEFAULT 'PHONE',
    content           TEXT        NOT NULL,
    customer_response TEXT,
    next_plan         TEXT,
    created_by        INT REFERENCES users(id) ON DELETE SET NULL
);

-- 10. ORDERS TABLE (Đơn hàng sau khi Make an Order)
CREATE TABLE orders (
    id               SERIAL PRIMARY KEY,
    order_code       VARCHAR(50)    UNIQUE NOT NULL,
    opportunity_id   INT UNIQUE REFERENCES opportunities(id) ON DELETE SET NULL,
    lead_id          INT NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
    product_id       INT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity         INT            NOT NULL CHECK (quantity > 0),
    unit_price       NUMERIC(15, 2) NOT NULL,
    total_amount     NUMERIC(15, 2) NOT NULL,
    order_date       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP NOT NULL,
    payment_info     TEXT           NOT NULL,
    shipping_address TEXT           NOT NULL,
    status           order_status   DEFAULT 'COMPLETED' NOT NULL,
    created_by       INT REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_orders_order_date ON orders(order_date DESC);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_lead_id    ON orders(lead_id);

-- 11. SALE_FORECASTS TABLE (Kế hoạch doanh số 12 tháng năm tài chính)
CREATE TABLE sale_forecasts (
    id            SERIAL PRIMARY KEY,
    fiscal_year   INT            NOT NULL,
    month         INT            NOT NULL CHECK (month BETWEEN 1 AND 12),
    target_amount NUMERIC(15, 2) NOT NULL CHECK (target_amount >= 0),
    created_by    INT REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (fiscal_year, month)
);

-- 12. SALESMAN_PRODUCTS TABLE (Phân quyền sản phẩm cho Nhân viên bán hàng)
CREATE TABLE salesman_products (
    id          SERIAL PRIMARY KEY,
    user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    assigned_by INT REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, product_id)
);
CREATE INDEX idx_salesman_products_user ON salesman_products(user_id);
CREATE INDEX idx_salesman_products_product ON salesman_products(product_id);
