"""Agent nghiệp vụ chuyên sâu Zen CRM Enterprise."""
from src.agents.base_agent import BaseAgent
from src.tools import ALL_CRM_TOOLS
from src.agents.router import router
from src.memory.redis_memory import memory
from src.utils.logger import log_user_message, log_ai_reply

class CRMAgent(BaseAgent):
    def __init__(self):
        super().__init__(tools=ALL_CRM_TOOLS)

    def chat(self, user_message: str, session_id: str = "default") -> str:
        log_user_message(session_id, user_message)
        # Lưu tin nhắn người dùng vào lịch sử hội thoại
        memory.save_message(session_id=session_id, role="user", content=user_message)
        
        # Nhận diện ý định sơ bộ
        intent = router.classify(user_message)
        # Thực thi hội thoại qua Gemini với đầy đủ Function Calling
        reply = self.execute_chat(user_message, session_id=session_id)
        
        # Lưu câu trả lời của AI vào lịch sử hội thoại
        memory.save_message(session_id=session_id, role="assistant", content=reply)
        log_ai_reply(session_id, len(reply))
        return reply

    def reset_session(self, session_id: str = "default") -> bool:
        return memory.clear_session(session_id)

crm_agent = CRMAgent()

