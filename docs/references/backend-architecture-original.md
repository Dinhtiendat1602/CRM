<!-- Chức năng: Tài liệu đối chiếu kiến trúc Backend Express và đặc tả RESTful API gốc -->

# KIẾN TRÚC BACKEND VÀ ĐẶC TẢ RESTFUL API (NODE.JS + EXPRESS)
> **Dự án:** Zen CRM  
> **Pattern:** Clean MVC Pattern  
> **Database Client:** PostgreSQL Connection Pool (`pg`)  
> **Port:** `5000`  
> **Căn cứ:** SRS Version 1.1 — Mục 3.1 → 3.21 & Mục 2.1

---

## 1. CẤU TRÚC THƯ MỤC NGUỒN BACKEND

```plaintext
backend/
├── src/
│   ├── config/
│   │   ├── db.js                  # PostgreSQL Pool connection & helper query
│   │   └── mailer.js              # Nodemailer SMTP configuration (SRS 3.14)
│   ├── controllers/
│   │   ├── auth.controller.js     # Đăng nhập, Xem Profile, Cập nhật Profile, Forget/Reset password (SRS 3.13, 3.14)
│   │   ├── user.controller.js     # Admin: Danh sách, Tạo mới, Reset PW, Active/Deactive, Gán Role (SRS 2.1)
│   │   ├── lead.controller.js     # CRUD Lead, Duplicate check SĐT/Email, Phân trang 20, Sort/Filter (SRS 3.1-3.5)
│   │   ├── opp.controller.js      # CRUD Opportunity, Follow-up, Make an Order (SRS 3.6-3.12)
│   │   ├── order.controller.js    # Xem danh sách & chi tiết đơn hàng (SRS 3.12)
│   │   ├── product.controller.js  # CRUD Sản phẩm, View Opportunity per Product, View Order per Product (SRS 3.15-3.17)
│   │   ├── campaign.controller.js # CRUD Chiến dịch, Campaign Performance Report (SRS 3.18-3.19)
│   │   ├── forecast.controller.js # Setup Plan 12 tháng & Performance Report Plan vs Actual (SRS 3.20-3.21)
│   │   └── report.controller.js   # Báo cáo Lead/Order/Revenue theo Ngày/Tháng/Năm (SRS 2.1)
│   ├── middlewares/
│   │   ├── auth.middleware.js     # Xác thực JWT Bearer Token từ Authorization header
│   │   ├── role.middleware.js     # Phân quyền RBAC: authorizeRoles('ADMIN', 'SALE_MANAGER', 'SALESMAN')
│   │   └── error.middleware.js    # Bắt lỗi toàn cục (Global Error Handler — HTTP 500)
│   ├── routes/
│   │   ├── auth.routes.js         # /api/auth/*
│   │   ├── user.routes.js         # /api/admin/users/*
│   │   ├── lead.routes.js         # /api/leads/*
│   │   ├── opp.routes.js          # /api/opportunities/*
│   │   ├── order.routes.js        # /api/orders/*
│   │   ├── category.routes.js     # /api/categories/* (Danh mục sản phẩm)
│   │   ├── product.routes.js      # /api/products/*
│   │   ├── campaign.routes.js     # /api/campaigns/*
│   │   ├── forecast.routes.js     # /api/forecasts/*
│   │   └── report.routes.js       # /api/reports/*
│   ├── utils/
│   │   └── validator.js           # Validate email format, phone format, required fields (SRS 3.1.2 REQ-2, REQ-3)
│   ├── app.js                     # Khởi tạo Express, gắn CORS, Helmet, Morgan, JSON parser, Routes
│   └── server.js                  # Lắng nghe port 5000
├── seeds/
│   └── seed.sql                   # Dữ liệu mẫu: 1 admin, 1 manager, 1 salesman, 1 campaign, 2 products, 2 leads
├── package.json
└── .env.example
```

---

## 2. MA TRẬN ĐẦY ĐỦ RESTFUL APIS (THEO SRS)

> **Ký hiệu quyền:** `PUBLIC` = không cần token | `AUTH` = cần token bất kỳ role | Tên role cụ thể = phải có đúng role đó.

| Phân hệ | Method | Endpoint | Quyền hạn | SRS Ref | Nghiệp vụ xử lý |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | POST | `/api/auth/login` | PUBLIC | SRS 3.13 | Đăng nhập: trả về JWT Token + thông tin User & Role |
| | POST | `/api/auth/forgot-password` | PUBLIC | SRS 3.14 REQ-1 | Nhập email → kiểm tra → gửi link reset qua SMTP nếu trùng khớp |
| | POST | `/api/auth/reset-password` | PUBLIC | SRS 3.14 REQ-2 | Đặt lại mật khẩu mới qua reset token nhận được trong email |
| | GET | `/api/auth/me` | AUTH | SRS 3.13 | Lấy thông tin User đang đăng nhập (dùng cho AuthContext) |
| | PUT | `/api/auth/profile` | AUTH | SRS 3.13 | Cập nhật Họ tên, SĐT, Mật khẩu của chính mình |
| **Admin / Users** | GET | `/api/admin/users` | ADMIN | SRS 2.1 | Danh sách toàn bộ tài khoản nhân viên trong hệ thống (kèm tên role) |
| | GET | `/api/admin/roles` | ADMIN | SRS 2.1 | Danh sách các vai trò từ bảng `roles` (hỗ trợ dropdown gán role) |
| | POST | `/api/admin/users` | ADMIN | SRS 2.1 | Tạo tài khoản nhân viên mới, gán Role (role_id) ngay khi tạo |
| | PATCH | `/api/admin/users/:id/status` | ADMIN | SRS 2.1 | Toggle Kích hoạt / Khóa tài khoản (`is_active`) |
| | PATCH | `/api/admin/users/:id/role` | ADMIN | SRS 2.1 | Gán / Đổi vai trò người dùng (Assign user role qua `role_id`) |
| | POST | `/api/admin/users/:id/reset-password` | ADMIN | SRS 2.1 | Quản trị viên reset mật khẩu nhân viên trực tiếp |
| **Leads** | GET | `/api/leads` | SALESMAN, SALE_MANAGER, ADMIN | SRS 3.2, 3.3 | Danh sách 20 Leads mới nhất, tìm kiếm `?search=`, lọc `?from_date=&to_date=`, sắp xếp theo `entered_date` |
| | POST | `/api/leads` | SALESMAN, SALE_MANAGER, ADMIN | SRS 3.1 | Thêm mới Lead: Validate fields bắt buộc + Kiểm tra trùng SĐT/Email |
| | GET | `/api/leads/:id` | SALESMAN, SALE_MANAGER, ADMIN | SRS 3.2.3 REQ-4 | Chi tiết Lead + Danh sách Opportunity liên quan |
| | PUT | `/api/leads/:id` | SALESMAN, SALE_MANAGER, ADMIN | SRS 3.4 | Sửa Lead, validate dữ liệu mới |
| | DELETE | `/api/leads/:id` | SALESMAN, SALE_MANAGER, ADMIN | SRS 3.5 | Xóa Lead khỏi CSDL |
| **Opportunities** | GET | `/api/opportunities` | SALESMAN, SALE_MANAGER, ADMIN | SRS 3.7, 3.8 | Danh sách 20 Opp mới nhất, tìm kiếm theo tên Lead hoặc tên SP, lọc theo ngày |
| | POST | `/api/opportunities` | SALESMAN, SALE_MANAGER, ADMIN | SRS 3.6 | Tạo Cơ hội: Lead + Product + Quantity + Expected close date |
| | GET | `/api/opportunities/:id` | SALESMAN, SALE_MANAGER, ADMIN | SRS 3.7.3 REQ-4 | Chi tiết Cơ hội + Toàn bộ lịch sử Follow-up |
| | PUT | `/api/opportunities/:id` | SALESMAN, SALE_MANAGER, ADMIN | SRS 3.9 | Sửa Cơ hội (số lượng, trạng thái, ghi chú) |
| | DELETE | `/api/opportunities/:id` | SALESMAN, SALE_MANAGER, ADMIN | SRS 3.10 | Xóa Cơ hội khỏi CSDL |
| | POST | `/api/opportunities/:id/follow-ups` | SALESMAN, SALE_MANAGER | SRS 3.11 | Thêm nhật ký: Ngày, Kênh liên hệ, Nội dung, Phản hồi khách, Kế hoạch tiếp |
| | POST | `/api/opportunities/:id/make-order` | SALESMAN, SALE_MANAGER | SRS 3.12 | **Make an Order**: kiểm tra kho → trừ kho → tạo Order → cập nhật status `ORDERED` (DB Transaction) |
| **Orders** | GET | `/api/orders` | SALESMAN, SALE_MANAGER, ADMIN | SRS 3.12 | Danh sách đơn hàng đã chốt, lọc theo khoảng thời gian |
| | GET | `/api/orders/:id` | SALESMAN, SALE_MANAGER, ADMIN | SRS 3.12 | Chi tiết đơn hàng: thông tin thanh toán, giao hàng, giá trị |
| **Categories** | GET | `/api/categories` | Tất cả roles | Mở rộng | Danh sách toàn bộ danh mục sản phẩm |
| | POST | `/api/categories` | SALE_MANAGER, ADMIN | Mở rộng | Thêm mới danh mục sản phẩm (tên, mô tả) |
| | PUT | `/api/categories/:id` | SALE_MANAGER, ADMIN | Mở rộng | Cập nhật thông tin danh mục sản phẩm |
| | DELETE | `/api/categories/:id` | SALE_MANAGER, ADMIN | Mở rộng | Xóa danh mục sản phẩm |
| **Products** | GET | `/api/products` | Tất cả roles | SRS 3.15 | Danh mục sản phẩm, tìm kiếm theo `?search=` (tên hoặc mã SP), lọc theo `?category_id=` |
| | POST | `/api/products` | SALE_MANAGER, ADMIN | SRS 3.15 | Thêm sản phẩm mới (mã, tên, đơn giá, tồn kho, chiến dịch) |
| | PUT | `/api/products/:id` | SALE_MANAGER, ADMIN | SRS 3.15 | Cập nhật thông tin/giá/tồn kho sản phẩm |
| | DELETE | `/api/products/:id` | SALE_MANAGER, ADMIN | SRS 3.15 | Xóa sản phẩm |
| | GET | `/api/products/:id/opportunities` | SALE_MANAGER, ADMIN | SRS 3.16 | Liệt kê tất cả Cơ hội đang quan tâm Sản phẩm này |
| | GET | `/api/products/:id/orders` | SALE_MANAGER, ADMIN | SRS 3.17 | Liệt kê tất cả Đơn hàng đã xuất bán Sản phẩm này |
| **Campaigns** | GET | `/api/campaigns` | SALE_MANAGER, ADMIN | SRS 3.18 | Danh sách chiến dịch, tìm kiếm theo `?search=` |
| | POST | `/api/campaigns` | SALE_MANAGER, ADMIN | SRS 3.18 | Thêm chiến dịch mới (tên, mô tả, ngày bắt đầu/kết thúc, ngân sách) |
| | PUT | `/api/campaigns/:id` | SALE_MANAGER, ADMIN | SRS 3.18 | Cập nhật thông tin chiến dịch |
| | DELETE | `/api/campaigns/:id` | SALE_MANAGER, ADMIN | SRS 3.18 | Xóa chiến dịch |
| | GET | `/api/campaigns/:id/report` | SALE_MANAGER, ADMIN | SRS 3.19 | **Campaign Performance Report**: Tổng số & danh sách Lead, Opportunity thu được từ chiến dịch |
| **Forecast** | POST | `/api/forecasts/setup` | SALE_MANAGER, ADMIN | SRS 3.20 | **Setup New Plan**: Lưu/Cập nhật chỉ tiêu 12 tháng của năm tài chính được chọn |
| | GET | `/api/forecasts/performance` | SALE_MANAGER, ADMIN | SRS 3.21 | **Performance Report**: Bảng đối soát `Month` \| `Plan($)` \| `Actually Value($)` \| `%` |
| **Reports** | GET | `/api/reports/leads` | SALE_MANAGER, ADMIN | SRS 2.1 | Thống kê Lead theo `?period=day/month/year` |
| | GET | `/api/reports/orders` | SALE_MANAGER, ADMIN | SRS 2.1 | Thống kê Order theo `?period=day/month/year` |
| | GET | `/api/reports/revenue` | SALE_MANAGER, ADMIN | SRS 2.1 | Doanh thu theo `?period=day/month/year` phân tách theo từng sản phẩm |

---

## 3. LOGIC NGHIỆP VỤ TRỌNG TÂM (CORE BUSINESS LOGIC)

### A. Kiểm tra Trùng lặp & Phân trang 20 Lead (`lead.controller.js`)
```javascript
const db = require('../config/db');

// SRS 3.1: Add a New Lead — REQ-3 (validate) + REQ-4 (duplicate check)
exports.createLead = async (req, res) => {
    try {
        const { first_name, last_name, phone, email, date_of_birth, career, address, campaign_id } = req.body;

        // REQ-2: Validate trường bắt buộc
        if (!first_name || !last_name || !phone || !email) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các trường bắt buộc (*).' });
        }

        // REQ-4: Kiểm tra trùng lặp SĐT hoặc Email
        const dupCheck = await db.query(
            'SELECT id, first_name, last_name, phone, email FROM leads WHERE email = $1 OR phone = $2',
            [email.trim().toLowerCase(), phone.trim()]
        );
        if (dupCheck.rows.length > 0) {
            return res.status(409).json({ 
                success: false,
                message: 'Phát hiện dữ liệu trùng lặp! Email hoặc Số điện thoại đã tồn tại.',
                duplicateLead: dupCheck.rows[0]
            });
        }

        const result = await db.query(
            `INSERT INTO leads (first_name, last_name, phone, email, date_of_birth, career, address, campaign_id, assigned_to)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;`,
            [first_name.trim(), last_name.trim(), phone.trim(), email.trim().toLowerCase(),
             date_of_birth || null, career || null, address || null, campaign_id || null, req.user.id]
        );
        return res.status(201).json({ success: true, message: 'Tạo Lead thành công.', data: result.rows[0] });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// SRS 3.2 + 3.3: View & Search Leads — REQ-1 (20 dòng) + REQ-2 (sort) + REQ-3 (filter)
exports.getLeads = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 20; // SRS 3.2.3 REQ-1: mặc định 20 bản ghi mới nhất
        const offset = (page - 1) * limit;

        const { search, from_date, to_date, sort_order = 'DESC' } = req.query;
        let queryParams = [];
        let whereClauses = [];

        // SRS 3.3: Tìm kiếm theo tên hoặc một phần tên
        if (search) {
            queryParams.push(`%${search.trim()}%`);
            whereClauses.push(`(CONCAT(l.first_name, ' ', l.last_name) ILIKE $${queryParams.length})`);
        }

        // SRS 3.2.3 REQ-3: Lọc theo entered_date
        if (from_date && to_date) {
            queryParams.push(from_date, to_date);
            whereClauses.push(`l.entered_date::date BETWEEN $${queryParams.length - 1} AND $${queryParams.length}`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        // SRS 3.2.3 REQ-2: Sắp xếp theo entered_date
        const orderSql = `ORDER BY l.entered_date ${sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}`;

        const dataQuery = `
            SELECT l.*, c.name AS campaign_name, u.full_name AS assigned_name 
            FROM leads l
            LEFT JOIN campaigns c ON l.campaign_id = c.id
            LEFT JOIN users u ON l.assigned_to = u.id
            ${whereSql} ${orderSql}
            LIMIT ${limit} OFFSET ${offset};
        `;
        const countQuery = `SELECT COUNT(*) FROM leads l ${whereSql};`;

        const [leadsData, totalCount] = await Promise.all([
            db.query(dataQuery, queryParams),
            db.query(countQuery, queryParams)
        ]);

        const totalRecords = parseInt(totalCount.rows[0].count);
        return res.json({
            success: true, currentPage: page, limit,
            totalRecords, totalPages: Math.ceil(totalRecords / limit),
            data: leadsData.rows
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
```

### B. Make an Order bằng DB Transaction (`opp.controller.js`)
```javascript
// SRS 3.12: Make an Order — REQ-1: Chuyển status + Thêm thông tin thanh toán/giao hàng
// Nghiệp vụ bổ sung từ phân tích: kiểm tra tồn kho, trừ kho, tạo Order trong 1 Transaction
exports.makeOrder = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { id: opportunity_id } = req.params;
        const { shipping_address, payment_info } = req.body;

        if (!shipping_address || !payment_info) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp địa chỉ giao hàng và thông tin thanh toán.' });
        }

        await client.query('BEGIN');

        // Lock row để tránh race condition khi nhiều request cùng chốt 1 Opp
        const oppRes = await client.query(`
            SELECT o.id, o.lead_id, o.product_id, o.quantity, o.status,
                   p.unit_price, p.stock_qty, p.name AS product_name
            FROM opportunities o
            JOIN products p ON o.product_id = p.id
            WHERE o.id = $1 FOR UPDATE;
        `, [opportunity_id]);

        if (oppRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Không tìm thấy cơ hội bán hàng!' });
        }

        const opp = oppRes.rows[0];

        // Kiểm tra Opp đã được chốt đơn trước đó chưa
        if (opp.status === 'ORDERED') {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Cơ hội này đã được chuyển thành đơn hàng rồi!' });
        }

        // Kiểm tra tồn kho đủ không
        if (opp.stock_qty < opp.quantity) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: `Tồn kho không đủ! "${opp.product_name}" hiện còn ${opp.stock_qty} chiếc, cần ${opp.quantity} chiếc.`
            });
        }

        const totalAmount = opp.quantity * parseFloat(opp.unit_price);
        const orderCode = `ORD-${Date.now().toString().slice(-8)}`;

        // 1. Tạo bản ghi Order mới
        const orderRes = await client.query(`
            INSERT INTO orders (order_code, opportunity_id, lead_id, product_id, quantity, unit_price, total_amount, shipping_address, payment_info, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;
        `, [orderCode, opp.id, opp.lead_id, opp.product_id, opp.quantity,
            opp.unit_price, totalAmount, shipping_address, payment_info, req.user.id]);

        // 2. Cập nhật trạng thái Opportunity thành ORDERED
        await client.query('UPDATE opportunities SET status = $1, updated_at = NOW() WHERE id = $2;', ['ORDERED', opp.id]);

        // 3. Trừ tồn kho sản phẩm
        await client.query('UPDATE products SET stock_qty = stock_qty - $1, updated_at = NOW() WHERE id = $2;', [opp.quantity, opp.product_id]);

        await client.query('COMMIT');
        return res.status(201).json({ success: true, message: 'Tạo đơn hàng thành công!', order: orderRes.rows[0] });

    } catch (error) {
        await client.query('ROLLBACK');
        return res.status(500).json({ success: false, error: error.message });
    } finally {
        client.release();
    }
};
```

### C. Campaign Performance Report (`campaign.controller.js`)
```javascript
// SRS 3.19: Campaign Performance Report
// REQ-1: List all Leads & count Opportunities from the campaign
exports.getCampaignReport = async (req, res) => {
    try {
        const { id } = req.params;

        const leadStats = await db.query(`
            SELECT COUNT(*) AS total_leads FROM leads WHERE campaign_id = $1;
        `, [id]);

        const oppStats = await db.query(`
            SELECT COUNT(*) AS total_opportunities
            FROM opportunities o
            JOIN leads l ON o.lead_id = l.id
            WHERE l.campaign_id = $1;
        `, [id]);

        const leadList = await db.query(`
            SELECT l.id, l.first_name, l.last_name, l.email, l.phone, l.entered_date,
                   u.full_name AS assigned_name,
                   COUNT(o.id) AS opportunity_count
            FROM leads l
            LEFT JOIN users u ON l.assigned_to = u.id
            LEFT JOIN opportunities o ON o.lead_id = l.id
            WHERE l.campaign_id = $1
            GROUP BY l.id, u.full_name
            ORDER BY l.entered_date DESC;
        `, [id]);

        return res.json({
            success: true,
            summary: {
                total_leads: parseInt(leadStats.rows[0].total_leads),
                total_opportunities: parseInt(oppStats.rows[0].total_opportunities)
            },
            leads: leadList.rows
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
```

### D. Performance Report: Plan vs Actually Value (`forecast.controller.js`)
```javascript
// SRS 3.21: Performance Report — Bảng 12 tháng: Month | Plan($) | Actually Value($) | %
// Actually Value = SUM(orders.total_amount) trong tháng-năm tương ứng
exports.getPerformanceReport = async (req, res) => {
    try {
        const fiscal_year = parseInt(req.query.year) || new Date().getFullYear();

        const forecastData = await db.query(
            `SELECT month, target_amount FROM sale_forecasts WHERE fiscal_year = $1 ORDER BY month;`,
            [fiscal_year]
        );

        const actualData = await db.query(`
            SELECT EXTRACT(MONTH FROM order_date)::INT AS month,
                   SUM(total_amount) AS actual_value
            FROM orders
            WHERE EXTRACT(YEAR FROM order_date) = $1 AND status != 'CANCELLED'
            GROUP BY month ORDER BY month;
        `, [fiscal_year]);

        const actualMap = {};
        actualData.rows.forEach(r => { actualMap[r.month] = parseFloat(r.actual_value); });

        const report = Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            const planRow = forecastData.rows.find(r => r.month === month);
            const plan = planRow ? parseFloat(planRow.target_amount) : 0;
            const actual = actualMap[month] || 0;
            const percent = plan > 0 ? ((actual / plan) * 100).toFixed(1) : '0.0';
            return { month, plan, actual_value: actual, percent: parseFloat(percent) };
        });

        return res.json({ success: true, fiscal_year, report });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
```

---

## 4. CẤU HÌNH KỸ THUẬT TRỌNG TÂM

### A. Database Connection Pool (`src/config/db.js`)
```javascript
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 10,              // Tối đa 10 kết nối đồng thời
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,
};
```

### B. Nodemailer SMTP (`src/config/mailer.js`)
```javascript
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendResetPasswordEmail = async (toEmail, resetLink) => {
    await transporter.sendMail({
        from:    `"Zen CRM" <${process.env.SMTP_USER}>`,
        to:      toEmail,
        subject: 'Zen CRM — Đặt lại mật khẩu của bạn',
        html: `
            <h2>Yêu cầu đặt lại mật khẩu</h2>
            <p>Nhấn vào liên kết dưới đây để đặt lại mật khẩu (hết hạn sau 15 phút):</p>
            <a href="${resetLink}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">
                Đặt lại mật khẩu
            </a>
            <p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
        `,
    });
};

module.exports = { sendResetPasswordEmail };
```

### C. Express App Entry (`src/app.js`)
```javascript
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth',     require('./routes/auth.routes'));
app.use('/api/admin',    require('./routes/user.routes'));
app.use('/api/leads',    require('./routes/lead.routes'));
app.use('/api/opportunities', require('./routes/opp.routes'));
app.use('/api/orders',   require('./routes/order.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/products',   require('./routes/product.routes'));
app.use('/api/campaigns',require('./routes/campaign.routes'));
app.use('/api/forecasts',require('./routes/forecast.routes'));
app.use('/api/reports',  require('./routes/report.routes'));

// Global error handler
app.use(require('./middlewares/error.middleware'));

module.exports = app;
```

### D. RBAC Middleware (`src/middlewares/role.middleware.js`)
```javascript
exports.authorizeRoles = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này.' });
    }
    next();
};
```
