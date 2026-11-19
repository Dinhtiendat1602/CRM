"""Agent nghiệp vụ chuyên sâu Zen CRM Enterprise trên nền tảng LangGraph với bảo mật RBAC."""
from typing import Optional, Dict, Any, Union, Tuple, List
from src.agents.base_agent import BaseAgent
from src.tools import ALL_CRM_TOOLS
from src.agents.router import router
from src.memory.redis_memory import memory
from src.utils.logger import log_user_message, log_ai_reply
from src.utils.context import (
    set_current_user,
    reset_current_user,
    set_current_token,
    reset_current_token,
)

class CRMAgent(BaseAgent):
    def __init__(self):
        super().__init__(tools=ALL_CRM_TOOLS)

    def chat(
        self,
        user_message: str,
        session_id: str = "default",
        user: Optional[Dict[str, Any]] = None,
        return_actions: bool = False
    ) -> Union[str, Tuple[str, List[Dict[str, Any]]]]:
        role = (user.get("role") if user else "SALE_MANAGER") or "SALE_MANAGER"
        clean_role = str(role).upper()
        raw_jwt = user.get("raw_token") if user else None

        cv_user_token = set_current_user(user)
        cv_jwt_token = set_current_token(raw_jwt)
        try:
            log_user_message(session_id, f"[{clean_role}] {user_message}")
            # Lưu tin nhắn người dùng vào lịch sử hội thoại
            memory.save_message(session_id=session_id, role="user", content=user_message)
            
            # Nhận diện ý định sơ bộ (hỗ trợ phân loại và logging)
            intent = router.classify(user_message)
            
            # Thực thi hội thoại qua đồ thị LangGraph theo Role (hỗ trợ Function Calling & ReAct loops)
            if return_actions:
                chat_res = self.execute_chat(
                    user_message,
                    session_id=session_id,
                    role=clean_role,
                    return_actions=True
                )
                if isinstance(chat_res, tuple):
                    reply, actions = chat_res
                else:
                    reply, actions = chat_res, []
                memory.save_message(session_id=session_id, role="assistant", content=reply)
                log_ai_reply(session_id, len(reply))
                return reply, actions
            else:
                chat_res = self.execute_chat(
                    user_message,
                    session_id=session_id,
                    role=clean_role,
                    return_actions=False
                )
                reply = chat_res if isinstance(chat_res, str) else chat_res[0]
                memory.save_message(session_id=session_id, role="assistant", content=reply)
                log_ai_reply(session_id, len(reply))
                return reply
        finally:
            reset_current_user(cv_user_token)
            reset_current_token(cv_jwt_token)

crm_agent = CRMAgent()
