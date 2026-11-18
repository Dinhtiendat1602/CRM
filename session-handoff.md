<!-- Chức năng: Biên bản bàn giao phiên: ghi lại việc vừa thực thi, blocker và bước tiếp theo khi mở phiên mới -->

# Session Handoff - Biên Bản Bàn Giao Phiên Làm Việc

## 1. Hiện Trạng & Mục Tiêu Phiên (Current State & Objective)
- **Thời gian bàn giao:** 2026-11-18 09:00
- **Nội dung trọng tâm:** Chuyển đổi toàn diện cơ chế hoạt động của các công cụ AI Agent CRM sang **Kiến Trúc Gọi API (Approach 2 - API-Driven Tools with JWT Bearer Token Forwarding)**. Thay vì viết truy vấn SQL trực tiếp trong Python, toàn bộ 10 công cụ của AI Agent giờ đây ủy quyền trực tiếp cho các RESTful API endpoints của Express Backend (`http://localhost:8888/api`). Express Backend đóng vai trò Single Source of Truth kiểm soát xác thực, phân quyền RBAC, RLS và các quy tắc nghiệp vụ (BR-01, BR-02, BR-03).
- **Trạng thái hệ thống:** HOÀN THÀNH 100% (22/22 AI Agent tests PASS + 146/146 backend Express tests PASS; Vite frontend build thành công trong 364ms; Live E2E Gemini Chat Agent gọi REST API Express thành công xuất sắc 100%).
- **Cổng dịch vụ đang cấu hình:**
  - Express Backend: `http://localhost:8888` (hoặc `http://localhost:5001`)
  - React Frontend: `http://localhost:8080`
  - Python AI Agent Service: `http://localhost:8000` (`ai-agent-service/main.py`)
  - PostgreSQL Database: `localhost:5432` (`CRM`)

---

## 2. Công Việc Vừa Mới Thực Thi Trong Phiên Này (Just Completed)

1. **Cấu hình & Quản lý Chuyển tiếp Token (JWT Token Context & Forwarding):**
   - [`config/settings.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/config/settings.py) & [`.env`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/.env): Bổ sung `BACKEND_API_BASE` (mặc định `http://localhost:8888/api`).
   - [`src/utils/context.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/utils/context.py): Bổ sung `_raw_token_context`, các hàm `set_current_token()`, `reset_current_token()` và `get_current_token()` (kèm cơ chế tự động mint JWT token hợp lệ khi chạy unit test độc lập).
   - [`src/api/auth.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/api/auth.py): Lưu trữ `raw_token` vào context của user khi nhận Bearer Token từ client.
   - [`src/agents/crm_agent.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/agents/crm_agent.py): Thiết lập và dọn dẹp ngữ cảnh token trong hàm `chat()` qua khối `try ... finally`.

2. **Xây dựng HTTP Client Trung Gian (`BackendAPIClient`):**
   - [`src/services/backend_client.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/services/backend_client.py):
     - Khởi tạo `httpx.Client` với timeout 10.0s, tự động đính kèm header `Authorization: Bearer <token>`.
     - Chuẩn hóa các mã lỗi HTTP từ Express:
       - `401 Unauthorized`: Trả về thông báo lỗi phiên làm việc hết hạn.
       - `403 Forbidden`: Trích xuất thông báo từ chối từ `role.middleware.js` hoặc controller và định dạng thành lỗi quyền hạn rõ ràng cho Gemini.
       - `409 Conflict`: Định dạng lỗi vi phạm quy chuẩn chống trùng lặp BR-02, trích xuất `existingLead` để Gemini trả lời khách hàng cũ.
       - `400 Bad Request` / `404 Not Found`: Chuẩn hóa thông điệp lỗi tham số / tài nguyên không tồn tại.

3. **Tái Cấu Trúc Toàn Bộ 10 CRM Tools Sang Gọi REST API:**
   - [`src/tools/admin_tools.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/tools/admin_tools.py): `get_admin_system_overview` gọi `GET /api/admin/users`, `GET /api/admin/roles` và `GET /api/health` của Express Backend.
   - [`src/tools/lead_tools.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/tools/lead_tools.py): `create_lead` gọi `POST /api/leads`. Express Backend tự động kiểm tra trùng lặp BR-02 (trả mã 409 Conflict) và tự động gán `assigned_to` khi Salesman tạo khách mới.
   - [`src/tools/order_tools.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/tools/order_tools.py): `create_opportunity` kiểm tra lead qua `GET /api/leads/:id`, tìm sản phẩm qua `GET /api/products`, gửi `POST /api/opportunities`. Express Backend tự động kiểm tra phân quyền `salesman_products` và từ chối 403 nếu Salesman chưa được cấp quyền bán.
   - [`src/tools/query_tools.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/tools/query_tools.py):
     - `get_leads_summary`: Gọi `GET /api/leads`.
     - `get_revenue_and_forecast`: Gọi `GET /api/forecasts/performance`. Bị Express chặn 403 Forbidden đối với Salesman.
     - `get_products_and_inventory`: Gọi `GET /api/products`. Express Backend tự động lọc chỉ trả về các sản phẩm Salesman được quyền phân phối.
     - `get_opportunities_overview`: Gọi `GET /api/opportunities`.
     - `get_campaigns_overview`: Gọi `GET /api/campaigns`. Bị chặn 403 Forbidden đối với Salesman.
     - `get_orders_summary`: Gọi `GET /api/orders`.
     - `search_customer`: Gọi `GET /api/leads?search=...`, `GET /api/leads/:id` và `GET /api/orders?lead_id=...` để tạo hồ sơ khách hàng 360 độ.

4. **Nâng Cấp Backend Express Controller (`lead.controller.js`):**
   - Bổ sung hàm `unaccent()` của PostgreSQL vào câu truy vấn tìm kiếm `search` của [lead.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/lead.controller.js) giúp tìm kiếm tiếng Việt không dấu & có dấu (VD: "Phan Canh Duc" <-> "Phan Cảnh Đức") hoạt động nhất quán và mượt mà qua API.

5. **Kiểm Thử & Xác Thực Toàn Diện:**
   - Kịch bản kiểm tra công cụ API [`scratch/verify_api_tools.py`](file:///Users/zen/CNTT/Fullstack/internship/scratch/verify_api_tools.py): Đạt 100% trên cả 3 vai trò (ADMIN, SALE_MANAGER, SALESMAN).
   - Kịch bản Live E2E Gemini Chat [`scratch/test_live_chat_api_tools.py`](file:///Users/zen/CNTT/Fullstack/internship/scratch/test_live_chat_api_tools.py): Mô hình Gemini gọi trực tiếp công cụ API, trích xuất đúng báo cáo đối soát 12 tháng của Sale Manager và lọc đúng 3 sản phẩm phân quyền của Salesman.

---

## 3. Bằng Chứng Kiểm Thử Đã Thực Hiện (Evidence of Verification)

| Bộ kiểm thử | Kết quả | Ghi chú |
|---|---|---|
| AI Agent Service Tests (`tests/run_tests.py`) | **PASS (22/22)** | 12 query tests + 10 agent action tests (kết nối trực tiếp Express API) |
| Tool API Flow Verification (`scratch/verify_api_tools.py`) | **PASS (100%)** | Xác nhận Admin Overview qua Admin API, Manager qua Báo cáo, Salesman bị chặn 403 & BR-02 bắt trùng 409 |
| Live E2E Gemini Chat Agent | **PASS (100%)** | Gemini gọi Express REST API trích xuất doanh thu 12 tháng & tồn kho sản phẩm phân quyền |
| Backend Integration Tests (`backend/`) | **PASS (146/146)** | 6 test suites, 0 failures, 32.1s |
| Frontend Production Build (`npm run build`) | **PASS (364ms)** | Vite client build `dist/` thành công, 0 lỗi cú pháp/runtime |

---

## 4. Rủi Ro & Vướng Mắc Tồn Đọng (Blockers & Risks)
- **Không có blocker nào.** Hệ thống gọi công cụ qua API vận hành bảo mật, ổn định và tuân thủ chặt chẽ kiến trúc phân tầng.

---

## 5. Danh Sách Tính Năng Tiếp Theo Đã Cập Nhật Vào `feature_list.json`
1. **`feat-028` (BƯỚC TIẾP THEO TRỌNG TÂM):** Trợ Lý AI Tự Động Thêm Khách Hàng Tiềm Năng (Autonomous Lead Creation & Deduplication Guard) — Tận dụng LangGraph ReAct Agent để bóc tách thực thể ngôn ngữ tự nhiên, tự động gọi `create_lead` qua REST API, chống trùng SĐT/Email BR-02 và lưu vào CSDL.
2. **`feat-029`:** Trợ Lý AI Tự Động Tạo Cơ Hội Bán Hàng & Khớp Sản Phẩm (Autonomous Opportunity Creation & Product Matching).
3. **`feat-030`:** Trợ Lý AI Tự Động Ghi Nhật Ký Chăm Sóc & Chuyển Đổi Pipeline (Autonomous Follow-up Logging & Pipeline Transition).
4. **`feat-031`:** Trợ Lý AI Tự Động Chốt Đơn Hàng & Cập Nhật Tồn Kho (Autonomous Make Order & Inventory Sync).
5. **`feat-032`:** Hộp Thoại Xác Nhận Hành Động Nguy Hiểm & Thẻ Tác Vụ Tương Tác (Human-In-The-Loop Confirmation UI).
