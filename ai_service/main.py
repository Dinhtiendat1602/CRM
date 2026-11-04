from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import check_db_health
from gemini_engine import engine

app = FastAPI(
    title="Zen CRM AI Service",
    description="Microservice Trợ lý AI Gemini hỗ trợ phân tích và tra cứu dữ liệu Zen CRM Enterprise",
    version="1.0.0"
)

# Cấu hình CORS để Frontend React (Vite 8080/5173) gọi trực tiếp
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str = Field(..., description="Nội dung câu hỏi của người dùng")
    session_id: Optional[str] = Field("default", description="ID phiên hội thoại")

class ChatResponse(BaseModel):
    reply: str
    session_id: str

class ResetRequest(BaseModel):
    session_id: Optional[str] = "default"

@app.get("/")
@app.get("/api/health")
def healthcheck():
    db_ok = check_db_health()
    return {
        "status": "online" if db_ok else "degraded",
        "service": "Zen CRM AI Service (Python FastAPI)",
        "database_connected": db_ok,
        "model": engine.model
    }

@app.post("/api/chat", response_model=ChatResponse)
def handle_chat(payload: ChatRequest):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Nội dung tin nhắn không được để trống.")
    
    session_id = payload.session_id or "default"
    user_msg = payload.message.strip()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{now_str}] 💬 [User - Session '{session_id}']: {user_msg}")

    reply = engine.chat(
        user_message=user_msg,
        session_id=session_id
    )

    print(f"[{now_str}] 🤖 [Zen AI Reply ({len(reply)} ký tự)]")
    return ChatResponse(
        reply=reply,
        session_id=session_id
    )

@app.post("/api/chat/reset")
def reset_chat_session(payload: ResetRequest):
    session_id = payload.session_id or "default"
    success = engine.reset_session(session_id)
    return {
        "message": "Đã làm mới phiên trò chuyện thành công.",
        "session_id": session_id,
        "cleared": success
    }

@app.get("/api/quick-prompts")
def get_quick_prompts():
    return {
        "prompts": [
            "👥 Hôm nay hệ thống có bao nhiêu Lead mới?",
            "📊 Doanh thu và tiến độ chỉ tiêu tháng này?",
            "📦 Kiểm tra sản phẩm nào đang sắp hết hàng?",
            "🛒 Khách hàng Nguyễn Văn An đã mua những gì?",
            "🎯 Tổng quan các cơ hội bán hàng lớn nhất?",
            "📢 Hiệu quả các chiến dịch tiếp thị gần đây?"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
