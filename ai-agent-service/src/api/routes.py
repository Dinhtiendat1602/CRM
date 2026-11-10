from fastapi import APIRouter, HTTPException, Depends
from src.schemas import ChatRequest, ChatResponse, ResetRequest, QuickPromptsResponse
from src.agents import crm_agent
from src.database.connection import check_db_health
from config.settings import settings

router = APIRouter()

@router.get("/")
@router.get("/api/health")
@router.get("/api/v1/health")
def healthcheck():
    db_ok = check_db_health()
    return {
        "status": "online" if db_ok else "degraded",
        "service": "Zen CRM AI Agent Service (Enterprise)",
        "database_connected": db_ok,
        "model": settings.GEMINI_MODEL,
        "tools_loaded": len(crm_agent.tools)
    }

@router.post("/api/chat", response_model=ChatResponse)
@router.post("/api/v1/chat", response_model=ChatResponse)
def handle_chat(payload: ChatRequest):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Nội dung tin nhắn không được để trống.")
    
    session_id = payload.session_id or "default"
    reply = crm_agent.chat(
        user_message=payload.message.strip(),
        session_id=session_id
    )

    return ChatResponse(
        reply=reply,
        session_id=session_id
    )

@router.get("/api/chat/history")
@router.get("/api/v1/chat/history")
def get_chat_history(session_id: str = "default"):
    from src.memory.redis_memory import memory
    history = memory.get_history(session_id)
    return {
        "session_id": session_id,
        "total_messages": len(history),
        "messages": history
    }

@router.get("/api/chat/sessions")
@router.get("/api/v1/chat/sessions")
def get_chat_sessions():
    from src.memory.redis_memory import memory
    return {
        "sessions": memory.list_saved_sessions()
    }

@router.delete("/api/chat/session")
@router.delete("/api/v1/chat/session")
def delete_chat_session(session_id: str):
    from src.memory.redis_memory import memory
    deleted = memory.clear_session(session_id)
    return {"session_id": session_id, "deleted": deleted}

@router.post("/api/chat/reset")
@router.post("/api/v1/chat/reset")
def reset_chat_session(payload: ResetRequest):
    session_id = payload.session_id or "default"
    success = crm_agent.reset_session(session_id)
    return {
        "message": "Đã làm mới phiên trò chuyện thành công.",
        "session_id": session_id,
        "cleared": success
    }

@router.get("/api/quick-prompts", response_model=QuickPromptsResponse)
@router.get("/api/v1/quick-prompts", response_model=QuickPromptsResponse)
def get_quick_prompts():
    return QuickPromptsResponse(
        prompts=[
            "👥 Hôm nay hệ thống có bao nhiêu Lead mới?",
            "📊 Doanh thu và tiến độ chỉ tiêu tháng này?",
            "📦 Kiểm tra sản phẩm nào đang sắp hết hàng?",
            "🛒 Khách hàng Nguyễn Văn An đã mua những gì?",
            "🎯 Tổng quan các cơ hội bán hàng lớn nhất?",
            "📢 Hiệu quả các chiến dịch tiếp thị gần đây?",
            "➕ Thêm khách hàng mới Nguyễn Văn Nam SĐT 0987112233"
        ]
    )

