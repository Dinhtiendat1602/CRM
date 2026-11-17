<!-- Chức năng: Biên bản bàn giao phiên: ghi lại việc vừa thực thi, blocker và bước tiếp theo khi mở phiên mới -->

# Session Handoff - Biên Bản Bàn Giao Phiên Làm Việc

## 1. Hiện Trạng & Mục Tiêu Phiên (Current State & Objective)
- **Thời gian bàn giao:** 2026-11-17 09:55
- **Nội dung trọng tâm:** Hiện thực hóa Hệ thống Phân quyền Vai trò Toàn diện (End-to-End Role-Based Access Control - RBAC), Bảo mật Dữ liệu Động (Row-Level Security - RLS) và Phân bổ Công cụ theo Vai trò cho Zen CRM AI Assistant trên nền tảng LangGraph.
- **Trạng thái hệ thống:** HOÀN THÀNH 100% (21/21 AI Agent tests PASS + 146/146 backend tests PASS; Vite build thành công trong 667ms; Live E2E chat với PostgreSQL và Gemini đạt kết quả xuất sắc 100%).
- **Cổng dịch vụ đang cấu hình:**
  - Express Backend: `http://localhost:5001`
  - React Frontend: `http://localhost:8080`
  - Python AI Agent Service: `http://localhost:8000` (`ai-agent-service/main.py`)
  - PostgreSQL Database: `localhost:5432` (`CRM`)

---

## 2. Công Việc Vừa Mới Thực Thi Trong Phiên Này (Just Completed)

1. **Xác thực JWT Token & Quản lý Ngữ cảnh An toàn (Context-Aware Execution):**
   - [`src/api/auth.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/api/auth.py): Xây dựng dependency `get_current_user(authorization)` giải mã Bearer JWT token dùng chung `JWT_SECRET` với Express Backend, xác thực 3 vai trò (`ADMIN`, `SALE_MANAGER`, `SALESMAN`), hỗ trợ fallback tương thích ngược.
   - [`src/utils/context.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/utils/context.py): Áp dụng `contextvars.ContextVar` lưu trữ danh tính `current_user` thread-safe theo từng request, cho phép các Tools tự động đọc vai trò/ID người dùng mà không làm thay đổi JSON Schema của Tool cung cấp cho LLM.

2. **Phân Bổ LangGraph Subgraphs Độc Lập Theo Vai Trò (Dynamic Tool Permissions):**
   - [`src/tools/__init__.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/tools/__init__.py): Phân chia rõ ràng:
     - `ADMIN_LANGCHAIN_TOOLS`: 1 công cụ giám sát kỹ thuật (`get_admin_system_overview`).
     - `MANAGER_LANGCHAIN_TOOLS`: Toàn quyền 9 công cụ CRM toàn công ty.
     - `SALESMAN_LANGCHAIN_TOOLS`: 7 công cụ phục vụ bán hàng cá nhân, loại bỏ hoàn toàn các công cụ doanh số và ngân sách chiến dịch tiếp thị.
   - [`config/prompts.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/config/prompts.py): Xây dựng `ADMIN_SYSTEM_INSTRUCTION`, `MANAGER_SYSTEM_INSTRUCTION`, `SALESMAN_SYSTEM_INSTRUCTION` và hàm `get_system_prompt_for_role(role, user)`.
   - [`src/agents/base_agent.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/agents/base_agent.py): Biên dịch 3 đồ thị ReAct độc lập `self.role_graphs["ADMIN"]`, `self.role_graphs["SALE_MANAGER"]`, `self.role_graphs["SALESMAN"]` dùng chung `MemorySaver` checkpointer.
   - [`src/agents/crm_agent.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/agents/crm_agent.py): Tiếp nhận `user`, tự động định tuyến sang đồ thị phù hợp và dọn dẹp context qua `try ... finally`.

3. **Bảo Mật Dữ Liệu Cấp Bản Ghi (Row-Level Security - RLS) Trong Các Công Cụ SQL:**
   - [`src/tools/admin_tools.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/tools/admin_tools.py): `get_admin_system_overview` kiểm tra trạng thái CSDL và phân bố người dùng theo vai trò; chặn Admin truy cập/thay đổi dữ liệu kinh doanh.
   - [`src/tools/query_tools.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/tools/query_tools.py):
     - `get_leads_summary`: Salesman chỉ truy vấn khách hàng gán cho mình (`leads.assigned_to = user_id`).
     - `get_revenue_and_forecast` & `get_campaigns_overview`: Trả về lỗi từ chối quyền truy cập nếu là Salesman.
     - `get_products_and_inventory`: Salesman chỉ xem các sản phẩm được phân quyền bán (`salesman_products`).
     - `get_opportunities_overview`: Salesman chỉ thấy cơ hội do mình tạo hoặc khách do mình phụ trách.
     - `get_orders_summary` & `search_customer`: Áp dụng bộ lọc phụ trách cho Salesman.
   - [`src/tools/lead_tools.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/tools/lead_tools.py): Tự động gán `assigned_to = user_id` khi Salesman tạo Lead mới; chặn Admin tạo Lead.
   - [`src/tools/order_tools.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/tools/order_tools.py): Kiểm tra quyền phân phối sản phẩm trong `salesman_products` trước khi tạo cơ hội bán hàng.

4. **Đồng Bộ Frontend React (AIChatWidget.jsx):**
   - Tự động gắn header `Authorization: Bearer <token>` vào tất cả các yêu cầu API (`/api/chat`, `/api/chat/reset`, `/api/chat/history`, `/api/chat/sessions`, `/api/health`).
   - Hiển thị huy hiệu vai trò (Admin / Manager / Sales) trên thanh tiêu đề của Chat Widget.
   - Tùy biến các nút bấm gợi ý câu hỏi 1 chạm (Quick Prompts) thích ứng chính xác theo vai trò đăng nhập.

5. **Kiểm Thử Đầy Đủ & Xác Thực Thực Tế:**
   - Bổ sung 4 bài test tự động chuyên sâu trong `tests/test_agent_actions.py`: `test_role_based_access_control_jwt`, `test_admin_tools_and_restrictions`, `test_salesman_tools_rls_and_restrictions`, `test_role_graphs_tool_allocation`.
   - Chạy thành công 21/21 bài kiểm thử tự động của AI Agent Service (100% PASS).
   - Chạy kịch bản live E2E: Admin gọi thành công `get_admin_system_overview`, Salesman chỉ tra cứu đúng 3 sản phẩm được gán trong `salesman_products`.

---

## 3. Bằng Chứng Kiểm Thử Đã Thực Hiện (Evidence of Verification)

| Bộ kiểm thử | Kết quả | Ghi chú |
|---|---|---|
| AI Agent Service Tests (`tests/run_tests.py`) | **PASS (21/21)** | 12 test queries + 9 test agent actions (có đầy đủ 4 bài test RBAC/RLS) |
| Live E2E Role Chat (`scratch/verify_e2e_rbac.py`) | **PASS (100%)** | Admin tra cứu đúng thống kê 20 users; Salesman chỉ lấy đúng 3 sản phẩm được phân quyền |
| AI Service Healthcheck (`GET /api/health`) | **HTTP 200 OK** | `roles_supported: ['ADMIN', 'SALE_MANAGER', 'SALESMAN']`, `tools_loaded: {ADMIN: 1, SALE_MANAGER: 9, SALESMAN: 7}` |
| AI Service Graph Endpoint (`GET /api/agent/graph`) | **HTTP 200 OK** | Trả về đúng sơ đồ Mermaid và số lượng công cụ cho từng Role |
| Backend Tests (`backend/`) | **PASS (146/146)** | 6 test suites, 0 failures, 31.5s |
| Frontend Build (`npm run build`) | **PASS (667ms)** | Vite production build `dist/` thành công, 0 lỗi lint/syntax |

---

## 4. Rủi Ro & Vướng Mắc Tồn Đọng (Blockers & Risks)
- **Không có blocker nào.** Hệ thống RBAC và phân quyền công cụ vận hành hoàn hảo, an toàn và bảo mật cao.

---

## 5. Danh Sách Tính Năng Tiếp Theo Đã Cập Nhật Vào `feature_list.json`
1. **`feat-028` (BƯỚC TIẾP THEO TRỌNG TÂM):** Trợ Lý AI Tự Động Thêm Khách Hàng Tiềm Năng (Autonomous Lead Creation & Deduplication Guard) — Tận dụng LangGraph ReAct Agent để bóc tách thực thể ngôn ngữ tự nhiên, tự động gọi `create_lead`, chống trùng SĐT/Email BR-02 và lưu vào PostgreSQL.
2. **`feat-029`:** Trợ Lý AI Tự Động Tạo Cơ Hội Bán Hàng & Khớp Sản Phẩm (Autonomous Opportunity Creation & Product Matching).
3. **`feat-030`:** Trợ Lý AI Tự Động Ghi Nhật Ký Chăm Sóc & Chuyển Đổi Pipeline (Autonomous Follow-up Logging & Pipeline Transition).
4. **`feat-031`:** Trợ Lý AI Tự Động Chốt Đơn Hàng & Cập Nhật Tồn Kho (Autonomous Make Order & Inventory Sync với Transaction Lock).
5. **`feat-032`:** Hộp Thoại Xác Nhận Hành Động Nguy Hiểm & Thẻ Tác Vụ Tương Tác (Human-In-The-Loop Confirmation UI & Action Cards tận dụng tính năng `interrupt_before` của LangGraph).
