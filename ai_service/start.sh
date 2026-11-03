#!/usr/bin/env bash
# Script khởi chạy Zen CRM AI Microservice
cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    echo "⚠️ Đang tạo môi trường ảo Python venv..."
    python3 -m venv venv
    venv/bin/pip install -r requirements.txt
fi

echo "🚀 Đang khởi động Zen CRM AI Service tại http://localhost:8000..."
exec venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload

