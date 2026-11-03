<!-- Chức năng: Biên bản bàn giao phiên: ghi lại việc vừa thực thi, blocker và bước tiếp theo khi mở phiên mới -->

# Session Handoff - Biên Bản Bàn Giao Phiên Làm Việc

## 1. Hiện Trạng & Mục Tiêu Phiên (Current State & Objective)
- **Thời gian bàn giao:** 2026-11-03 10:55
- **Trạng thái toàn hệ thống:** HOÀN THÀNH 100% (270/270 tests PASS: 146 backend + 117 frontend + 7 AI Service unit tests; Vite build 373ms, 0 lỗi linter/runtime).
- **Nhánh Git & Commit mới nhất:** `main` (commit `3eba4d7` đã push lên GitHub).
- **Cổng dịch vụ đang chạy:**
  - Express Backend: `http://localhost:5001`
  - React Frontend: `http://localhost:8080`
  - Python AI Service: `http://localhost:8000` (FastAPI / Uvicorn)
  - PostgreSQL Database: `localhost:5432` (`CRM`)

---

## 2. Công Việc Vừa Mới Thực Thi Trong Phiên Này (Just Completed)

### A. Tích Hợp Trợ Lý AI Thông Minh Zen CRM (`feat-027`):
1. **Backend Python FastAPI (`ai_service/`):**
   - `database.py`: Kết nối Connection Pool tới PostgreSQL (`CRM`), serialize an toàn các kiểu dữ liệu `Decimal` và `datetime`.
   - `crm_tools.py`: Cung cấp 6 công cụ Function Calling cho Gemini AI tra cứu trực tiếp dữ liệu thời gian thực:
     - `get_leads_summary`: Thống kê tổng lead, lead hôm nay, lead tháng này và danh sách chi tiết.
     - `get_revenue_and_forecast`: Doanh thu thực tế, đối soát chỉ tiêu tháng/năm, tính % hoàn thành.
     - `get_products_and_inventory`: Tra cứu đơn giá, mã SP, phân loại và cảnh báo hàng sắp hết ($\le 5$).
     - `get_opportunities_overview`: Thống kê Pipeline và danh sách cơ hội lớn nhất.
     - `get_campaigns_overview`: Đánh giá hiệu quả chiến dịch tiếp thị và số lead thu được.
     - `search_customer`: Tra cứu đa kênh lịch sử khách hàng, cơ hội và đơn hàng liên quan.
   - `gemini_engine.py`: Tích hợp Google GenAI SDK thế hệ mới (`gemini-flash-lite-latest` / Gemini 3.5 Flash-Lite), cấu hình System Instruction chuẩn nhận diện Zen CRM, quản lý phiên hội thoại multi-turn (Session Memory).
   - `main.py`: Cung cấp REST API CORS cho Frontend React trên cổng 8000 (`/api/health`, `/api/chat`, `/api/chat/reset`, `/api/quick-prompts`).
   - `start.sh`: Kịch bản khởi chạy 1 chạm tự động tạo venv và uvicorn reload.
   - `test_ai_service.py`: 7/7 unit & integration tests PASS 100% trong 0.055s.
   - Bảo mật: `.env` lưu API Key thật đã được đưa vào `.gitignore` (chỉ commit file mẫu `.env.example`).
2. **Giao diện Chat Widget trên React ([AIChatWidget.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Chat/AIChatWidget.jsx)):**
   - Nút FAB nổi góc dưới phải màn hình với animation pulse và icon Sparkles.
   - Cửa sổ chat phong cách Mint Pastel (`#3CB371` / `#2E8B57`) đồng bộ nhận diện Zen CRM.
   - Thanh câu hỏi nhanh 1 chạm (Quick Prompts Carousel).
   - Tích hợp bộ format Markdown (Headers, In đậm, Danh sách gạch đầu dòng, Bảng biểu, Mã code, format tiền VND).
   - Đèn báo trạng thái trực tuyến/ngoại tuyến thời gian thực, nút làm mới phiên chat (`RotateCcw`).
   - Nhúng vào [MainLayout.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Layout/MainLayout.jsx) hiển thị xuyên suốt mọi trang trong CRM.

### B. Format Dấu Chấm (`.`) Phân Cách Hàng Nghìn Cho Số Tiền:
- Viết hàm `formatNumberWithDots()` và `parseNumberFromDots()` trong [SetupPlanPage.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Forecast/SetupPlanPage.jsx).
- Áp dụng định dạng dấu chấm phân cách hàng nghìn (VD: `150.000.000`) cho 12 ô nhập chỉ tiêu tháng, ô tính nhanh `quickTotal`, và ngân sách trong [CampaignModal.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Campaigns/CampaignModal.jsx).

### C. CSDL Hành Chính Quốc Gia 3 Cấp Offline 0ms & Chuẩn Hóa Báo Cáo (`feat-026`):
- Đóng gói toàn bộ 63 Tỉnh/Thành phố, 696 Quận/Huyện, 10.051 Phường/Xã từ Tổng cục Thống kê (GSO) vào file nội bộ [vietnamAdministrative.json](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/data/vietnamAdministrative.json) (231 KB) nạp tức thì **0ms**, loại bỏ 100% phụ thuộc mạng và rớt timeout từ API bên ngoài.
- [LeadModal.jsx](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/pages/Leads/LeadModal.jsx): Loại bỏ ô Quốc gia thừa, thay bằng 3 dropdown liên hoàn trực quan: **Tỉnh / Thành phố** -> **Quận / Huyện** -> **Phường / Xã** -> và ô nhập **Địa chỉ chi tiết**.
- Chuẩn hóa Báo cáo ([report.controller.js](file:///Users/zen/CNTT/Fullstack/internship/backend/src/controllers/report.controller.js)): Sửa `entered_date::date = CURRENT_DATE`, áp dụng `COUNT(DISTINCT l.id)` triệt tiêu Cartesian product, và chuẩn hóa tỷ lệ chuyển đổi `(converted_leads / total_leads) * 100`.

---

## 3. Lộ Trình Tính Năng Đã Lập Kế Hoạch Cho Autonomous Action Agent (`feat-028` -> `feat-031`)
*(Đã cập nhật vào `feature_list.json` ở trạng thái `planned`, chưa viết code theo yêu cầu của người dùng):*

1. **`feat-028` (Planned) - Tự Động Thêm Khách Hàng Tiềm Năng (Leads):**
   - Trích xuất thực thể từ câu chat tự nhiên (Họ tên, SĐT, Email, Nghề nghiệp, Địa chỉ, Chiến dịch).
   - Kiểm tra chống trùng lặp theo BR-02: Nếu SĐT/Email đã có thì báo người dùng thông tin khách hàng hiện tại.
   - Ghi dữ liệu vào bảng `leads` PostgreSQL và trả về thẻ xác nhận kèm ID.
2. **`feat-029` (Planned) - Tự Động Tạo Cơ Hội Bán Hàng & Khớp Kho Sản Phẩm (Opportunities):**
   - Tiếp nhận yêu cầu mua hàng qua chat -> Tìm khách hàng -> Khớp mã/tên sản phẩm trong kho.
   - Tính toán giá trị ước tính (`quantity * unit_price`) và lưu vào bảng `opportunities` với trạng thái `NEW`.
3. **`feat-030` (Planned) - Tự Động Ghi Nhật Ký Chăm Sóc & Chuyển Đổi Pipeline (Follow-ups):**
   - Tiếp nhận báo cáo cuộc gọi/email/gặp mặt -> Lưu vào bảng `follow_ups`.
   - Tự động chuyển đổi trạng thái Cơ hội liên quan từ `NEW` sang `CONTACTED`.
4. **`feat-031` (Planned) - Tự Động Chốt Đơn Hàng & Trừ Tồn Kho Tức Thì (Orders):**
   - Chốt đơn qua chat -> Khóa dòng Row-level lock an toàn -> Tạo mã đơn `ORD-...` trong `orders`.
   - Tự động trừ số lượng tồn kho `stock_qty` trong `products` và cập nhật cơ hội sang `ORDERED`.

---

## 4. Bằng Chứng Kiểm Thử Tổng Hợp (Evidence of Verification)

| Bộ kiểm thử | Kết quả | Chi tiết |
|---|---|---|
| AI Service Tests (`ai_service/`) | **PASS (7/7)** | `test_ai_service.py` hoàn thành trong 0.055s |
| Backend Integration Tests (`backend/`) | **PASS (146/146)** | 6 test suites, 0 failures, 31.3s |
| Frontend Tests (`frontend/`) | **PASS (117/117)** | 112 unit tests + 5 flow integration tests |
| Frontend Production Build | **PASS (373ms)** | Vite build `dist/` thành công, 0 lỗi linter |
| Toàn hệ thống | **PASS (270/270)** | 100% tests vượt qua tuyệt đối |

---

## 5. Bước Tiếp Theo Khi Mở Phiên Mới (Next Steps)
1. Khi người dùng yêu cầu bắt đầu code cho Action Agent, tiến hành hiện thực hóa tính năng **`feat-028`**:
   - Thêm hàm `execute_mutation` vào `ai_service/database.py`.
   - Thêm tool `create_lead` vào `ai_service/crm_tools.py` kèm logic chống trùng lặp BR-02.
   - Cập nhật System Instruction cho `gemini_engine.py` và bổ sung test cases vào `test_ai_service.py`.
2. Hoặc khởi chạy kịch bản nghiệm thu toàn diện đồ án **`feat-021`** (E2E Test & Defense Script).
