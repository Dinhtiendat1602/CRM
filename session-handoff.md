<!-- Chức năng: Biên bản bàn giao phiên: ghi lại việc vừa thực thi, blocker và bước tiếp theo khi mở phiên mới -->

# Session Handoff - Biên Bản Bàn Giao Phiên Làm Việc

## 1. Hiện Trạng & Mục Tiêu Phiên (Current State & Objective)
- **Thời gian bàn giao:** 2026-11-10 10:25
- **Nội dung trọng tâm:** Tái cấu trúc & Chuyển đổi toàn diện Zen CRM AI Assistant sang Framework **LangGraph** (`StateGraph`, `create_react_agent`, `MemorySaver` checkpointer và bảo toàn `thought_signature`).
- **Trạng thái hệ thống:** HOÀN THÀNH 100% (17/17 AI Agent tests PASS + 146/146 backend tests PASS; Vite build thành công trong 359ms; Live chat multi-turn với CSDL PostgreSQL hoạt động chuẩn xác 100%).
- **Cổng dịch vụ đang cấu hình:**
  - Express Backend: `http://localhost:5001`
  - React Frontend: `http://localhost:8080`
  - Python AI Agent Service: `http://localhost:8000` (`ai-agent-service/main.py`)
  - PostgreSQL Database: `localhost:5432` (`CRM`)

---

## 2. Công Việc Vừa Mới Thực Thi Trong Phiên Này (Just Completed)

1. **Cài Đặt Thư Viện LangGraph & Chuẩn Hóa Dependencies:**
   - Cập nhật [`requirements.txt`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/requirements.txt): Bổ sung `langgraph>=0.2.0`, `langchain-core>=0.3.0`, `langchain-google-genai>=2.0.0`.
   - Cài đặt thành công các gói phụ thuộc vào môi trường ảo `ai-agent-service/venv`.

2. **Chuyển Đổi CRM Tools sang LangChain StructuredTools:**
   - [`src/tools/__init__.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/tools/__init__.py):
     - Chuẩn hóa toàn bộ 9 CRM tools (`get_leads_summary`, `get_revenue_and_forecast`, `get_products_and_inventory`, `get_opportunities_overview`, `get_campaigns_overview`, `get_orders_summary`, `search_customer`, `create_lead`, `create_opportunity`) thành LangChain Tools thông qua `langchain_core.tools.tool`.
     - Đồng thời duy trì mảng `RAW_CRM_TOOLS` và các hàm gốc để không phá vỡ bất kỳ unit tests độc lập nào.

3. **Hiện Thực Hóa LangGraph State & Base Agent:**
   - [`src/agents/state.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/agents/state.py): Định nghĩa schema `CRMState` với `messages: Annotated[Sequence[BaseMessage], add_messages]`.
   - [`src/agents/base_agent.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/agents/base_agent.py):
     - Biên dịch đồ thị `CompiledStateGraph` bằng `create_react_agent` với `MemorySaver` checkpointer.
     - Hàm `_hydrate_session_if_needed`: Tự động phục hồi lịch sử từ `SessionMemory` (Redis/File JSON) vào LangGraph Checkpointer khi mở phiên cũ hoặc sau khi khởi động lại server.
     - Hàm `reset_session`: Xóa sạch thread trong LangGraph checkpointer qua `checkpointer.delete_thread(session_id)` kết hợp `memory.clear_session`.
   - [`src/agents/crm_agent.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/agents/crm_agent.py): Kế thừa `BaseAgent`, tích hợp Intent Classifier, hệ thống logging và lưu trữ bền vững.

4. **Khắc Phục Lỗi Thought Signature Của Gemini 2.5 / 3 Thinking Models:**
   - [`src/llm/client.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/llm/client.py):
     - Xây dựng hàm `patch_langchain_gemini_thought_signature()` tự động trích xuất `thought_signature` từ `Candidate.parts` vào `AIMessage.tool_calls` và đính kèm lại vào `Part(function_call=..., thought_signature=...)` khi gửi kết quả thực thi Tool ngược lại cho Gemini API.
     - Loại bỏ triệt để lỗi `400 Function call is missing a thought_signature in functionCall parts`.

5. **Mở Rộng API Endpoints (`src/api/routes.py`):**
   - Bổ sung `framework: "LangGraph (StateGraph)"` trong `/api/health`.
   - Thêm endpoint `GET /api/agent/graph` trả về danh sách Nodes, Tools và mã sơ đồ Mermaid sinh trực tiếp từ LangGraph.

6. **Kiểm Thử & Xác Thực Nghiệp Vụ:**
   - [`tests/test_agent_actions.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/tests/test_agent_actions.py): Bổ sung `test_langgraph_crm_agent_structure`.
   - Chạy thành công 17/17 tests tự động của AI Agent Service (100% PASS).
   - Kiểm thử hội thoại đa lượt thực tế (Live multi-turn conversation) truy vấn CSDL PostgreSQL và Gemini API thành công mỹ mãn.

---

## 3. Bằng Chứng Kiểm Thử Đã Thực Hiện (Evidence of Verification)

| Bộ kiểm thử | Kết quả | Ghi chú |
|---|---|---|
| AI Agent Service Tests (`tests/run_tests.py`) | **PASS (17/17)** | Đầy đủ 12 test queries + 5 test agent actions (có `test_langgraph_crm_agent_structure`) |
| Live LangGraph Multi-turn Chat | **PASS** | Turn 1: Tra cứu đúng 22 Leads và vẽ bảng. Turn 2: Nhớ ngữ cảnh xác định chính xác Lead mới nhất là Phan Cảnh Đức #38 |
| AI Service Healthcheck (`GET /api/health`) | **HTTP 200 OK** | `framework: LangGraph (StateGraph)`, `status: online`, `tools_loaded: 9` |
| AI Service Graph Endpoint (`GET /api/agent/graph`) | **HTTP 200 OK** | Xuất đúng nodes `['__start__', 'agent', 'tools']` và chuỗi Mermaid đồ thị |
| Backend Tests (`backend/`) | **PASS (146/146)** | 6 test suites, 0 failures, 31.6s |
| Frontend Build (`npm run build`) | **PASS (359ms)** | Vite production build `dist/` thành công, 0 lỗi |

---

## 4. Rủi Ro & Vướng Mắc Tồn Đọng (Blockers & Risks)
- **Không có blocker nào.** Hệ thống LangGraph vận hành trơn tru và hoàn toàn tương thích ngược với API Frontend hiện có.

---

## 5. Danh Sách Tính Năng Tiếp Theo Đã Cập Nhật Vào `feature_list.json`
1. **`feat-028` (BƯỚC TIẾP THEO TRỌNG TÂM):** Trợ Lý AI Tự Động Thêm Khách Hàng Tiềm Năng (Autonomous Lead Creation & Deduplication Guard) — Tận dụng LangGraph ReAct Agent để bóc tách thực thể ngôn ngữ tự nhiên, tự động gọi `create_lead`, chống trùng SĐT/Email BR-02 và lưu vào PostgreSQL.
2. **`feat-029`:** Trợ Lý AI Tự Động Tạo Cơ Hội Bán Hàng & Khớp Sản Phẩm (Autonomous Opportunity Creation & Product Matching).
3. **`feat-030`:** Trợ Lý AI Tự Động Ghi Nhật Ký Chăm Sóc & Chuyển Đổi Pipeline (Autonomous Follow-up Logging & Pipeline Transition).
4. **`feat-031`:** Trợ Lý AI Tự Động Chốt Đơn Hàng & Cập Nhật Tồn Kho (Autonomous Make Order & Inventory Sync với Transaction Lock).
5. **`feat-032`:** Hộp Thoại Xác Nhận Hành Động Nguy Hiểm & Thẻ Tác Vụ Tương Tác (Human-In-The-Loop Confirmation UI & Action Cards tận dụng tính năng `interrupt_before` của LangGraph).
6. **`feat-033`:** Đồng Bộ Thời Gian Thực Dữ Liệu Giữa Chatbot và Giao Diện Bảng CRM (Real-time Cross-Module UI Sync).
7. **`feat-034`:** Phân Tích Thông Minh & Chấm Điểm Xác Suất Chốt Đơn Bằng AI (AI Deal Win-Rate Scoring & Sales Coaching).
