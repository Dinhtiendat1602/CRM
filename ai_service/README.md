# Zen CRM AI Assistant Microservice 🤖

Microservice Trợ lý Trí tuệ Nhân tạo thông minh được xây dựng bằng **Python (FastAPI)** kết hợp mô hình ngôn ngữ thế hệ mới **Google Gemini (Gemini 3.5 Flash-Lite)** và kết nối trực tiếp với cơ sở dữ liệu **PostgreSQL (Database `CRM`)**.

---

## 🌟 Tính Năng Nổi Bật

1. **Truy vấn Dữ liệu CRM Thời gian Thực (Function Calling / Tool Calling):**
   - 👥 **Khách hàng tiềm năng (Leads):** Thống kê số lượng lead mới hôm nay, tháng này, tìm kiếm lead theo tên/sđt/email.
   - 📈 **Báo cáo Doanh số & Kế hoạch (Sales Forecast):** Doanh thu thực tế từ đơn hàng thành công, so sánh với chỉ tiêu tháng/năm, tính % hoàn thành.
   - 📦 **Danh mục Sản phẩm & Tồn kho (Inventory):** Tra cứu đơn giá, mã sản phẩm, cảnh báo hàng sắp hết (tồn kho $\le$ 5).
   - 🎯 **Cơ hội Bán hàng (Opportunities):** Thống kê theo từng giai đoạn (Pipeline) và danh sách cơ hội lớn cần theo dõi.
   - 📢 **Chiến dịch Tiếp thị (Campaigns):** Đánh giá hiệu quả các chiến dịch tiếp thị và số lượng lead thu được.
   - 🔍 **Tra cứu Khách hàng Đa kênh:** Tìm nhanh lịch sử khách hàng và các đơn hàng liên quan.

2. **Giao diện Chat Widget Hiện Đại trên React:**
   - Nút nổi **Trợ lý AI** ở góc dưới bên phải màn hình CRM (`MainLayout.jsx`).
   - Cung cấp các nút gợi ý câu hỏi nhanh 1 chạm (Quick Prompts).
   - Hỗ trợ hiển thị định dạng Markdown sinh động (in đậm, danh sách gạch đầu dòng, bảng số liệu, định dạng tiền tệ VND phân cách dấu chấm).
   - Chỉ báo trạng thái trực tuyến/ngoại tuyến thời gian thực.

---

## 🚀 Hướng Dẫn Khởi Chạy

### 1. Chuẩn bị môi trường & Cài đặt

```bash
cd ai_service

# Tạo file .env từ file mẫu nếu chưa có
cp .env.example .env
# Điền GEMINI_API_KEY và thông tin PostgreSQL vào file .env
```

### 2. Khởi động Service

Có 2 cách khởi động:

**Cách 1: Chạy bằng script tự động**
```bash
./start.sh
```

**Cách 2: Chạy trực tiếp bằng uvicorn**
```bash
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Service sẽ lắng nghe tại: `http://localhost:8000`

---

## 🧪 Kiểm Thử (Unit & Integration Tests)

Chạy bộ kiểm thử tự động cho AI Service:
```bash
venv/bin/python3 test_ai_service.py
```
Kết quả mong đợi: `Ran 7 tests ... OK`

---

## 🔌 API Endpoints

- `GET /api/health`: Kiểm tra trạng thái hoạt động của AI Service và kết nối PostgreSQL.
- `POST /api/chat`: Gửi câu hỏi và nhận câu trả lời phân tích từ Gemini AI.
- `POST /api/chat/reset`: Làm mới phiên hội thoại (xóa bộ nhớ đệm lịch sử chat).
- `GET /api/quick-prompts`: Danh sách các câu hỏi gợi ý nhanh cho giao diện.
