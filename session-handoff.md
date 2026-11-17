<!-- Chức năng: Biên bản bàn giao phiên: ghi lại việc vừa thực thi, blocker và bước tiếp theo khi mở phiên mới -->

# Session Handoff - Biên Bản Bàn Giao Phiên Làm Việc

## 1. Hiện Trạng & Mục Tiêu Phiên (Current State & Objective)
- **Thời gian bàn giao:** 2026-11-17 10:45
- **Nội dung trọng tâm:** Hiện thực hóa Hệ thống Phân quyền Vai trò Toàn diện (RBAC), Bảo mật Dữ liệu Động (RLS), Phân bổ Công cụ theo Vai trò và **Cách ly Triệt để Lịch sử Trò chuyện theo Từng Vai trò (Role-Isolated Chat History & Sessions)** cho Zen CRM AI Assistant trên nền tảng LangGraph.
- **Trạng thái hệ thống:** HOÀN THÀNH 100% (22/22 AI Agent tests PASS + 146/146 backend tests PASS; Vite build thành công trong 381ms; Live E2E chat & history isolation với PostgreSQL và Gemini đạt kết quả xuất sắc 100%).
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

4. **Cách Ly Triệt Để Lịch Sử Trò Chuyện Theo Từng Vai Trò (Role & User History Isolation):**
   - [`src/memory/redis_memory.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/memory/redis_memory.py):
     - Lưu trữ metadata gắn liền phiên: `{"role": ..., "user_id": ..., "username": ..., "updated_at": ...}`.
     - Hàm `list_saved_sessions(role, user_id)`: Lọc nghiêm ngặt chỉ trả về các phiên thuộc đúng vai trò (và đúng `user_id` đối với Salesman).
     - Hàm `get_session_role(session_id)` & `get_session_user_id(session_id)` hỗ trợ kiểm soát quyền đọc/xóa.
   - [`src/api/routes.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/api/routes.py):
     - `GET /api/chat/sessions`: Tự động truyền vai trò và ID của token người dùng vào `list_saved_sessions`.
     - `GET /api/chat/history`: Chặn hoàn toàn và trả về rỗng nếu người dùng cố truy cập lịch sử của vai trò khác.
     - `DELETE /api/chat/session`: Chặn xóa phiên của vai trò hoặc nhân viên khác (HTTP 403 Forbidden).

5. **Đồng Bộ Frontend React (AIChatWidget.jsx):**
   - Tích hợp hook `useAuth()` để theo dõi người dùng và vai trò đăng nhập hiện tại theo thời gian thực.
   - Cô lập vùng nhớ trình duyệt (Scoped `localStorage`): Phân tách khóa theo định dạng `zen_crm_ai_session_id_${role}_${userId}` và `zen_crm_ai_chat_messages_${role}_${userId}`.
   - Khi chuyển đổi tài khoản/vai trò, khung chat tự động hoán đổi phiên và tin nhắn của đúng tài khoản đó, không bao giờ bị lẫn lộn giữa Admin, Manager và Salesman.
   - Drawer Lịch sử hiển thị huy hiệu vai trò `({roleBadge})` và chỉ liệt kê danh sách các phiên thuộc vai trò tương ứng.

6. **Kiểm Thử Đầy Đủ & Xác Thực Thực Tế:**
   - Bổ sung bài test `test_chat_history_role_isolation` trong `tests/test_agent_actions.py`.
   - Bộ kiểm thử AI Agent Service đạt **22/22 tests PASS (100%)**.
   - Bộ kiểm thử Live E2E (`scratch/verify_e2e_rbac.py`): Xác nhận Admin chỉ thấy session của Admin, Salesman chỉ thấy session của Salesman, truy cập chéo lịch sử bị chặn hoàn toàn.

---

## 3. Bằng Chứng Kiểm Thử Đã Thực Hiện (Evidence of Verification)

| Bộ kiểm thử | Kết quả | Ghi chú |
|---|---|---|
| AI Agent Service Tests (`tests/run_tests.py`) | **PASS (22/22)** | 12 test queries + 10 test agent actions (kèm `test_chat_history_role_isolation`) |
| Live E2E Role Chat & History Isolation | **PASS (100%)** | Admin chỉ thấy sessions của Admin; Salesman chỉ thấy sessions của Salesman; đọc chéo bị chặn |
| AI Service Healthcheck (`GET /api/health`) | **HTTP 200 OK** | `roles_supported: ['ADMIN', 'SALE_MANAGER', 'SALESMAN']`, `tools_loaded: {ADMIN: 1, SALE_MANAGER: 9, SALESMAN: 7}` |
| AI Service Graph Endpoint (`GET /api/agent/graph`) | **HTTP 200 OK** | Trả về đúng sơ đồ Mermaid và số lượng công cụ cho từng Role |
| Backend Tests (`backend/`) | **PASS (146/146)** | 6 test suites, 0 failures, 31.5s |
| Frontend Build (`npm run build`) | **PASS (381ms)** | Vite production build `dist/` thành công, 0 lỗi lint/syntax |

---

## 4. Rủi Ro & Vướng Mắc Tồn Đọng (Blockers & Risks)
- **Không có blocker nào.** Hệ thống RBAC, phân quyền công cụ và cách ly lịch sử hội thoại vận hành an toàn và bảo mật 100%.

---

## 5. Danh Sách Tính Năng Tiếp Theo Đã Cập Nhật Vào `feature_list.json`
1. **`feat-028` (BƯỚC TIẾP THEO TRỌNG TÂM):** Trợ Lý AI Tự Động Thêm Khách Hàng Tiềm Năng (Autonomous Lead Creation & Deduplication Guard) — Tận dụng LangGraph ReAct Agent để bóc tách thực thể ngôn ngữ tự nhiên, tự động gọi `create_lead`, chống trùng SĐT/Email BR-02 và lưu vào PostgreSQL.
2. **`feat-029`:** Trợ Lý AI Tự Động Tạo Cơ Hội Bán Hàng & Khớp Sản Phẩm (Autonomous Opportunity Creation & Product Matching).
3. **`feat-030`:** Trợ Lý AI Tự Động Ghi Nhật Ký Chăm Sóc & Chuyển Đổi Pipeline (Autonomous Follow-up Logging & Pipeline Transition).
4. **`feat-031`:** Trợ Lý AI Tự Động Chốt Đơn Hàng & Cập Nhật Tồn Kho (Autonomous Make Order & Inventory Sync với Transaction Lock).
5. **`feat-032`:** Hộp Thoại Xác Nhận Hành Động Nguy Hiểm & Thẻ Tác Vụ Tương Tác (Human-In-The-Loop Confirmation UI & Action Cards tận dụng tính năng `interrupt_before` của LangGraph).
