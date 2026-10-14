<!-- Chức năng: Kiến trúc tổng thể: sơ đồ luồng dữ liệu, cấu trúc module, kết nối FE - BE - Database -->

# KIẾN TRÚC TỔNG THỂ - ZEN CRM

> **Pattern:** Clean MVC (Backend) + Component-Based (Frontend)  
> **Stack:** Node.js/Express + React 18/Vite + PostgreSQL  
> **Căn cứ:** SRS Version 1.1

---

## 1. SƠ ĐỒ LUỒNG DỮ LIỆU TỔNG QUÁT

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                        │
│  React 18 + Vite (:5173)                                        │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌────────────────┐  │
│  │ Pages   │→ │ Hooks    │→ │ API Layer │→ │ Axios Client   │  │
│  │ (JSX)   │  │ (State)  │  │ (*Api.js) │  │ (Bearer Token) │  │
│  └─────────┘  └──────────┘  └───────────┘  └───────┬────────┘  │
└─────────────────────────────────────────────────────┼───────────┘
                                                      │ HTTP/JSON
                                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVER (Express :5000)                       │
│  ┌──────────┐  ┌────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │ Routes   │→ │ Middleware │→ │ Controllers │→ │ DB Query  │  │
│  │ (/api/*) │  │ (Auth/RBAC)│  │ (Business)  │  │ (pg Pool) │  │
│  └──────────┘  └────────────┘  └─────────────┘  └─────┬─────┘  │
└────────────────────────────────────────────────────────┼────────┘
                                                         │ SQL
                                                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL :5432)                   │
│  10 bảng: roles, users, campaigns, product_categories,          │
│           products, leads, opportunities, follow_ups,           │
│           orders, sale_forecasts                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. CẤU TRÚC MODULE BACKEND (Clean MVC)

```plaintext
backend/
├── src/
│   ├── config/          # Cấu hình kết nối: DB Pool, SMTP Mailer
│   ├── controllers/     # Logic nghiệp vụ theo SRS (9 controller files)
│   ├── middlewares/     # Auth JWT, RBAC Role Guard, Global Error Handler
│   ├── routes/          # Định tuyến RESTful API (10 route files → /api/*)
│   ├── utils/           # Validator (email, phone, required fields)
│   ├── app.js           # Express app: CORS, Helmet, Morgan, JSON, Routes
│   └── server.js        # Lắng nghe port 5000
├── seeds/
│   └── seed.sql         # Dữ liệu mẫu: 3 vai trò, 3 tài khoản, sản phẩm, leads
├── package.json
└── .env.example
```

### Luồng xử lý một Request:
```
Client Request → Route → auth.middleware (JWT verify)
    → role.middleware (RBAC check) → Controller (business logic)
    → db.query (PostgreSQL) → JSON Response
```

---

## 3. CẤU TRÚC MODULE FRONTEND (Component-Based)

```plaintext
frontend/
├── src/
│   ├── api/             # Axios Client + 10 API modules gọi Backend
│   ├── components/      # UI tái sử dụng: Layout, Common (Table, Modal, Pagination)
│   ├── context/         # AuthContext: user, token, login(), logout()
│   ├── hooks/           # useIdleTimeout (30-min auto-logout SRS 5.3)
│   ├── pages/           # 10 nhóm trang theo module nghiệp vụ
│   ├── routes/          # AppRoutes, PrivateRoute, RoleRoute (RBAC guard)
│   ├── App.jsx          # Root: AuthProvider + Router
│   ├── main.jsx         # Entry point: ReactDOM.createRoot
│   └── index.css        # Global CSS: Variables, Reset, Typography
├── index.html
├── vite.config.js
├── .env                 # VITE_API_URL=http://localhost:5000/api
└── package.json
```

---

## 4. MA TRẬN KẾT NỐI MODULE

| Frontend Module | Backend Route | DB Tables | SRS Ref |
|:---|:---|:---|:---|
| Auth (Login, Forgot/Reset PW) | `/api/auth/*` | users, roles | 3.13, 3.14 |
| Admin (User Management) | `/api/admin/*` | users, roles | 2.1 |
| Leads | `/api/leads/*` | leads, campaigns, users | 3.1-3.5 |
| Opportunities + Follow-up | `/api/opportunities/*` | opportunities, follow_ups, leads, products | 3.6-3.11 |
| Orders (Make Order) | `/api/orders/*` + `make-order` | orders, opportunities, products | 3.12 |
| Products + Categories | `/api/products/*` + `/api/categories/*` | products, product_categories | 3.15-3.17 |
| Campaigns + Report | `/api/campaigns/*` | campaigns, leads, opportunities | 3.18-3.19 |
| Forecast + Performance | `/api/forecasts/*` | sale_forecasts, orders | 3.20-3.21 |
| General Reports | `/api/reports/*` | leads, orders, products | 2.1 |

---

## 5. QUY ƯỚC KẾT NỐI & PORT

| Thành phần | Port | URL |
|:---|:---|:---|
| Frontend (Vite Dev Server) | `5173` | `http://localhost:5173` |
| Backend (Express API) | `5000` | `http://localhost:5000/api` |
| PostgreSQL Database | `5432` | `localhost:5432/zen_crm` |
| SMTP (Mailtrap/Gmail) | `587` | Cấu hình qua `.env` |

---

## 6. NGUYÊN TẮC KIẾN TRÚC CỐT LÕI

1. **Phân tầng rõ ràng (Separation of Concerns):** Route → Middleware → Controller → DB. Không gọi DB trực tiếp từ Route.
2. **Stateless Authentication:** JWT Bearer Token trong header `Authorization`. Không dùng session server-side.
3. **RBAC 3 vai trò:** ADMIN > SALE_MANAGER > SALESMAN. Phân quyền qua `role.middleware.js`.
4. **Database Transaction:** Thao tác chốt đơn (Make Order) phải dùng BEGIN/COMMIT/ROLLBACK với Row-level Lock.
5. **API Response Format chuẩn:** `{ success: boolean, message?: string, data?: any }`.
6. **Frontend State Management:** React Context API (AuthContext). Không dùng Redux.
7. **Auto-logout 30 phút:** Hook `useIdleTimeout` lắng nghe sự kiện tương tác (SRS 5.3).

> **Tài liệu chi tiết:** Xem [docs/references/backend-architecture-original.md](docs/references/backend-architecture-original.md) cho đặc tả API đầy đủ và [docs/FRONTEND.md](docs/FRONTEND.md) cho thiết kế UI/UX.
