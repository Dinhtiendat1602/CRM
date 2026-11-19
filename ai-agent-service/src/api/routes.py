"""API Endpoints cho Zen CRM AI Agent Service với cơ chế xác thực JWT và phân quyền vai trò (RBAC)."""
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Header
from src.schemas import ChatRequest, ChatResponse, ResetRequest, QuickPromptsResponse
from src.agents import crm_agent
from src.database.connection import check_db_health
from config.settings import settings
from src.api.auth import get_current_user
from src.tools import get_tools_for_role

router = APIRouter()

@router.get("/")
@router.get("/api/health")
@router.get("/api/v1/health")
def healthcheck():
    db_ok = check_db_health()
    return {
        "status": "online" if db_ok else "degraded",
        "service": "Zen CRM AI Agent Service (Enterprise)",
        "framework": "LangGraph (StateGraph)",
        "database_connected": db_ok,
        "model": settings.GEMINI_MODEL,
        "roles_supported": ["ADMIN", "SALE_MANAGER", "SALESMAN"],
        "tools_loaded": {
            "ADMIN": len(get_tools_for_role("ADMIN")),
            "SALE_MANAGER": len(get_tools_for_role("SALE_MANAGER")),
            "SALESMAN": len(get_tools_for_role("SALESMAN"))
        }
    }

@router.get("/api/agent/graph")
@router.get("/api/v1/agent/graph")
def get_agent_graph(role: str = "SALE_MANAGER"):
    clean_role = (role or "SALE_MANAGER").upper()
    graph = crm_agent.role_graphs.get(clean_role, crm_agent.graph)
    tools = get_tools_for_role(clean_role)
    return {
        "role": clean_role,
        "framework": "LangGraph",
        "nodes": list(graph.nodes.keys()),
        "tools": [t.name for t in tools],
        "mermaid": graph.get_graph().draw_mermaid()
    }

@router.post("/api/chat", response_model=ChatResponse)
@router.post("/api/v1/chat", response_model=ChatResponse)
def handle_chat(payload: ChatRequest, user: dict = Depends(get_current_user)):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Nội dung tin nhắn không được để trống.")
    
    session_id = payload.session_id or "default"
    chat_result = crm_agent.chat(
        user_message=payload.message.strip(),
        session_id=session_id,
        user=user,
        return_actions=True
    )

    if isinstance(chat_result, tuple):
        reply, actions = chat_result
    else:
        reply, actions = chat_result, None

    return ChatResponse(
        reply=reply,
        session_id=session_id,
        actions=actions
    )

@router.get("/api/chat/history")
@router.get("/api/v1/chat/history")
def get_chat_history(session_id: str = "default", user: dict = Depends(get_current_user)):
    from src.memory.redis_memory import memory
    user_role = user.get("role", "SALE_MANAGER")
    user_id = user.get("id")
    sess_role = memory.get_session_role(session_id)
    sess_uid = memory.get_session_user_id(session_id)

    # Chặn truy cập nếu phiên thuộc vai trò khác
    if sess_role and sess_role != user_role:
        return {
            "session_id": session_id,
            "role": user_role,
            "total_messages": 0,
            "messages": []
        }

    # Đối với Salesman: chặn xem phiên của salesman khác
    if user_role == "SALESMAN" and sess_uid is not None and user_id is not None:
        if int(sess_uid) != int(user_id):
            return {
                "session_id": session_id,
                "role": user_role,
                "total_messages": 0,
                "messages": []
            }

    history = memory.get_history(session_id)
    return {
        "session_id": session_id,
        "role": user_role,
        "total_messages": len(history),
        "messages": history
    }

@router.get("/api/chat/sessions")
@router.get("/api/v1/chat/sessions")
def get_chat_sessions(user: dict = Depends(get_current_user)):
    from src.memory.redis_memory import memory
    user_role = user.get("role", "SALE_MANAGER")
    user_id = user.get("id")
    sessions = memory.list_saved_sessions(role=user_role, user_id=user_id)
    return {
        "user": user.get("username"),
        "role": user_role,
        "sessions": sessions
    }

@router.delete("/api/chat/session")
@router.delete("/api/v1/chat/session")
def delete_chat_session(session_id: str, user: dict = Depends(get_current_user)):
    from src.memory.redis_memory import memory
    user_role = user.get("role", "SALE_MANAGER")
    user_id = user.get("id")
    sess_role = memory.get_session_role(session_id)
    sess_uid = memory.get_session_user_id(session_id)

    # Chặn xóa nếu phiên thuộc vai trò khác
    if sess_role and sess_role != user_role:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa phiên hội thoại của vai trò khác.")
    if user_role == "SALESMAN" and sess_uid is not None and user_id is not None:
        if int(sess_uid) != int(user_id):
            raise HTTPException(status_code=403, detail="Bạn không có quyền xóa phiên hội thoại của nhân viên khác.")

    deleted = memory.clear_session(session_id)
    crm_agent.reset_session(session_id)
    return {"session_id": session_id, "deleted": deleted}

@router.post("/api/chat/reset")
@router.post("/api/v1/chat/reset")
def reset_chat_session(payload: ResetRequest, user: dict = Depends(get_current_user)):
    session_id = payload.session_id or "default"
    success = crm_agent.reset_session(session_id)
    return {
        "message": "Đã làm mới phiên trò chuyện thành công.",
        "session_id": session_id,
        "role": user.get("role"),
        "cleared": success
    }

@router.get("/api/quick-prompts", response_model=QuickPromptsResponse)
@router.get("/api/v1/quick-prompts", response_model=QuickPromptsResponse)
def get_quick_prompts(user: dict = Depends(get_current_user)):
    role = user.get("role", "SALE_MANAGER")
    if role == "ADMIN":
        prompts = [
            "🖥️ Kiểm tra trạng thái hệ thống và kết nối CSDL PostgreSQL?",
            "👥 Thống kê số lượng người dùng theo từng vai trò?",
            "🔐 Báo cáo tổng số tài khoản đang hoạt động và bị khóa?"
        ]
    elif role == "SALESMAN":
        prompts = [
            "👥 Hôm nay tôi có bao nhiêu khách hàng tiềm năng mới?",
            "📦 Kiểm tra danh mục sản phẩm tôi được phân quyền bán?",
            "🎯 Tổng quan các cơ hội bán hàng tôi đang phụ trách?",
            "🛒 Danh sách đơn hàng gần nhất của khách hàng do tôi phụ trách?",
            "➕ Thêm khách hàng mới Nguyễn Văn Nam SĐT 0987112233"
        ]
    else:
        # SALE_MANAGER
        prompts = [
            "👥 Hôm nay hệ thống có bao nhiêu Lead mới?",
            "📊 Doanh thu và tiến độ chỉ tiêu tháng này?",
            "📦 Kiểm tra sản phẩm nào đang sắp hết hàng?",
            "🛒 Khách hàng Nguyễn Văn An đã mua những gì?",
            "🎯 Tổng quan các cơ hội bán hàng lớn nhất?",
            "📢 Hiệu quả các chiến dịch tiếp thị gần đây?",
            "➕ Thêm khách hàng mới Nguyễn Văn Nam SĐT 0987112233"
        ]

    return QuickPromptsResponse(prompts=prompts)
