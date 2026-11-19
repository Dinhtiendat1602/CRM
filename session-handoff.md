<!-- Chức năng: Biên bản bàn giao phiên: ghi lại việc vừa thực thi, blocker và bước tiếp theo khi mở phiên mới -->

# Session Handoff - Biên Bản Bàn Giao Phiên Làm Việc

## 1. Hiện Trạng & Mục Tiêu Phiên (Current State & Objective)
- **Thời gian bàn giao:** 2026-11-19 10:50
- **Nội dung trọng tâm:** Hoàn thành `feat-028`: **Trợ Lý AI Tự Động Thêm Khách Hàng Tiềm Năng (Autonomous Lead Creation & Deduplication Guard)** kết hợp cơ chế Đồng Bộ Giao Diện CRM Thời Gian Thực (Real-time Cross-Module UI Sync) và Thẻ Tác Vụ Tương Tác (Interactive Action Confirmation Card).
- **Trạng thái hệ thống:** HOÀN THÀNH 100% (23/23 AI Agent tests PASS + 146/146 Express Backend tests PASS + 117/117 Frontend tests PASS; Vite frontend production build thành công trong 455ms; Live E2E Gemini Chat Agent kiểm thử thực tế đạt 100%).
- **Cổng dịch vụ đang cấu hình:**
  - Express Backend: `http://localhost:8888`
  - React Frontend: `http://localhost:8080`
  - Python AI Agent Service: `http://localhost:8000` (`ai-agent-service/main.py`)
  - PostgreSQL Database: `localhost:5432` (`CRM`)

---

## 2. Công Việc Vừa Mới Thực Thi Trong Phiên Này (Just Completed)

1. **Nâng cấp System Instructions & Prompt Engineering (`config/prompts.py`):**
   - Bổ sung quy tắc bóc tách thực thể người Việt chuẩn xác cho cả vai trò Quản lý (`SALE_MANAGER`) và Nhân viên (`SALESMAN`): `first_name` (tên chính), `last_name` (họ và tên đệm), `phone` (bắt buộc), `email`, `career` (nghề nghiệp), `address` (địa chỉ), `campaign_id`.
   - Hướng dẫn định dạng câu trả lời rõ ràng: Thẻ xác nhận icon ✅ kèm bảng tóm tắt chi tiết và gợi ý 2 bước tiếp theo (Tạo cơ hội bán hàng hoặc Lên lịch liên hệ).
   - Hướng dẫn giải thích lịch sự và hiển thị thông tin khách hàng cũ khi vi phạm quy chuẩn chống trùng lặp dữ liệu BR-02 (HTTP 409 Conflict).

2. **Cơ Chế Bắt & Truyền Tải Metadata Tác Vụ Nghiệp Vụ (`BaseAgent` & `CRMAgent`):**
   - [`src/agents/base_agent.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/agents/base_agent.py):
     - Hiện thực hóa hàm `_extract_actions_from_messages()` trích xuất các tác vụ nghiệp vụ (`lead_created`, `lead_duplicate_rejected`).
     - Bổ sung tham số `return_actions: bool = False` trong `execute_chat()`, bảo toàn 100% tương thích ngược với các caller dạng chuỗi văn bản.
   - [`src/agents/crm_agent.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/agents/crm_agent.py): Hỗ trợ `return_actions=True` chuyển tiếp `(reply, actions)`.
   - [`src/schemas/chat.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/schemas/chat.py): Bổ sung `actions: Optional[List[Dict[str, Any]]] = None` vào `ChatResponse`.
   - [`src/api/routes.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/api/routes.py): Endpoint `POST /api/chat` gọi `crm_agent.chat(..., return_actions=True)` và trả về đầy đủ metadata actions cho frontend.

3. **Đồng Bộ Giao Diện Thời Gian Thực & Thẻ Tác Vụ Tương Tác:**
   - [`frontend/src/components/Chat/AIChatWidget.jsx`](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Chat/AIChatWidget.jsx):
     - Phát tín hiệu browser event `window.dispatchEvent(new CustomEvent('crm:lead-created', { detail: act.lead }))` và fallback `crm:refresh-leads`.
     - Hiển thị Thẻ Tác Vụ Xác Nhận (Interactive Action Card) ngay dưới tin nhắn của AI với badge xanh "Đã lưu CSDL", thông tin khách hàng, nút "Xem chi tiết" (dẫn đến `/leads/:id`) và nút "Tạo cơ hội (feat-029)".
   - [`frontend/src/pages/Leads/LeadListPage.jsx`](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Leads/LeadListPage.jsx):
     - Lắng nghe sự kiện `crm:lead-created` và `crm:refresh-leads`.
     - Tự động gọi `fetchLeads()` để nạp lại dữ liệu mà không cần F5/reload trang.
     - Hiển thị banner thông báo xanh: `Trợ lý AI vừa tự động thêm khách hàng tiềm năng: "[Tên]" vào hệ thống.`.

4. **Kiểm Thử Toàn Diện & Live E2E:**
   - Kịch bản Live E2E [`scratch/test_feat_028_lead_creation.py`](file:///Users/zen/CNTT/Fullstack/internship/scratch/test_feat_028_lead_creation.py):
     - Bước 1: Gửi prompt tự nhiên "Thêm khách hàng mới Nguyễn Văn Nam, SĐT 0987112233, Email nam.nguyen@gmail.com, Địa chỉ 456 Trần Phú Đà Nẵng, Nghề Kỹ sư". Gemini gọi `create_lead`, bóc tách đúng họ tên, SĐT, email, nghề, địa chỉ, gán `assigned_to=3`, lưu bản ghi ID #75 vào CSDL PostgreSQL.
     - Bước 2: Gửi prompt trùng SĐT "Tạo khách hàng mới Nguyễn Văn Nam SĐT 0987112233". Express Backend trả về 409 Conflict; Gemini giải thích lịch sự theo BR-02 và chỉ ra mã khách hàng cũ #75.
   - Thêm unit test `test_action_extraction_helper` vào [`ai-agent-service/tests/test_agent_actions.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/tests/test_agent_actions.py).

---

## 3. Bằng Chứng Kiểm Thử Đã Thực Hiện (Evidence of Verification)

| Bộ kiểm thử | Kết quả | Ghi chú |
|---|---|---|
| AI Agent Service Tests (`tests/run_tests.py`) | **PASS (23/23)** | 12 query tests + 11 agent action tests (kết nối trực tiếp Express API & CSDL) |
| Live E2E Autonomous Lead Creation | **PASS (100%)** | Gemini bóc tách tiếng Việt, lưu CSDL thành công và từ chối trùng lặp BR-02 |
| Backend Integration Tests (`backend/`) | **PASS (146/146)** | 6 test suites, 0 failures, 31.4s |
| Frontend Unit Tests (`frontend/`) | **PASS (117/117)** | 117 tests, 0 failures, 398ms |
| Frontend Production Build (`npm run build`) | **PASS (455ms)** | Vite client build `dist/` thành công, 0 lỗi cú pháp/runtime |

---

## 4. Rủi Ro & Vướng Mắc Tồn Đọng (Blockers & Risks)
- **Không có blocker nào.** Toàn bộ luồng tự động thêm Lead, kiểm tra chống trùng lặp BR-02, phân quyền phụ trách và đồng bộ thời gian thực giao diện vận hành hoàn hảo 100%.

---

## 5. Danh Sách Tính Năng Tiếp Theo Đã Cập Nhật Vào `feature_list.json`
1. **`feat-029` (BƯỚC TIẾP THEO TRỌNG TÂM):** Trợ Lý AI Tự Động Tạo Cơ Hội Bán Hàng & Khớp Sản Phẩm (Autonomous Opportunity Creation & Product Matching) — Tự động nhận diện lead qua tên/SĐT, truy vấn kho sản phẩm khớp mã và giá niêm yết, tính tổng giá trị dự kiến, tạo bản ghi opportunities trạng thái NEW.
2. **`feat-030`:** Trợ Lý AI Tự Động Ghi Nhật Ký Chăm Sóc & Chuyển Đổi Pipeline (Autonomous Follow-up Logging & Pipeline Transition).
3. **`feat-031`:** Trợ Lý AI Tự Động Chốt Đơn Hàng & Cập Nhật Tồn Kho (Autonomous Make Order & Inventory Sync).
4. **`feat-032`:** Hộp Thoại Xác Nhận Hành Động Nguy Hiểm & Thẻ Tác Vụ Tương Tác (Human-In-The-Loop Confirmation UI).
5. **`feat-033`:** Đồng Bộ Thời Gian Thực Dữ Liệu Giữa Chatbot và Giao Diện Bảng CRM (Real-time Cross-Module UI Sync).
