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

---

## 7. BẢO MẬT & PHÂN QUYỀN TRỢ LÝ AI AGENT (Chatbot Security & RBAC/RLS)

Hệ thống Trợ lý AI (Zen AI Assistant — Python FastAPI, LangGraph và Google Gemini) được thiết kế theo nguyên tắc **Bảo mật đa tầng (Defense-in-Depth)** và **Phân tách Trách nhiệm Đọc - Ghi (CQRS)**:

### 7.1. Bốn Lớp Khóa Bảo Mật Cho Chatbot:

1. **Lớp 1: Xác thực Danh tính & Chuyển tiếp Token (JWT Context Forwarding):**
   - Khi Client gửi tin nhắn tới AI Agent qua `POST /api/chat`, Bearer Token được đính kèm và giải mã thông qua ContextVar (`get_current_user_context()`).
   - Mọi Tool đều biết chính xác User ID, Username và Role của người đang trò chuyện.

2. **Lớp 2: Phân tách Đồ thị LangGraph Độc lập (Graph & Tool Allocation Isolation):**
   - Tại `ai-agent-service/src/tools/__init__.py`, hệ thống biên dịch 3 đồ thị trạng thái LangGraph độc lập cho 3 vai trò:
     - **`ADMIN`:** Chỉ được cấp duy nhất 1 tool giám sát kỹ thuật (`get_admin_system_overview`). Hoàn toàn không có công cụ đọc hay ghi dữ liệu kinh doanh.
     - **`SALE_MANAGER`:** Được cấp toàn bộ 10 công cụ CRM (Query, Lead, Opportunity, Follow-up).
     - **`SALESMAN`:** Chỉ được cấp 8 công cụ phục vụ bán hàng cá nhân. **Bị loại bỏ hoàn toàn** tool xem doanh thu toàn công ty (`get_revenue_and_forecast`) và tool xem ngân sách tiếp thị (`get_campaigns_overview`).
   - Mô hình Gemini của Salesman thậm chí **không hề biết sự tồn tại của các công cụ cấp Quản lý**, triệt tiêu nguy cơ rò rỉ dữ liệu qua tấn công Prompt Injection / Jailbreak.

3. **Lớp 3: Kiểm soát Cấp Công cụ & Bảo mật Dòng dữ liệu (Tool-level RBAC & RLS):**
   - **Chặn vai trò cấp hàm:** Trong `query_tools.py`, nếu Salesman cố tình gọi hàm doanh số hoặc ngân sách, mã nguồn Python kiểm tra `if user["role"] == "SALESMAN"` và từ chối ngay lập tức: *"Quyền truy cập bị từ chối"*.
   - **Bảo mật dòng dữ liệu (Row-Level Security):**
     - Khi Salesman tra cứu khách hàng (`get_leads_summary`): Tự động ép điều kiện `assigned_to = user_id`.
     - Khi Salesman tra cứu cơ hội (`get_opportunities_overview`): Tự động ép điều kiện `created_by = user_id`.
     - Khi tra cứu danh mục sản phẩm (`get_products_and_inventory`): Backend Express tự động lọc theo danh mục sản phẩm được phân quyền bán trong bảng `salesman_products`.
     - Khi Salesman ghi chăm sóc (`log_follow_up`) hoặc tạo cơ hội (`create_opportunity`): Tool kiểm tra quyền sở hữu đối với Lead/Cơ hội, từ chối nếu khách hàng thuộc quyền phụ trách của nhân viên khác.

4. **Lớp 4: Cách ly Bộ nhớ Hội thoại (Session & Chat History Isolation):**
   - Bộ nhớ hội thoại (Redis Memory / File Checkpointer) lưu trữ với khóa `role_userId_sessionId`.
   - Nhân viên này tuyệt đối không thể đọc hay can thiệp vào lịch sử chat của nhân viên khác.

### 7.2. Kiến Trúc CQRS Trong Các Tool (Tại sao Tra cứu dùng SQL, Tạo mới gọi API?):

| Nhóm Tool | File nguồn | Thao tác thực tế | Lý do kiến trúc |
|:---|:---|:---|:---|
| **Query Tools (Tra cứu - Đọc)** | `query_tools.py`, `admin_tools.py` | Truy vấn SQL có kẹp điều kiện RLS (`WHERE assigned_to = %s`) | **Tối ưu độ trễ (Latency < 2ms):** AI không tốn thời gian gọi qua nhiều chặng mạng (network hop). **Tối ưu Token:** Viết SQL tổng hợp (`GROUP BY`, `SUM`, `COUNT`) trả về dữ liệu tinh gọn, tránh tràn Context Window. |
| **Action Tools (Tác vụ - Ghi)** | `lead_tools.py`, `order_tools.py` | Gọi Express REST API (`POST /api/...`) kèm JWT Bearer Token | **Đảm bảo tính toàn vẹn nghiệp vụ:** Tận dụng 100% luật nghiệp vụ của Backend Express (chống trùng SĐT/Email BR-02 trả 409 Conflict, kiểm tra phân quyền sản phẩm 403 Forbidden, giao dịch trừ kho ACID có khóa dòng). |

