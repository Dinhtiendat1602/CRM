<!-- Chức năng: Biên bản bàn giao phiên: ghi lại việc vừa thực thi, blocker và bước tiếp theo khi mở phiên mới -->

# Session Handoff - Biên Bản Bàn Giao Phiên Làm Việc

## 1. Hiện Trạng & Mục Tiêu Phiên (Current State & Objective)
- **Thời gian bàn giao:** 2026-11-22 21:15
- **Nội dung trọng tâm vừa hoàn thành:** `feat-029`: **Trợ Lý AI Tự Động Tạo Cơ Hội Bán Hàng & Khớp Sản Phẩm (Autonomous Opportunity Creation & Product Matching)** kết hợp cơ chế Đồng Bộ Giao Diện CRM Thời Gian Thực (Real-time Cross-Module UI Sync) và Thẻ Tác Vụ Tương Tác (Interactive Action Confirmation Card).
- **Trạng thái hệ thống:** HOÀN THÀNH 100% (23/23 AI Agent tests PASS + 146/146 Express Backend tests PASS + 117/117 Frontend tests PASS; Vite frontend production build thành công trong 415ms; Live E2E Gemini Chat Agent kiểm thử thực tế đạt 100%).
- **Cổng dịch vụ đang cấu hình:**
  - Express Backend: `http://localhost:8888`
  - React Frontend: `http://localhost:8080`
  - Python AI Agent Service: `http://localhost:8000` (`ai-agent-service/main.py`)
  - PostgreSQL Database: `localhost:5432` (`CRM`)

---

## 2. Công Việc Vừa Mới Thực Thi Trong Phiên Này (Just Completed)

1. **Nâng cấp `create_opportunity` Tool ([ai-agent-service/src/tools/order_tools.py](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/tools/order_tools.py)):**
   - Hỗ trợ cả `lead_id` và `customer_name_or_phone` trong tham số tool.
   - Tự động bóc tách tiền tố xưng hô tiếng Việt ("anh", "chị", "khách", "khách hàng"), tìm kiếm `/leads?search=...`, ưu tiên Lead thuộc quyền phụ trách của Salesman đang gọi.
   - Khớp sản phẩm thông minh qua `/products?search=...` kết hợp tra cứu theo từ khóa danh mục kho (ví dụ: "Kit Livestream Pro 4K" -> ID 8, mã `LIVE-KIT-STUDIO`, đơn giá 15.500.000 ₫).
   - Tự động chuẩn hóa ngày dự kiến chốt `parse_expected_date()` (ví dụ: "20/11" -> "2026-11-20" theo năm hệ thống 2026) và trích xuất số lượng `parse_quantity()` (ví dụ: "2 bộ" -> 2).
   - Tự động tính toán tổng doanh số dự kiến `expected_revenue = quantity * unit_price` (2 * 15.500.000 = 31.000.000 ₫).
   - Xử lý mã lỗi HTTP 409 Conflict (quy tắc nghiệp vụ BR-02: chặn tạo cơ hội trùng khi cơ hội trước chưa đóng) -> trả về action `opportunity_duplicate_rejected` kèm `existing_opportunity_id`.
   - Xử lý mã lỗi HTTP 403 Forbidden (kiểm tra phân quyền Salesman theo `salesman_products`) -> từ chối lịch sự bằng tiếng Việt.

2. **Cơ Chế Bắt & Truyền Tải Metadata Tác Vụ Nghiệp Vụ (`BaseAgent` & `backend_client.py`):**
   - [`src/services/backend_client.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/services/backend_client.py): Trích xuất `existing_opportunity_id` khi Backend Express trả về 409 Conflict.
   - [`src/agents/base_agent.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/agents/base_agent.py): Hàm `_extract_actions_from_messages()` trích xuất các tác vụ `opportunity_created` và `opportunity_duplicate_rejected`.

3. **Nâng cấp System Instructions (`config/prompts.py`):**
   - Thêm hướng dẫn chi tiết cho cả `SALE_MANAGER` và `SALESMAN` về cách gọi `create_opportunity` tự động với các tham số tìm kiếm tiếng Việt.
   - Định dạng câu trả lời rõ ràng: Thẻ xác nhận icon 🎯 kèm bảng thông tin tài chính chi tiết (Sản phẩm, Đơn giá niêm yết, Số lượng, Tổng doanh thu dự kiến, Ngày dự kiến chốt) và 2 bước gợi ý tiếp theo (Lên lịch gọi điện hoặc Gửi báo giá).

4. **Đồng Bộ Giao Diện Thời Gian Thực & Thẻ Tác Vụ Tương Tác:**
   - [`frontend/src/components/Chat/AIChatWidget.jsx`](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Chat/AIChatWidget.jsx):
     - Phát tín hiệu browser event `crm:opportunity-created` kèm dữ liệu cơ hội và `crm:refresh-opportunities`.
     - Hiển thị Thẻ Tác Vụ Xác Nhận Cơ Hội (Interactive Action Card) màu xanh lam nhạt với đầy đủ thông tin: Mã cơ hội, Tên cơ hội, Sản phẩm, Số lượng, Đơn giá, Tổng doanh thu dự kiến, nút "Xem chi tiết" và nút "Ghi chăm sóc (feat-030)".
   - [`frontend/src/pages/Opportunities/OpportunityListPage.jsx`](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Opportunities/OpportunityListPage.jsx):
     - Lắng nghe sự kiện `crm:opportunity-created` và `crm:refresh-opportunities`.
     - Tự động nạp lại danh sách cơ hội thời gian thực mà không cần F5/reload trang.
     - Hiển thị banner thông báo xanh: `Trợ lý AI vừa tự động tạo cơ hội bán hàng: "[Tên cơ hội]" vào hệ thống.`.

5. **Kiểm Thử Toàn Diện & Live E2E:**
   - Kịch bản Live E2E [`scratch/test_feat_029_opportunity_creation.py`](file:///Users/zen/CNTT/Fullstack/internship/scratch/test_feat_029_opportunity_creation.py):
     - Prompt tự nhiên: "Tạo cơ hội cho anh Nam mua 2 bộ Kit Livestream Pro 4K dự kiến chốt 20/11".
     - Gemini nhận diện Lead #79 (Nguyễn Văn Nam), khớp sản phẩm ID 8 (`LIVE-KIT-STUDIO`), đơn giá 15.500.000 ₫, tính doanh số 31.000.000 ₫, chuẩn hóa ngày 2026-11-20, tạo cơ hội mới ID #194 trạng thái NEW.
     - Prompt trùng lặp: Express trả về 409 Conflict, Gemini từ chối lịch sự và hiển thị mã cơ hội cũ #194 theo BR-02.

---

## 3. Bằng Chứng Kiểm Thử Đã Thực Hiện (Evidence of Verification)

| Bộ kiểm thử | Kết quả | Ghi chú |
|---|---|---|
| AI Agent Service Tests (`tests/run_tests.py`) | **PASS (23/23)** | 100% tests đạt chuẩn |
| Live E2E Autonomous Opportunity Creation | **PASS (100%)** | Gemini bóc tách tiếng Việt, khớp sản phẩm và lưu CSDL thành công |
| Backend Integration Tests (`backend/`) | **PASS (146/146)** | 6 test suites, 0 failures |
| Frontend Unit Tests (`frontend/`) | **PASS (117/117)** | 117 tests, 0 failures |
| Frontend Production Build (`npm run build`) | **PASS (415ms)** | Vite client build `dist/` thành công |

---

## 4. Rủi Ro & Vướng Mắc Tồn Đọng (Blockers & Risks)
- **Không có blocker nào.** Hệ thống hoạt động trơn tru và sẵn sàng triển khai `feat-030`.

---

## 5. Danh Sách Tính Năng Tiếp Theo Đã Cập Nhật Vào `feature_list.json`
1. **`feat-030` (BƯỚC TIẾP THEO TRỌNG TÂM):** Trợ Lý AI Tự Động Ghi Nhật Ký Chăm Sóc & Chuyển Đổi Pipeline (Autonomous Follow-up Logging & Pipeline Transition) — Agent tự động tiếp nhận báo cáo kết quả cuộc gọi/gặp gỡ của nhân viên bán hàng (VD: 'Vừa gọi điện cho khách Nam, khách hào hứng xin báo giá, kế hoạch ngày mai gửi báo giá qua Zalo'). Agent tự động trích xuất nội dung, phản hồi khách hàng, kế hoạch tiếp theo và hình thức liên hệ (PHONE/EMAIL/MEETING), lưu vào bảng follow_ups, đồng thời tự động cập nhật trạng thái cơ hội bán hàng liên quan từ NEW sang CONTACTED (SRS 3.11).
2. **`feat-031`:** Trợ Lý AI Tự Động Chốt Đơn Hàng & Cập Nhật Tồn Kho (Autonomous Make Order & Inventory Sync).
3. **`feat-032`:** Hộp Thoại Xác Nhận Hành Động Nguy Hiểm & Thẻ Tác Vụ Tương Tác (Human-In-The-Loop Confirmation UI).
4. **`feat-033`:** Đồng Bộ Thời Gian Thực Dữ Liệu Giữa Chatbot và Giao Diện Bảng CRM (Real-time Cross-Module UI Sync).
5. **`feat-034`:** Phân Tích Thông Minh & Chấm Điểm Xác Suất Chốt Đơn Bằng AI (AI Deal Win-Rate Scoring & Sales Coaching).
