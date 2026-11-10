# CHƯƠNG TRÌNH HUẤN LUYỆN THỰC TẬP 3 TUẦN
## TÍCH HỢP AI & XÂY DỰNG TRỢ LÝ ẢO THÔNG MINH CHO ZEN CRM ENTERPRISE

> **Dự án:** Zen CRM Enterprise AI Assistant & Autonomous Agent  
> **Thời lượng:** 03 tuần × 04 ngày/tuần = 12 ngày thực tập  
> **Mô hình làm việc:** Mentor định hướng & giao việc $\rightarrow$ Sinh viên nghiên cứu, lập trình, kiểm thử $\rightarrow$ Báo cáo & phản biện cuối ngày $\rightarrow$ Đẩy mã nguồn lên Git hàng ngày  
> **Công nghệ áp dụng:** Python 3.11, FastAPI, Google Gemini API (GenAI SDK), PostgreSQL (psycopg2 pool), React 18 (Vite, Tailwind CSS), Redis Cache  

---

## I. MỤC TIÊU VÀ PHƯƠNG PHÁP THỰC TẬP

- **Hiểu sâu nguyên lý LLM & AI Integration:** Nắm vững cơ chế Prompt Engineering, Tokens, Context Window và quy trình tích hợp mô hình ngôn ngữ lớn (Google Gemini) vào hệ sinh thái ứng dụng doanh nghiệp.
- **Xây dựng Giao diện Chatbot Doanh nghiệp:** Thiết kế Widget Chatbot React hiện đại, hỗ trợ hiển thị Markdown, số liệu tài chính `₫`, gợi ý câu hỏi nhanh 1 chạm và tính năng thu phóng linh hoạt.
- **Làm chủ Function Calling thời gian thực:** Kết nối AI trực tiếp với CSDL PostgreSQL để tự động truy vấn dữ liệu kinh doanh (Khách hàng, Doanh số, Tồn kho, Cơ hội bán hàng, Chiến dịch tiếp thị).
- **Phát triển Autonomous Agent:** Nâng cấp từ Chatbot hỏi đáp thông thường lên Agent tự động thao tác nghiệp vụ (Thêm khách hàng tiềm năng, Khớp sản phẩm, Ghi nhật ký chăm sóc, Chốt đơn hàng trừ kho có Transaction Lock an toàn).
- **Quy chuẩn kỹ thuật chuyên nghiệp:** Áp dụng kiến trúc Clean Architecture, xây dựng bộ kiểm thử tự động (Unit Test / Integration Test) 100% đạt chuẩn công nghiệp.

---

## II. KẾ HOẠCH CHI TIẾT 12 NGÀY THỰC TẬP

### 📅 TUẦN 1 – NỀN TẢNG LLM VÀ TÍCH HỢP AI VÀO HỆ THỐNG CRM

| Ngày | Nhiệm vụ trọng tâm | Nội dung nghiên cứu & Kỹ thuật thực hiện | Sản phẩm đầu ra |
| :---: | :--- | :--- | :--- |
| **Ngày 1** | **Tổng quan LLM & Kiến trúc AI Microservice** | - Tìm hiểu Generative AI, LLM, Prompt, Token, Context Window.<br>- Thiết kế kiến trúc Microservice: Tách biệt AI Service (Python FastAPI, cổng 8000) với Backend chính (Node.js Express, cổng 5001).<br>- Thiết lập môi trường Python venv và chạy thử nghiệm lời gọi Gemini API đầu tiên. | Sơ đồ kiến trúc hệ thống;<br>Chạy thử nghiệm thành công 1 lời gọi Google GenAI API. |
| **Ngày 2** | **Tích hợp Gemini API vào ứng dụng FastAPI** | - Xây dựng REST API bằng FastAPI (`/api/health`, `/api/chat`).<br>- Thiết kế System Instruction chuyên biệt cho Trợ lý Zen CRM (ngữ cảnh hệ thống năm 2026, văn phong Tiếng Việt chuẩn mực).<br>- Cấu hình tham số sinh (`temperature=0.2`), chuẩn hóa Request/Response Pydantic và xử lý ngoại lệ (Rate Limit 429, lỗi mạng). | Microservice AI FastAPI chạy hoàn chỉnh trên cổng 8000;<br>Hỏi đáp cơ bản qua Swagger UI / Curl. |
| **Ngày 3** | **Xây dựng Giao diện Chatbot React Vite** | - Xây dựng component `AIChatWidget.jsx` nhúng vào giao diện chính `MainLayout.jsx`.<br>- Thiết kế nút FAB nổi góc phải màn hình với màu xanh Mint Pastel chuẩn thương hiệu.<br>- Tích hợp bộ định dạng Markdown, hiển thị bảng biểu, nút phóng to/thu nhỏ và danh sách câu hỏi gợi ý nhanh 1 chạm. | Chatbot Web widget hoàn chỉnh nhúng vào CRM, giao diện đẹp mắt, tương thích cả máy tính và điện thoại. |
| **Ngày 4** | **Quản lý Ngữ cảnh Hội thoại Đa Lượt (Context)** | - Quản lý lịch sử trò chuyện nhiều lượt (Multi-turn chat) theo từng `session_id`.<br>- Xây dựng module `SessionMemory` (In-Memory Buffer kết hợp cơ chế dự phòng Redis).<br>- Xây dựng API `/api/chat/reset` để làm mới phiên trò chuyện.<br>- Viết kịch bản kiểm thử các tình huống hỏi đáp liên hoàn. | Phiên bản Chatbot v1 duy trì ngữ cảnh trò chuyện mượt mà;<br>Bộ test tự động kiểm thử hội thoại đạt 100%. |

---

### 📅 TUẦN 2 – DỮ LIỆU CRM THỜI GIAN THỰC & FUNCTION CALLING (READ-ONLY TOOLS)

| Ngày | Nhiệm vụ trọng tâm | Nội dung nghiên cứu & Kỹ thuật thực hiện | Sản phẩm đầu ra |
| :---: | :--- | :--- | :--- |
| **Ngày 5** | **Kết nối PostgreSQL & Xử lý Tiếng Việt** | - Cấu hình `ThreadedConnectionPool` kết nối an toàn tới cơ sở dữ liệu `CRM`.<br>- Kích hoạt PostgreSQL extension `unaccent` để hỗ trợ tìm kiếm Tiếng Việt có dấu và không dấu.<br>- Xây dựng hàm `format_vietnamese_name` tự động chuẩn hóa cấu trúc Họ và Tên Việt Nam. | Module `database/connection.py` và `utils/normalizer.py` hoạt động ổn định, test kết nối đạt 100%. |
| **Ngày 6** | **Xây dựng Bộ công cụ Tra cứu CRM (Query Tools)** | - Hiện thực hóa 6 công cụ truy vấn dữ liệu cốt lõi:<br>  1. `get_leads_summary`: Thống kê khách tiềm năng mới.<br>  2. `get_revenue_and_forecast`: Doanh số thực tế & tiến độ chỉ tiêu 12 tháng.<br>  3. `get_products_and_inventory`: Danh mục và cảnh báo tồn kho $\le$ 5.<br>  4. `get_opportunities_overview`: Tổng quan phễu bán hàng (Pipeline).<br>  5. `get_campaigns_overview`: Hiệu quả chiến dịch tiếp thị.<br>  6. `get_orders_summary`: Danh sách và trạng thái đơn hàng. | Bộ 6 Python Tool Functions có docstring và type hints chuẩn mực sẵn sàng cho LLM. |
| **Ngày 7** | **Tích hợp Function Calling vào Gemini Engine** | - Đăng ký danh sách `ALL_CRM_TOOLS` vào cấu hình `GenerateContentConfig` của Gemini SDK.<br>- Xây dựng cơ chế Tool Execution Loop: Khi người dùng đặt câu hỏi kinh doanh, Gemini tự động kích hoạt hàm tương ứng, nhận dữ liệu SQL và tổng hợp câu trả lời chuẩn xác. | Chatbot phiên bản 2 có khả năng trả lời báo cáo doanh thu, tồn kho, khách hàng với số liệu thật 100%. |
| **Ngày 8** | **Hồ sơ Khách hàng 360° & Bộ Kiểm thử Tự động** | - Phát triển công cụ `search_customer`: Tra cứu đa chiều theo Tên, SĐT, Email; trích xuất toàn bộ lịch sử mua hàng, sản phẩm đã mua, cơ hội và nhật ký tư vấn.<br>- Xây dựng bộ kiểm thử tự động `tests/test_queries.py` xác thực độ chính xác của toàn bộ các tool tra cứu. | Báo cáo kiểm thử 100% PASS;<br>AI trả lời chính xác từng đơn hàng và sản phẩm của từng khách hàng cụ thể. |

---

### 📅 TUẦN 3 – AUTONOMOUS AGENT (ACTION TOOLS), AN TOÀN DỮ LIỆU & BẢO VỆ ĐỒ ÁN

| Ngày | Nhiệm vụ trọng tâm | Nội dung nghiên cứu & Kỹ thuật thực hiện | Sản phẩm đầu ra |
| :---: | :--- | :--- | :--- |
| **Ngày 9** | **Tự động Thêm Lead & Chống trùng lặp BR-02** | - Phát triển công cụ hành động `create_lead`: Agent tự động bóc tách thông tin từ tin nhắn tự nhiên (Họ tên, SĐT, Email, Nghề nghiệp, Địa chỉ).<br>- Tích hợp quy chuẩn nghiệp vụ **BR-02**: Kiểm tra chống trùng SĐT/Email trên CSDL trước khi thêm mới.<br>- Thực hiện lệnh `INSERT` an toàn và trả về phản hồi kèm gợi ý hành động tiếp theo. | Tính năng thêm khách hàng mới qua chat hoàn tất;<br>Tự động phát hiện và chặn trùng dữ liệu chính xác. |
| **Ngày 10** | **Tự động Tạo Cơ hội & Chốt đơn trừ Tồn kho** | - Phát triển công cụ `create_opportunity`: Tự động tìm khách hàng, khớp mã sản phẩm và tính toán doanh thu dự kiến.<br>- Phát triển công cụ `make_order`: Áp dụng PostgreSQL Transaction (`BEGIN ... COMMIT`) và Row-level Lock (`FOR UPDATE`) để trừ tồn kho an toàn, tránh xung đột race condition.<br>- Xây dựng `router.py` (Intent Router) phân loại ý định người dùng. | Agent hoàn thành đầy đủ chu trình bán hàng khép kín từ Tiếp cận $\rightarrow$ Báo giá $\rightarrow$ Chốt đơn hàng. |
| **Ngày 11** | **Xác nhận An toàn (Human-In-The-Loop) & Đồng bộ Real-time** | - Thiết kế cơ chế Human-In-The-Loop: Hiển thị Thẻ Xác Nhận Hành Động (Action Card) trên khung chat trước khi thực thi lệnh trừ kho.<br>- Phát tín hiệu Custom Event để đồng bộ dữ liệu thời gian thực sang các bảng trên giao diện React mà không cần reload trang (F5).<br>- Tối ưu hóa hiệu năng và bảo mật API Keys. | Trải nghiệm người dùng thông minh, an toàn tuyệt đối và liền mạch giữa Chatbot và Giao diện Web. |
| **Ngày 12** | **Hoàn thiện Báo cáo, Đóng gói & Bảo vệ Đồ án** | - Rà soát toàn bộ tài liệu kỹ thuật: `README.md`, `ARCHITECTURE.md`, `feature_list.json`.<br>- Chuẩn bị kịch bản demo trực tiếp các tình huống nghiệp vụ thực tế.<br>- Hoàn thiện slide thuyết trình và tiến hành bảo vệ đồ án thực tập. | Đồ án hoàn chỉnh 100% tiêu chí xuất sắc;<br>Mã nguồn sạch sẽ, sẵn sàng nghiệm thu và bàn giao. |

---

## III. NỘI DUNG MENTOR KIỂM TRA THEO TỪNG TUẦN

### 🔍 Cuối Tuần 1: Nền tảng LLM, Tích hợp & Quản lý Hội thoại
- [x] Phân biệt rõ ràng khái niệm: LLM (mô hình), API (cầu nối giao tiếp) và Chatbot (ứng dụng hoàn chỉnh).
- [x] Mô tả chi tiết kiến trúc kết nối Client - Server giữa React Vite và Python FastAPI.
- [x] Giải thích cơ chế System Prompt định hình phong cách phản hồi và cách quản lý Lịch sử hội thoại (Context) cho các câu hỏi nối tiếp.
- [x] Trình diễn ứng dụng thực tế và diễn giải các đoạn mã cốt lõi (`main.py`, `base_agent.py`, `redis_memory.py`, `AIChatWidget.jsx`).

### 🔍 Cuối Tuần 2: Tích hợp CSDL CRM & Kỹ thuật Function Calling
- [ ] Giải thích sự khác biệt giữa RAG (văn bản phi cấu trúc) và Function Calling / Text-to-SQL (CSDL có cấu trúc PostgreSQL).
- [ ] Trình bày giải pháp xử lý Tiếng Việt có dấu / không dấu đồng nhất bằng PostgreSQL extension `unaccent`.
- [ ] Demo trực tiếp khả năng AI tự động gọi các công cụ tra cứu thời gian thực: Báo cáo doanh số 12 tháng, kiểm tra hàng sắp hết trong kho, tra cứu lịch sử mua hàng 360 độ của khách hàng.
- [ ] Giải thích cách xử lý ngoại lệ khi dữ liệu CSDL trả về rỗng hoặc không tìm thấy khách hàng.

### 🔍 Cuối Tuần 3: Autonomous Agent, An toàn Giao dịch & Demo Toàn trình
- [ ] Trình diễn luồng làm việc tự động khép kín của Agent: Từ câu lệnh chat thêm Lead $\rightarrow$ Khớp sản phẩm tạo Cơ hội $\rightarrow$ Chốt đơn hàng trừ kho.
- [ ] Chứng minh tính an toàn dữ liệu: Cơ chế kiểm tra chống trùng lặp Lead (BR-02) và kỹ thuật Row-level Lock khi chốt đơn trừ kho sản phẩm.
- [ ] Trình bày kiến trúc Clean Architecture của thư mục `ai-agent-service/` (`config/`, `agents/`, `tools/`, `database/`, `schemas/`, `api/`).
- [ ] Báo cáo kết quả kiểm thử tự động toàn diện và đề xuất các hướng phát triển mở rộng trong tương lai.

---

## IV. TIÊU CHÍ NGHIỆM THU SẢN PHẨM CUỐI KỲ (DoD)

1. **Giao diện & Trải nghiệm:** Chatbot widget hoạt động mượt mà, hỗ trợ phóng to toàn màn hình, gợi ý câu hỏi 1 chạm, định dạng Markdown và hiển thị tiền tệ `₫` chuẩn xác.
2. **Độ chính xác dữ liệu:** Trả lời đúng 100% số liệu thực tế từ cơ sở dữ liệu PostgreSQL (năm tài chính 2026), tuyệt đối không phỏng đoán hay bịa đặt.
3. **Năng lực Autonomous Agent:** Tự động thực hiện thành công các thao tác ghi dữ liệu (thêm Lead, tạo Deal, chốt đơn) và kiểm soát an toàn giao dịch.
4. **Kiểm thử tự động:** Vượt qua 100% các bài test tự động (Backend, Frontend, AI Agent Service) mà không có lỗi runtime.
5. **Tài liệu & Mã nguồn:** Mã nguồn sạch sẽ, tổ chức theo chuẩn công nghiệp, có tài liệu hướng dẫn cài đặt và vận hành chi tiết.

---

## V. BỘ CÂU HỎI & ĐÁP ÁN PHẢN BIỆN DÀNH CHO MENTOR (CUỐI TUẦN 1)

### Câu 1: Phân biệt LLM, API và Chatbot? Mô tả kiến trúc kết nối hệ thống?
* **LLM (Large Language Model):** Là mô hình nền tảng (ở đây dùng Google Gemini `gemini-flash-lite-latest`) đóng vai trò 'bộ não' xử lý ngôn ngữ tự nhiên, hiểu ngữ cảnh và sinh câu trả lời.
* **API (Application Programming Interface):** Là giao thức mạng trung gian (RESTful HTTP). Backend gửi câu hỏi kèm system prompt qua API của Google GenAI và nhận về kết quả JSON.
* **Chatbot:** Là sản phẩm ứng dụng hoàn chỉnh đến tay người dùng, bao gồm giao diện tương tác (Frontend React), backend điều phối logic (FastAPI) và bộ nhớ ngữ cảnh trò chuyện.
* **Kiến trúc kết nối:**  
  `User (React UI)` $\xrightarrow{\text{POST /api/chat}}$ `FastAPI Backend (:8000)` $\xrightarrow{\text{load context}}$ `SessionMemory` $\xrightarrow{\text{GenAI SDK}}$ `Google Gemini API` $\xrightarrow{\text{Function Calling}}$ `PostgreSQL Database (:5432)`.

---

### Câu 2: Giải thích cách System Prompt và Lịch sử hội thoại tác động đến phản hồi?
* **System Prompt (`config/prompts.py`):** Là tập chỉ thị cố định được nạp trước mỗi lượt trò chuyện. Nó ép mô hình phải tuân thủ nghiêm ngặt: danh xưng "Zen AI Assistant", mốc thời gian hệ thống cố định năm 2026, văn phong Tiếng Việt chuyên nghiệp, định dạng tiền tệ `₫` và nguyên tắc bắt buộc phải gọi tool khi người dùng hỏi về số liệu thực tế.
* **Lịch sử hội thoại (Context / History):** Bản chất LLM là Stateless (không tự nhớ câu hỏi trước). Để AI hiểu được các câu hỏi nối tiếp (ví dụ: *"Họ gồm những ai?"* ngay sau câu *"Hôm nay có bao nhiêu Lead?"*), hệ thống phải duy trì bộ nhớ đệm và gửi toàn bộ các cặp tin nhắn `User - Model` trước đó vào payload cho LLM đọc lại ngữ cảnh.

---

### Câu 3: Cơ chế lưu trữ lịch sử hội thoại (Conversation History Persistence) hoạt động như thế nào?
* **Phía Frontend (Client-side):** Component `AIChatWidget.jsx` tự động đồng bộ danh sách tin nhắn vào `localStorage` (`zen_crm_ai_chat_messages`) và duy trì `sessionId` duy nhất. Nhờ đó khi người dùng chuyển trang hoặc tải lại trang (F5), toàn bộ tin nhắn trước đó **không bị mất**.
* **Phía Backend (Server-side):** Module `src/memory/redis_memory.py` quản lý hội thoại đa tầng:
  1. *Bộ nhớ đệm RAM (In-Memory Buffer):* Truy xuất siêu tốc cho các lượt chat liên tục.
  2. *Lưu trữ bền vững (Disk Persistence):* Tự động ghi nhận từng tin nhắn ra file `storage/logs/chat_history_{session_id}.json` để bảo toàn dữ liệu kể cả khi server khởi động lại.
  3. *Mở rộng Redis:* Sẵn sàng đồng bộ sang Redis Cluster cho môi trường Production đa người dùng.
* **API Lịch sử & Làm mới:** Cung cấp endpoint `GET /api/chat/history` để trích xuất tin nhắn và `POST /api/chat/reset` để xóa sạch phiên trò chuyện khi người dùng muốn bắt đầu chủ đề mới.

---

### Câu 4: Nếu doanh nghiệp yêu cầu bảo mật On-Premise không dùng Cloud API thì giải quyết thế nào?
* Sử dụng công cụ chạy mô hình cục bộ như **Ollama** hoặc **LM Studio** để tự host các mô hình mã nguồn mở (ví dụ: `Llama-3-8B-Instruct` hoặc `Qwen-2.5-7B`).
* Trong mã nguồn `ai-agent-service`, kiến trúc đã được phân lớp độc lập (`src/llm/client.py` và `src/agents/base_agent.py`), chỉ cần trỏ endpoint từ Google GenAI sang `http://localhost:11434/v1` (tương thích chuẩn OpenAI API) là hệ thống có thể chạy hoàn toàn offline không cần internet, bảo mật dữ liệu khách hàng tuyệt đối 100%.

---

### Câu 5: Diễn giải các file mã nguồn cốt lõi cần trình diễn cho Mentor?
1. [`ai-agent-service/main.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/main.py): Khởi chạy FastAPI, cấu hình CORS và định tuyến các API `/api/chat`, `/api/chat/history`, `/api/health`.
2. [`ai-agent-service/config/prompts.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/config/prompts.py): System Instructions quy định tính cách, ngữ cảnh 2026 và bộ quy tắc an toàn.
3. [`ai-agent-service/src/agents/base_agent.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/agents/base_agent.py): Wrapper gọi Gemini API, cấu hình `temperature=0.2`, nạp tools và điều phối hội thoại.
4. [`ai-agent-service/src/memory/redis_memory.py`](file:///Users/zen/CNTT/Fullstack/internship/ai-agent-service/src/memory/redis_memory.py): Lưu trữ lịch sử tin nhắn đa tầng (RAM buffer + JSON Disk Storage + Redis).
5. [`frontend/src/components/Chat/AIChatWidget.jsx`](file:///Users/zen/CNTT/Fullstack/internship/frontend/src/components/Chat/AIChatWidget.jsx): Giao diện Chatbot React Vite, lưu lịch sử `localStorage`, phóng to/thu nhỏ và format Markdown.

