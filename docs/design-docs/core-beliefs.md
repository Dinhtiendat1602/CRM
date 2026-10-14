<!-- Chức năng: Các nguyên tắc cốt lõi bất biến: chuẩn RESTful, xử lý transaction, phân tầng trách nhiệm -->

# NGUYÊN TẮC CỐT LÕI BẤT BIẾN - ZEN CRM

> Các quy tắc kiến trúc và kỹ thuật bất biến xuyên suốt toàn bộ dự án.  
> Mọi quyết định thiết kế (ADR) phải tuân thủ các nguyên tắc dưới đây.

---

## 1. CHUẨN RESTFUL API

- **Verb đúng ngữ nghĩa:** GET (đọc), POST (tạo), PUT (cập nhật toàn bộ), PATCH (cập nhật một phần), DELETE (xóa).
- **Naming convention:** Danh từ số nhiều, viết thường, phân cách bằng `-`.
  - ✅ `GET /api/leads`, `POST /api/opportunities/:id/follow-ups`
  - ❌ `GET /api/getLead`, `POST /api/createFollowUp`
- **Response format thống nhất:**
  ```json
  {
    "success": true,
    "message": "Mô tả kết quả",
    "data": { ... }
  }
  ```
- **HTTP Status Code chuẩn:** 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict/Duplicate), 500 (Server Error).
- **Phân trang mặc định:** 20 dòng/trang (SRS 3.2.3 REQ-1), trả kèm metadata `{ currentPage, totalPages, totalRecords }`.

---

## 2. XỬ LÝ TRANSACTION & TÍNH TOÀN VẸN DỮ LIỆU

- **ACID Transaction bắt buộc** cho mọi thao tác ảnh hưởng nhiều bảng cùng lúc (ví dụ: Make Order = tạo Order + cập nhật Opportunity status + trừ tồn kho Product).
- **Row-level Lock (`SELECT ... FOR UPDATE`)** khi đọc dữ liệu cần bảo vệ khỏi race condition.
- **Pattern chuẩn:**
  ```
  BEGIN → Lock Row → Validate → Execute → COMMIT
                                       ↘ ROLLBACK (nếu lỗi)
  ```
- **Không bao giờ** để transaction mở lâu (> 5 giây). Luôn đặt trong `try/catch/finally` với `client.release()`.

---

## 3. PHÂN TẦNG TRÁCH NHIỆM (Separation of Concerns)

### Backend (Clean MVC):
| Tầng | File | Trách nhiệm | KHÔNG được làm |
|:---|:---|:---|:---|
| **Route** | `*.routes.js` | Khai báo endpoint + gắn middleware | Không chứa logic nghiệp vụ |
| **Middleware** | `*.middleware.js` | Auth JWT, RBAC guard, error handler | Không truy vấn DB nghiệp vụ |
| **Controller** | `*.controller.js` | Logic nghiệp vụ, validate, gọi DB | Không `app.use()` hay `router.get()` |
| **Config** | `config/*.js` | Kết nối DB, SMTP | Không chứa business logic |

### Frontend (Component-Based):
| Tầng | Thư mục | Trách nhiệm | KHÔNG được làm |
|:---|:---|:---|:---|
| **API Layer** | `src/api/` | Gọi HTTP, xử lý response | Không chứa UI logic |
| **Context** | `src/context/` | Global state (auth, user) | Không gọi API trực tiếp |
| **Pages** | `src/pages/` | Layout trang, gọi API qua hooks | Không chứa CSS inline phức tạp |
| **Components** | `src/components/` | UI tái sử dụng, stateless | Không gọi API trực tiếp |

---

## 4. QUY ƯỚC ĐẶT TÊN

| Đối tượng | Convention | Ví dụ |
|:---|:---|:---|
| File Backend | `kebab-case` + hậu tố chức năng | `lead.controller.js`, `auth.routes.js` |
| File Frontend (Component) | `PascalCase` | `LeadList.jsx`, `MakeOrderModal.jsx` |
| File Frontend (Hook) | `camelCase` + tiền tố `use` | `useIdleTimeout.js` |
| File Frontend (API) | `camelCase` + hậu tố `Api` | `leadApi.js`, `authApi.js` |
| Biến JS | `camelCase` | `totalAmount`, `leadData` |
| Bảng DB | `snake_case`, số nhiều | `product_categories`, `follow_ups` |
| Cột DB | `snake_case` | `first_name`, `stock_qty`, `created_at` |
| Route API | `kebab-case`, danh từ số nhiều | `/api/follow-ups`, `/api/product-categories` |
| Biến môi trường | `UPPER_SNAKE_CASE` | `DB_HOST`, `JWT_SECRET`, `SMTP_PORT` |

---

## 5. XỬ LÝ LỖI & BẢO MẬT

- **Không bao giờ** trả stack trace cho client trong production. Chỉ trả message rõ ràng.
- **Validate input** tại controller trước khi truy vấn DB (required fields, email format, phone format).
- **Parameterized queries** (`$1, $2`) — KHÔNG BAO GIỜ nối chuỗi SQL trực tiếp.
- **Mật khẩu** phải hash bằng `bcryptjs` (salt rounds >= 10) trước khi lưu DB.
- **JWT Token** có thời hạn (expiry), lưu trong `localStorage`, gửi qua header `Authorization: Bearer <token>`.

---

## 6. KIỂM THỬ

- **Mọi tính năng** phải chạy kiểm thử thực tế trước khi đánh dấu hoàn thành.
- **Verification gate:** `./init.sh` phải pass sạch sau mỗi feature.
- **Bằng chứng (evidence)** ghi vào `feature_list.json` và `progress.md`.
