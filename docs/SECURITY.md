<!-- Chức năng: Quy chuẩn an toàn: cơ chế xác thực JWT, mã hóa mật khẩu, phân quyền Role, chống tấn công (XSS/SQLi) -->

# QUY CHUẨN AN TOÀN & BẢO MẬT - ZEN CRM

> Cơ chế xác thực, mã hóa, phân quyền, và chống tấn công cho toàn hệ thống.  
> Căn cứ: SRS Version 1.1 — Mục 5 (Security Requirements)

---

## 1. XÁC THỰC (Authentication)

### JWT Bearer Token
- **Thuật toán:** HS256 (HMAC-SHA256)
- **Secret key:** Biến môi trường `JWT_SECRET` (tối thiểu 32 ký tự ngẫu nhiên)
- **Thời hạn token:** `JWT_EXPIRES_IN` (mặc định `24h`)
- **Vị trí gửi:** Header `Authorization: Bearer <token>`
- **Payload chứa:** `{ id, email, role }` — KHÔNG chứa password hay thông tin nhạy cảm

### Luồng xác thực:
```
POST /api/auth/login (email + password)
    → bcrypt.compare(password, hash)
    → jwt.sign({ id, email, role }, JWT_SECRET, { expiresIn })
    → Trả JWT Token cho Client
    → Client lưu vào localStorage
    → Mọi request sau đính kèm Bearer Token
```

---

## 2. MÃ HÓA MẬT KHẨU

- **Thư viện:** `bcryptjs`
- **Salt rounds:** 10 (cân bằng bảo mật và hiệu năng)
- **Quy tắc:**
  - Mật khẩu LUÔN được hash trước khi lưu vào DB
  - KHÔNG BAO GIỜ lưu plaintext password
  - KHÔNG BAO GIỜ trả password hash trong API response
  - Khi đổi mật khẩu: validate mật khẩu cũ → hash mật khẩu mới → update DB

---

## 3. PHÂN QUYỀN RBAC (Role-Based Access Control)

### Ma trận 3 vai trò:

| Chức năng | ADMIN | SALE_MANAGER | SALESMAN |
|:---|:---:|:---:|:---:|
| Quản trị User | ✅ | ❌ | ❌ |
| CRUD Lead | ✅ | ✅ | ✅ |
| CRUD Opportunity | ✅ | ✅ | ✅ |
| Follow-up & Make Order | ✅ | ✅ | ❌ |
| CRUD Product & Category | ✅ | ✅ | ❌ |
| CRUD Campaign & Report | ✅ | ✅ | ❌ |
| Forecast & Performance | ✅ | ✅ | ❌ |
| General Reports | ✅ | ✅ | ❌ |

### Middleware phân quyền:
```javascript
// role.middleware.js
exports.authorizeRoles = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Không có quyền truy cập.' });
    }
    next();
};
```

---

## 4. CHỐNG TẤN CÔNG

| Loại tấn công | Biện pháp phòng chống |
|:---|:---|
| **SQL Injection** | Parameterized queries (`$1, $2`) — KHÔNG nối chuỗi SQL |
| **XSS** | `helmet()` middleware, không render HTML từ user input |
| **CSRF** | API thuần JSON + Bearer Token (không dùng cookie-based auth) |
| **Brute Force** | Rate limiting (tùy chọn: `express-rate-limit`) |
| **Data Exposure** | Không trả password hash, stack trace, hay DB error chi tiết |

---

## 5. SESSION TIMEOUT (SRS 5.3)

- **Thời gian:** 30 phút không tương tác → tự động logout
- **Cơ chế:** Hook `useIdleTimeout` lắng nghe `mousedown`, `mousemove`, `keydown`, `scroll`, `touchstart`, `click`
- **Cảnh báo:** Component `TimeoutWarning.jsx` hiển thị popup đếm ngược 2 phút trước khi hết hạn
- **Hành động:** Xóa token + user khỏi localStorage → redirect về `/login`

---

## 6. BIẾN MÔI TRƯỜNG NHẠY CẢM

Các biến sau KHÔNG ĐƯỢC commit vào git (phải có trong `.gitignore`):

```env
JWT_SECRET=xxx
DB_PASSWORD=xxx
SMTP_USER=xxx
SMTP_PASS=xxx
```

Chỉ commit file `.env.example` với giá trị placeholder.
