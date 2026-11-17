"""Agent nghiệp vụ chuyên sâu Zen CRM Enterprise trên nền tảng LangGraph với bảo mật RBAC."""
from typing import Optional, Dict, Any
from src.agents.base_agent import BaseAgent
from src.tools import ALL_CRM_TOOLS
from src.agents.router import router
from src.memory.redis_memory import memory
from src.utils.logger import log_user_message, log_ai_reply
from src.utils.context import set_current_user, reset_current_user

class CRMAgent(BaseAgent):
    def __init__(self):
        super().__init__(tools=ALL_CRM_TOOLS)

    def chat(self, user_message: str, session_id: str = "default", user: Optional[Dict[str, Any]] = None) -> str:
        role = (user.get("role") if user else "SALE_MANAGER") or "SALE_MANAGER"
        clean_role = str(role).upper()

        token = set_current_user(user)
        try:
            log_user_message(session_id, f"[{clean_role}] {user_message}")
            # Lưu tin nhắn người dùng vào lịch sử hội thoại
            memory.save_message(session_id=session_id, role="user", content=user_message)
            
            # Nhận diện ý định sơ bộ (hỗ trợ phân loại và logging)
            intent = router.classify(user_message)
            
            # Thực thi hội thoại qua đồ thị LangGraph theo Role (hỗ trợ Function Calling & ReAct loops)
            reply = self.execute_chat(user_message, session_id=session_id, role=clean_role)
            
            # Lưu câu trả lời của AI vào lịch sử hội thoại
            memory.save_message(session_id=session_id, role="assistant", content=reply)
            log_ai_reply(session_id, len(reply))
            return reply
        finally:
            reset_current_user(token)

crm_agent = CRMAgent()
