# Zen CRM Enterprise AI Agent Microservice (`ai-agent-service`)

Microservice Trí tuệ Nhân tạo thông minh hỗ trợ hệ thống quản trị quan hệ khách hàng Zen CRM Enterprise. Dịch vụ được xây dựng trên nền tảng **Python FastAPI**, tích hợp **Google Gemini SDK** (GenAI v1), kết nối trực tiếp với cơ sở dữ liệu **PostgreSQL** để thực thi Function Calling và Autonomous Agent Actions.

---

## 🏗️ Sơ đồ Kiến trúc Luồng Dữ liệu (Architecture Flow)

```bash
ai-agent-service/
├── config/                  # Cấu hình hệ thống & System Prompts
│   ├── __init__.py
│   ├── settings.py          # Quản lý biến môi trường (.env)
│   └── prompts.py           # System instruction chuẩn mực cho Zen AI Assistant
│
├── alembic/                 # Quản lý Database Migration (Chuẩn CSDL)
│   ├── versions/
│   └── env.py
│
├── src/
│   ├── agents/              # Bộ não điều phối & Logic Agent
│   │   ├── __init__.py
│   │   ├── base_agent.py    # Wrapper gọi Gemini API & vòng lặp Tool Execution
│   │   ├── crm_agent.py     # Logic nghiệp vụ Zen CRM
│   │   └── router.py        # Phân loại ý định (Intent Routing: Hỏi đáp vs Thao tác)
│   │
│   ├── tools/               # Tool Functions (Function Calling)
│   │   ├── __init__.py      # ALL_CRM_TOOLS gom toàn bộ tools
│   │   ├── query_tools.py   # Tra cứu (Doanh thu, Tồn kho, Lead, Đơn hàng)
│   │   ├── lead_tools.py    # Tạo Lead, chống trùng BR-02
│   │   └── order_tools.py   # Tạo cơ hội, trừ kho có DB Transaction Lock
│   │
│   ├── database/            # Quản trị kết nối CSDL
│   │   ├── __init__.py
│   │   ├── connection.py    # PostgreSQL Connection Pool (psycopg2)
│   │   └── models.py        # Schema models định nghĩa các bảng
│   │
│   ├── memory/              # Quản lý lịch sử hội thoại (Session & Chat History)
│   │   ├── __init__.py
│   │   └── redis_memory.py  # Lưu ngữ cảnh chat đa người dùng (RAM/Redis fallback)
│   │
│   ├── schemas/             # Pydantic Schemas dùng chung toàn hệ thống
│   │   ├── __init__.py
│   │   ├── chat.py          # Request/Response cho API Chat
│   │   ├── lead.py          # Schema dữ liệu Lead
│   │   └── order.py         # Schema dữ liệu Đơn hàng
│   │
│   ├── llm/                 # Khởi tạo LLM Client
│   │   ├── __init__.py
│   │   └── client.py        # Singleton Google GenAI Client
│   │
│   ├── api/                 # Endpoints FastAPI
│   │   ├── __init__.py
│   │   ├── dependencies.py  # DB health injection
│   │   └── routes.py        # /api/v1/chat, /api/v1/health...
│   │
│   └── utils/               # Utility functions
│       ├── __init__.py
│       ├── logger.py        # Structured Logging
│       └── normalizer.py    # Xử lý tiếng Việt có dấu/không dấu, SĐT, tiền tệ
│
├── storage/                 # Chứa temporary files, logs local (GitIgnore)
│   └── logs/
│
├── tests/                   # Test suite tự động
│   ├── conftest.py          # Pytest fixtures
│   ├── run_tests.py         # Test runner độc lập
│   ├── test_queries.py      # Kiểm tra 7 công cụ tra cứu & format tiếng Việt
│   └── test_agent_actions.py# Kiểm tra intent classification & lead mutation
│
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml       # Dùng để dựng nhanh App + Postgres + Redis local
├── main.py                  # Entry point FastAPI
├── requirements.txt
└── start.sh                 # Script chạy uvicorn tại cổng 8000
```

---

## 🚀 Hướng dẫn khởi chạy

### Cách 1: Khởi chạy trực tiếp bằng bash script
```bash
cd ai-agent-service
./start.sh
```

### Cách 2: Khởi chạy bằng Docker Compose
```bash
docker compose up -d --build
```

---

---

## 🔒 Kiến Trúc Bảo Mật & Phân Quyền AI Agent (AI RBAC & RLS Architecture)

Zen AI Assistant áp dụng mô hình **Bảo mật đa tầng (Defense-in-Depth)** và **Phân tách Đọc - Ghi (CQRS)** nhằm đảm bảo an toàn tuyệt đối cho dữ liệu doanh nghiệp và triệt tiêu nguy cơ tấn công Prompt Injection / Jailbreak:

### 1. Ma trận Phân quyền Công cụ (Tool Allocation Matrix theo Role):

| Tên Công Cụ (Tool Name) | Phân Loại | ADMIN | SALE_MANAGER | SALESMAN | Mục Đích Nghiệp Vụ |
|:---|:---:|:---:|:---:|:---:|:---|
| `get_admin_system_overview` | Query | ✅ | ❌ | ❌ | Giám sát trạng thái server & số tài khoản |
| `get_leads_summary` | Query | ❌ | ✅ | ✅ (RLS) | Xem khách hàng (Salesman chỉ thấy khách của mình) |
| `get_products_and_inventory`| Query | ❌ | ✅ | ✅ (RLS) | Xem kho (Salesman chỉ thấy SP được phân quyền) |
| `get_opportunities_overview`| Query | ❌ | ✅ | ✅ (RLS) | Quản lý phễu cơ hội (Salesman chỉ thấy cơ hội của mình) |
| `get_orders_summary` | Query | ❌ | ✅ | ✅ (RLS) | Tra cứu đơn hàng gần nhất |
| `search_customer` | Query | ❌ | ✅ | ✅ (RLS) | Tìm kiếm chi tiết khách hàng |
| `create_lead` | Action | ❌ | ✅ | ✅ | Tự động thêm Lead mới (chống trùng SĐT/Email BR-02) |
| `create_opportunity` | Action | ❌ | ✅ | ✅ | Tạo cơ hội mới, khớp mã SP và tính doanh thu |
| `log_follow_up` | Action | ❌ | ✅ | ✅ | Ghi nhật ký chăm sóc, đổi Pipeline NEW ➡️ CONTACTED |
| `get_revenue_and_forecast` | Query | ❌ | ✅ | ❌ | **BÁO CÁO DOANH THU & CHỈ TIÊU (CHẶN SALESMAN)** |
| `get_campaigns_overview` | Query | ❌ | ✅ | ❌ | **BÁO CÁO NGÂN SÁCH MARKETING (CHẶN SALESMAN)** |

---

### 2. Bốn Lớp Khóa Bảo Mật:

1. **Lớp 1 - Xác thực Ngữ cảnh Người dùng (JWT Context):**
   - Frontend gửi Token JWT trong header `Authorization: Bearer <token>`.
   - FastAPI đọc và lưu vào `ContextVar` (`get_current_user_context()`), đảm bảo mọi Tool đều nhận diện đúng ID và Role của người đang chat.
2. **Lớp 2 - Phân chia Đồ thị LangGraph (Graph & Tool Allocation Isolation):**
   - Hệ thống khởi tạo 3 StateGraph độc lập cho 3 vai trò (`ADMIN`, `SALE_MANAGER`, `SALESMAN`).
   - Đồ thị của Salesman **hoàn toàn không được nạp** các tool doanh thu hay ngân sách. Mô hình Gemini của Salesman thậm chí **không hề biết sự tồn tại** của các tool cấp Quản lý.
3. **Lớp 3 - Kiểm soát Cấp Hàm & Bảo mật Dòng Dữ liệu (Tool-level RBAC & RLS):**
   - Các hàm tra cứu nhạy cảm tự động kiểm tra `if user["role"] == "SALESMAN": return {"error": "Từ chối truy cập"}`.
   - Các hàm tra cứu khách hàng/cơ hội tự động ép tham số `assigned_to = user_id` hoặc `created_by = user_id`.
   - Các hàm thao tác sản phẩm tự động lọc theo bảng phân quyền `salesman_products`.
4. **Lớp 4 - Cách ly Bộ nhớ Hội thoại (Session & Chat History Isolation):**
   - Lịch sử chat được lưu trữ với khóa `role_userId_sessionId`, Salesman không thể đọc trộm lịch sử hội thoại của đồng nghiệp hay của Quản lý.

---

### 3. Phân tách Kiến trúc CQRS (Command Query Responsibility Segregation):
- **Nhóm Tra Cứu (Query Tools):** Truy vấn SQL có kẹp điều kiện RLS để đạt **tốc độ phản hồi cực nhanh (< 2ms)** và **tối ưu lượng Token**, tránh làm tràn Context Window của LLM.
- **Nhóm Tác Vụ Ghi (Action Tools):** Gọi sang **REST API Express Backend** kèm Bearer Token để Backend kiểm soát tập trung toàn bộ luật nghiệp vụ (chống trùng SĐT BR-02, phân quyền sản phẩm 403 Forbidden, giao dịch ACID khóa dòng trừ kho).

---

## 🧪 Chạy kiểm thử tự động (Test Suite)
```bash
venv/bin/python tests/run_tests.py
```
hoặc nếu đã cài `pytest`:
```bash
venv/bin/pytest tests/
```

