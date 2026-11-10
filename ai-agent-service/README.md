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

## 🧪 Chạy kiểm thử tự động (Test Suite)
```bash
venv/bin/python tests/run_tests.py
```
hoặc nếu đã cài `pytest`:
```bash
venv/bin/pytest tests/
```

