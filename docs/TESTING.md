<!-- Chức năng: Chiến lược kiểm thử: quy định công cụ test, cấu trúc mock dữ liệu và tiêu chí nghiệm thu (Pass criteria) -->

# CHIẾN LƯỢC KIỂM THỬ - ZEN CRM

> Quy định công cụ test, cấu trúc mock dữ liệu, và tiêu chí nghiệm thu (Pass criteria).  
> Căn cứ: SRS Version 1.1 — 15 tiêu chí nghiệm thu (AC-01 → AC-15)

---

## 1. CÔNG CỤ KIỂM THỬ

| Tầng | Công cụ | Mục đích |
|:---|:---|:---|
| **Harness (Root)** | `node:test` (native) | Kiểm tra tính toàn vẹn cấu trúc harness, feature_list.json, DB schema |
| **Backend Unit** | `node:test` hoặc Jest | Kiểm tra logic controller, middleware, utility functions |
| **Backend Integration** | `supertest` + `node:test` | Kiểm tra endpoint API end-to-end (HTTP request → response) |
| **Frontend** | Vitest + React Testing Library | Kiểm tra render component, form interaction, route guard |
| **E2E (Optional)** | Manual testing / curl | Kiểm tra kịch bản bảo vệ 6 bước (AC-01 → AC-15) |

---

## 2. CẤU TRÚC THƯ MỤC KIỂM THỬ

```plaintext
tests/                              # Root-level harness tests
├── harness.test.js                 # Kiểm tra feature_list.json, required docs, DB schema
└── acceptance-criteria.test.js     # Kiểm tra 15 tiêu chí nghiệm thu AC

backend/tests/                      # Backend-specific tests
├── auth.test.js                    # Login, JWT, forgot/reset password
├── user.test.js                    # Admin user management
├── lead.test.js                    # CRUD Lead, duplicate check, pagination
├── opp.test.js                     # CRUD Opportunity, follow-up
├── order.test.js                   # Make order transaction
├── product.test.js                 # CRUD Product & Category
├── campaign.test.js                # CRUD Campaign, report
└── forecast.test.js                # Setup plan, performance report

frontend/tests/                     # Frontend-specific tests
├── Login.test.jsx                  # Form đăng nhập
├── LeadList.test.jsx               # Bảng Lead, phân trang, tìm kiếm
├── PrivateRoute.test.jsx           # Route guard redirect
└── AuthContext.test.jsx            # Idle timeout, login/logout state
```

---

## 3. CẤU TRÚC MOCK DỮ LIỆU

### Mock Users (3 vai trò chuẩn):
```javascript
const mockUsers = {
  admin:       { id: 1, email: 'admin@zencrm.vn',   role: 'ADMIN',        full_name: 'Admin Zen' },
  manager:     { id: 2, email: 'manager@zencrm.vn', role: 'SALE_MANAGER', full_name: 'Manager Zen' },
  salesman:    { id: 3, email: 'sales@zencrm.vn',   role: 'SALESMAN',     full_name: 'Salesman Zen' },
};
```

### Mock JWT Token:
```javascript
const mockToken = jwt.sign({ id: 1, email: 'admin@zencrm.vn', role: 'ADMIN' }, 'test-secret', { expiresIn: '1h' });
```

---

## 4. TIÊU CHÍ NGHIỆM THU (Acceptance Criteria)

| Mã | Tiêu chí | SRS Ref | Lệnh kiểm tra |
|:---|:---|:---|:---|
| AC-01 | Đăng nhập thành công trả JWT Token | 3.13 | `curl POST /api/auth/login` |
| AC-02 | Quên mật khẩu gửi email SMTP | 3.14 | `curl POST /api/auth/forgot-password` |
| AC-03 | Admin tạo tài khoản và gán Role | 2.1 | `curl POST /api/admin/users` |
| AC-04 | Admin toggle Active/Inactive | 2.1 | `curl PATCH /api/admin/users/:id/status` |
| AC-05 | Tạo Lead + kiểm tra trùng SĐT/Email | 3.1, 3.5 | `curl POST /api/leads` (409 nếu trùng) |
| AC-06 | Danh sách 20 Lead, sort, filter, search | 3.2, 3.3 | `curl GET /api/leads?page=1&search=` |
| AC-07 | Tạo Cơ hội liên kết Lead + Product | 3.6 | `curl POST /api/opportunities` |
| AC-08 | Ghi nhật ký Follow-up | 3.11 | `curl POST /api/opportunities/:id/follow-ups` |
| AC-09 | Make Order: Transaction, trừ kho, tạo đơn | 3.12 | `curl POST /api/opportunities/:id/make-order` |
| AC-10 | Make Order rollback khi hết hàng | 3.12 | Test với stock_qty = 0 |
| AC-11 | CRUD Sản phẩm + lọc theo Danh mục | 3.15 | `curl GET /api/products?category_id=` |
| AC-12 | Campaign Performance Report | 3.19 | `curl GET /api/campaigns/:id/report` |
| AC-13 | Forecast: Setup Plan 12 tháng | 3.20 | `curl POST /api/forecasts/setup` |
| AC-14 | Performance Report: Plan vs Actual | 3.21 | `curl GET /api/forecasts/performance?year=` |
| AC-15 | Auto-logout sau 30 phút không tương tác | 5.3 | Manual test trên browser |

---

## 5. LỆNH CHẠY KIỂM THỬ

```bash
# Chạy toàn bộ (harness + backend + frontend)
./test.sh

# Chạy riêng harness tests
node --test tests/*.test.js

# Chạy riêng backend tests
cd backend && npm test

# Chạy riêng frontend tests
cd frontend && npm test

# Kiểm tra tổng thể hệ thống
./init.sh
```

---

## 6. TIÊU CHÍ PASS/FAIL

- ✅ **PASS:** Tất cả test cases pass, không có error, `./init.sh` hoàn thành sạch
- ❌ **FAIL:** Bất kỳ test case nào fail, hoặc `./init.sh` trả exit code ≠ 0
- ⚠️ **WARNING:** Test pass nhưng có cảnh báo (deprecated, performance) — ghi vào `tech-debt-tracker.md`
