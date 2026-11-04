<!-- Chức năng: Biên bản bàn giao phiên: ghi lại việc vừa thực thi, blocker và bước tiếp theo khi mở phiên mới -->

# Session Handoff - Biên Bản Bàn Giao Phiên Làm Việc

## 1. Hiện Trạng & Mục Tiêu Phiên (Current State & Objective)
- **Thời gian bàn giao:** 2026-11-04 10:30
- **Nội dung trọng tâm:** Điều tra và khắc phục triệt để lỗi AI trả lời sai thông tin người dùng hỏi trên Chatbot (`feat-027`).
- **Trạng thái hệ thống:** HOÀN THÀNH 100% (273/273 tests PASS: 10/10 AI Service tests + 146/146 backend tests + 117/117 frontend tests; Vite build thành công 441ms, 0 lỗi runtime).
- **Cổng dịch vụ đang hoạt động:**
  - Express Backend: `http://localhost:5001` (PID 48798)
  - React Frontend: `http://localhost:8080` (PID 948)
  - Python AI Service: `http://localhost:8000` (FastAPI / Uvicorn PID 49567)
  - PostgreSQL Database: `localhost:5432` (`CRM`)

---

## 2. Công Việc Vừa Mới Thực Thi Trong Phiên Này (Just Completed)

### A. Phân Tích & Khắc Phục Triệt Để Lỗi AI Trả Lời Sai:
1. **Khắc phục lỗi tìm kiếm khách hàng ("Không tìm thấy khách hàng Nguyễn Văn An"):**
   - **Nguyên nhân:** Tool `search_customer` trước đây so khớp từng cột `WHERE first_name ILIKE %s OR last_name ILIKE %s`, trong khi họ và tên bị tách rời giữa 2 cột (hoặc người dùng gõ có dấu còn DB lưu không dấu).
   - **Khắc phục:** Kích hoạt extension PostgreSQL `unaccent` và xây dựng điều kiện tìm kiếm đa chiều:
     `unaccent(first_name || ' ' || last_name) ILIKE unaccent(%s)` và `unaccent(last_name || ' ' || first_name) ILIKE unaccent(%s)`, kết hợp tìm theo SĐT và Email.
2. **Khắc phục lỗi đảo ngược họ tên tiếng Việt:**
   - Xây dựng hàm `format_vietnamese_name(first_name, last_name)` nhận diện tự động cấu trúc họ và tên Việt Nam (xử lý cả dữ liệu seed `Nguyen` + `Van An` -> `Nguyen Van An`, và dữ liệu tạo từ giao diện `Đức` + `Phan Cảnh` -> `Phan Cảnh Đức`).
3. **Bổ sung chi tiết sản phẩm đã mua vào lịch sử đơn hàng:**
   - Trong `search_customer`, bổ sung `JOIN products p ON o.product_id = p.id` để cung cấp rõ ràng: mã đơn hàng, tên sản phẩm đã mua, mã sản phẩm, số lượng, đơn giá, tổng tiền, ngày mua và trạng thái đơn hàng.
   - Nhờ đó khi hỏi "Khách hàng Nguyễn Văn An đã mua những gì?", AI trả lời chính xác 100% cả 2 đơn hàng: 2 chiếc Máy ảnh Sony Alpha A7 Mark IV Body (`ORD-20260115-0001`) và 1 Gói bản quyền Zen CRM Enterprise (`ORD-20260128-0002`).
4. **Chuẩn hóa công cụ tồn kho & danh mục sản phẩm (`get_products_and_inventory`):**
   - Bổ sung `tong_so_san_pham_toan_he_thong` (20 sản phẩm), tăng limit nạp trọn bộ 20 sản phẩm (thay vì bị cắt ở 15 làm AI hiểu nhầm tổng số sản phẩm).
   - Hỗ trợ tìm kiếm theo danh mục và tên có dấu / không dấu qua `unaccent`.
5. **Bổ sung phân rã doanh thu 12 tháng (`get_revenue_and_forecast`):**
   - Bổ sung trường `bang_tong_hop_doanh_thu_cac_thang_nam` trả về doanh số từng tháng trong năm 2026, giúp AI trả lời ngay tháng nào đạt doanh số cao nhất (Tháng 10 đạt 291.300.000 ₫) và tổng doanh thu cả năm (1.722.700.000 ₫).
6. **Bổ sung công cụ tra cứu đơn hàng mới (`get_orders_summary`):**
   - Cung cấp công cụ Function Calling cho phép AI tra cứu danh sách đơn hàng gần nhất hoặc tìm kiếm theo mã đơn hàng (`ORD-...`), tên khách hàng hoặc sản phẩm.

---

## 3. Bằng Chứng Kiểm Thử Đã Thực Hiện (Evidence of Verification)

| Bộ kiểm thử | Kết quả | Ghi chú |
|---|---|---|
| AI Service Tests (`ai_service/test_ai_service.py`) | **PASS (10/10)** | Đầy đủ 10 unit & integration tests cho tất cả CRM tools |
| Backend Tests (`backend/`) | **PASS (146/146)** | 6 test suites, 0 failures, 31.9s |
| Frontend Tests (`frontend/`) | **PASS (117/117)** | 112 unit tests + 5 flow integration tests |
| Frontend Build (`npm run build`) | **PASS (441ms)** | Vite production build `dist/` thành công, 0 lỗi |
| Live API Chat Verification (`POST /api/chat`) | **PASS 100%** | AI trả lời chính xác đơn hàng Nguyễn Văn An, Phan Cảnh Đức, tồn kho 20 SP, doanh số 2026 |

---

## 4. Bước Tiếp Theo Khi Mở Phiên Mới (Next Steps)
1. Khi người dùng yêu cầu bắt đầu code cho Action Agent, triển khai theo thứ tự các tính năng đã lên kế hoạch trong `feature_list.json` (`feat-028` -> `feat-031`).
2. Tiến hành kịch bản nghiệm thu toàn diện đồ án **`feat-021`** (E2E Test & Defense Script).
