const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('🚀 [Init DB] Đang khởi tạo Database Schema...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schemaSql);
    console.log('✅ [Init DB] 10 Bảng DDL & Index đã được tạo thành công!');

    console.log('🌱 [Init DB] Đang tạo dữ liệu mẫu (Seed Data)...');
    const passwordHash = await bcrypt.hash('11111111', 10);

    // 1. Roles
    await client.query(`
      INSERT INTO roles (id, name, description) VALUES
        (1, 'ADMIN', 'Quản trị viên toàn quyền hệ thống'),
        (2, 'SALE_MANAGER', 'Trưởng phòng kinh doanh / Quản lý bán hàng'),
        (3, 'SALESMAN', 'Nhân viên kinh doanh')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 2. Users (Admin, Manager, Salesman)
    await client.query(`
      INSERT INTO users (username, email, password_hash, full_name, phone, role_id) VALUES
        ('admin', 'admin@zencrm.com', $1, 'System Administrator', '0900000001', 1),
        ('manager', 'manager@zencrm.com', $1, 'Nguyen Van Manager', '0900000002', 2),
        ('salesman', 'salesman@zencrm.com', $1, 'Tran Thi Salesman', '0900000003', 3)
      ON CONFLICT (username) DO NOTHING;
    `, [passwordHash]);

    // 3. Campaigns
    await client.query(`
      INSERT INTO campaigns (id, name, description, start_date, end_date, budget, created_by) VALUES
        (1, 'Campaign Q4 2026', 'Chiến dịch bán hàng quý 4 năm 2026', '2026-10-01', '2026-12-31', 50000.00, 1)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 4. Product Categories
    await client.query(`
      INSERT INTO product_categories (id, name, description) VALUES
        (1, 'Thiết bị điện tử', 'Laptop, máy tính bảng, điện thoại và phụ kiện công nghệ'),
        (2, 'Phần mềm & Bản quyền', 'Phần mềm CRM, bản quyền hệ điều hành, dịch vụ cloud')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 5. Products
    await client.query(`
      INSERT INTO products (id, product_code, name, description, category_id, unit_price, stock_qty, campaign_id) VALUES
        (1, 'LAPTOP-01', 'Laptop Dell XPS 15', 'Máy tính xách tay cao cấp Dell', 1, 35000000.00, 10, 1),
        (2, 'PHONE-01', 'iPhone 16 Pro Max', 'Điện thoại Apple iPhone 16', 1, 29000000.00, 20, 1)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 6. Leads
    await client.query(`
      INSERT INTO leads (id, first_name, last_name, email, phone, date_of_birth, career, address, campaign_id, assigned_to) VALUES
        (1, 'Nguyen', 'Van An', 'an@example.com', '0901111001', '1990-05-15', 'Engineer', '123 Nguyen Hue, Q1, HCM', 1, 3),
        (2, 'Tran', 'Thi Bich', 'bich@example.com', '0901111002', '1988-08-20', 'Marketing', '456 Le Loi, Q3, HCM', 1, 3)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 7. Opportunities
    await client.query(`
      INSERT INTO opportunities (id, lead_id, product_id, quantity, expected_close_date, status, notes, created_by) VALUES
        (1, 1, 1, 1, '2026-11-30', 'CONTACTED', 'Khách hàng quan tâm nâng cấp laptop công ty', 3)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 8. Follow-ups
    await client.query(`
      INSERT INTO follow_ups (id, opportunity_id, contact_method, content, customer_response, next_plan, created_by) VALUES
        (1, 1, 'PHONE', 'Gọi điện giới thiệu Laptop Dell XPS 15', 'Khách muốn xem demo thực tế', 'Hẹn demo tại văn phòng khách vào tuần tới', 3)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 9. Reset Sequence counters so new inserts have correct IDs
    const tablesWithSerial = ['roles', 'users', 'campaigns', 'product_categories', 'products', 'leads', 'opportunities', 'follow_ups'];
    for (const table of tablesWithSerial) {
      await client.query(`SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE(MAX(id), 1)) FROM ${table};`);
    }

    // 10. Sale Forecasts (12 months for year 2026)
    const forecasts = [
      [2026, 1, 15000.00, 2], [2026, 2, 20000.00, 2], [2026, 3, 25000.00, 2],
      [2026, 4, 10000.00, 2], [2026, 5, 15000.00, 2], [2026, 6, 25000.00, 2],
      [2026, 7, 20000.00, 2], [2026, 8, 15000.00, 2], [2026, 9, 15000.00, 2],
      [2026, 10, 20000.00, 2], [2026, 11, 10000.00, 2], [2026, 12, 15000.00, 2],
    ];

    for (const [year, month, target, createdBy] of forecasts) {
      await client.query(`
        INSERT INTO sale_forecasts (fiscal_year, month, target_amount, created_by)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (fiscal_year, month) DO UPDATE SET target_amount = EXCLUDED.target_amount;
      `, [year, month, target, createdBy]);
    }

    // Save seed.sql file for backup & reference
    const seedsDir = path.join(__dirname, '../../seeds');
    if (!fs.existsSync(seedsDir)) {
      fs.mkdirSync(seedsDir, { recursive: true });
    }
    const seedSqlContent = `-- Dữ liệu seed mẫu tự động sinh
-- Mật khẩu mặc định của 3 tài khoản là: 11111111 (đã băm bcrypt 10 rounds)
INSERT INTO roles (id, name, description) VALUES
  (1, 'ADMIN', 'Quản trị viên toàn quyền hệ thống'),
  (2, 'SALE_MANAGER', 'Trưởng phòng kinh doanh / Quản lý bán hàng'),
  (3, 'SALESMAN', 'Nhân viên kinh doanh')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (username, email, password_hash, full_name, phone, role_id) VALUES
  ('admin', 'admin@zencrm.com', '${passwordHash}', 'System Administrator', '0900000001', 1),
  ('manager', 'manager@zencrm.com', '${passwordHash}', 'Nguyen Van Manager', '0900000002', 2),
  ('salesman', 'salesman@zencrm.com', '${passwordHash}', 'Tran Thi Salesman', '0900000003', 3)
ON CONFLICT (username) DO NOTHING;
`;
    fs.writeFileSync(path.join(seedsDir, 'seed.sql'), seedSqlContent);

    console.log('✅ [Init DB] Seed Data đã được nạp thành công!');
    console.log('🔐 [Init DB] Mật khẩu mặc định cho admin, manager, salesman: 11111111');
  } catch (err) {
    console.error('❌ [Init DB] Lỗi khởi tạo cơ sở dữ liệu:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  initDatabase()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async () => {
      await pool.end();
      process.exit(1);
    });
}

module.exports = { initDatabase };
