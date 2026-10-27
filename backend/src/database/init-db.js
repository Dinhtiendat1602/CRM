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
        (2, 'SALE_MANAGER', 'Quản lý toàn diện: Khách hàng tiềm năng (Leads), Cơ hội bán hàng (Opportunities), Đơn hàng (Orders), Sản phẩm, Chiến dịch tiếp thị, Dự báo doanh số và Báo cáo thống kê'),
        (3, 'SALESMAN', 'Nhân viên kinh doanh')
      ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description;
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

    // 4. Product Categories (Thiết bị điện tử, Phần mềm bản quyền, Máy ảnh kỹ thuật số)
    await client.query(`
      INSERT INTO product_categories (id, name, description) VALUES
        (1, 'Thiết bị điện tử', 'Laptop, máy tính để bàn, điện thoại thông minh, máy tính bảng và phụ kiện công nghệ cao cấp'),
        (2, 'Phần mềm bản quyền', 'Phần mềm văn phòng, bản quyền hệ điều hành, giải pháp bảo mật và dịch vụ điện toán đám mây'),
        (3, 'Máy ảnh kỹ thuật số', 'Máy ảnh chuyên nghiệp Mirrorless, DSLR, ống kính quang học và phụ kiện quay phim, chụp ảnh')
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description;
    `);

    // 5. Products (Thuộc 3 nhóm danh mục chính)
    await client.query(`
      INSERT INTO products (id, product_code, name, description, category_id, unit_price, stock_qty, campaign_id) VALUES
        -- Thiết bị điện tử
        (1, 'LAPTOP-01', 'Laptop Dell XPS 15 9530', 'Máy tính xách tay cao cấp Intel Core i7, 32GB RAM, 1TB SSD, màn hình 3.5K OLED', 1, 35000000.00, 15, 1),
        (2, 'PHONE-01', 'iPhone 16 Pro Max 256GB', 'Điện thoại Apple iPhone 16 Pro Max khung Titan, Chip A18 Pro, Camera 48MP', 1, 29000000.00, 25, 1),
        (3, 'TABLET-01', 'iPad Pro M4 11 inch Wi-Fi 256GB', 'Máy tính bảng Apple iPad Pro M4 siêu mỏng nhẹ, màn hình Ultra Retina XDR', 1, 26500000.00, 18, 1),
        (4, 'AUDIO-01', 'Tai nghe không dây Sony WH-1000XM5', 'Tai nghe chụp tai chống ồn chủ động cao cấp, âm thanh Hi-Res Audio', 1, 7490000.00, 30, 1),
        
        -- Phần mềm bản quyền
        (5, 'SW-MS365', 'Microsoft 365 Business Standard (1 năm)', 'Bộ ứng dụng văn phòng bản quyền Word, Excel, PowerPoint, Teams và 1TB OneDrive Cloud', 2, 3150000.00, 999, 1),
        (6, 'SW-ADOBE', 'Adobe Creative Cloud All Apps (1 năm)', 'Bản quyền trọn bộ hơn 20 ứng dụng sáng tạo Photoshop, Illustrator, Premiere Pro, After Effects', 2, 15800000.00, 200, 1),
        (7, 'SW-KASP', 'Kaspersky Endpoint Security Cloud (1 năm)', 'Giải pháp bảo mật toàn diện phòng chống ransomware và virus cho doanh nghiệp', 2, 1250000.00, 500, 1),

        -- Máy ảnh kỹ thuật số
        (8, 'CAM-SONY7M4', 'Máy ảnh Sony Alpha A7 IV (Body)', 'Máy ảnh Full-frame cảm biến 33MP Exmor R, quay phim 4K 60p 10-bit, lấy nét AI realtime', 3, 49990000.00, 8, 1),
        (9, 'CAM-CANONR6', 'Máy ảnh Canon EOS R6 Mark II (Body)', 'Máy ảnh không gương lật đa dụng tốc độ chụp 40fps, chống rung IBIS 8 stop, quay 6K RAW', 3, 53500000.00, 6, 1),
        (10, 'CAM-FUJIXT5', 'Máy ảnh Fujifilm X-T5 (Body)', 'Máy ảnh mirrorless cảm biến X-Trans CMOS 5 HR 40.2MP, kiểu dáng hoài cổ đặc trưng', 3, 38900000.00, 10, 1),
        (11, 'LENS-SONY2470', 'Ống kính Sony FE 24-70mm F2.8 GM II', 'Ống kính zoom tiêu chuẩn cao cấp dòng G Master thế hệ thứ 2 cho ngàm Sony E', 3, 45000000.00, 12, 1)
      ON CONFLICT (id) DO UPDATE SET
        product_code = EXCLUDED.product_code,
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        category_id = EXCLUDED.category_id,
        unit_price = EXCLUDED.unit_price,
        stock_qty = EXCLUDED.stock_qty,
        campaign_id = EXCLUDED.campaign_id;
    `);

    // 6. Leads
    await client.query(`
      INSERT INTO leads (id, first_name, last_name, email, phone, date_of_birth, career, address, campaign_id, assigned_to) VALUES
        (1, 'Nguyen', 'Van An', 'an@example.com', '0901111001', '1990-05-15', 'Engineer', '123 Nguyen Hue, Q1, HCM', 1, 3),
        (2, 'Tran', 'Thi Bich', 'bich@example.com', '0901111002', '1988-08-20', 'Marketing Director', '456 Le Loi, Q3, HCM', 1, 3)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 7. Opportunities
    await client.query(`
      INSERT INTO opportunities (id, lead_id, product_id, quantity, expected_close_date, status, notes, created_by) VALUES
        (1, 1, 1, 1, '2026-11-30', 'CONTACTED', 'Khách hàng quan tâm nâng cấp laptop công ty Dell XPS 15', 3),
        (2, 2, 8, 1, '2026-11-20', 'QUALIFIED', 'Khách hàng studio cần trang bị máy ảnh Sony Alpha A7 IV để quay chụp sản phẩm', 3),
        (3, 1, 5, 10, '2026-12-10', 'PROPOSAL', 'Khách hàng quan tâm triển khai gói 10 license Microsoft 365 Business cho phòng kỹ thuật', 3)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 8. Follow-ups
    await client.query(`
      INSERT INTO follow_ups (id, opportunity_id, contact_method, content, customer_response, next_plan, created_by) VALUES
        (1, 1, 'PHONE', 'Gọi điện giới thiệu cấu hình Laptop Dell XPS 15', 'Khách muốn xem demo thực tế tại công ty', 'Hẹn demo tại văn phòng khách vào tuần tới', 3),
        (2, 2, 'MEETING', 'Gặp gỡ trực tiếp tại studio khách hàng và trải nghiệm thực tế máy ảnh Sony Alpha A7 IV', 'Khách hàng rất hài lòng về màu ảnh và khả năng lấy nét tự động, đang chốt ngân sách duyệt mua', 'Gửi báo giá combo kèm ống kính Sony FE 24-70mm GM II', 3),
        (3, 3, 'EMAIL', 'Gửi bảng báo giá chi tiết và hướng dẫn triển khai gói Microsoft 365 Business Standard', 'Khách hàng đã nhận mail và đang trình giám đốc công nghệ duyệt chi', 'Follow-up lại qua điện thoại vào thứ Sáu', 3)
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
  (2, 'SALE_MANAGER', 'Quản lý toàn diện: Khách hàng tiềm năng (Leads), Cơ hội bán hàng (Opportunities), Đơn hàng (Orders), Sản phẩm, Chiến dịch tiếp thị, Dự báo doanh số và Báo cáo thống kê'),
  (3, 'SALESMAN', 'Nhân viên kinh doanh')
ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description;

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
