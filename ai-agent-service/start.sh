#!/usr/bin/env bash
# Script khởi chạy Zen CRM Enterprise AI Agent Microservice
set -e
cd "$(dirname "$0")"

# Khởi tạo virtualenv nếu chưa có
if [ ! -d "venv" ]; then
    echo "⚠️ Đang tạo môi trường ảo Python venv mới..."
    python3 -m venv venv
    venv/bin/pip install --upgrade pip
    venv/bin/pip install -r requirements.txt
fi

# Chạy Alembic migrations nếu có
if [ -d "alembic/versions" ] && [ "$(ls -A alembic/versions/*.py 2>/dev/null)" ]; then
    echo "🔄 Đang kiểm tra và cập nhật CSDL qua Alembic..."
    venv/bin/alembic upgrade head || true
fi

echo "🚀 Đang khởi động Zen CRM AI Agent Service tại http://localhost:8000..."
exec venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload

