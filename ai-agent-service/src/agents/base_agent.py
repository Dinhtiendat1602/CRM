"""Base Agent đóng gói kết nối và vòng lặp xử lý hội thoại của Google Gemini SDK."""
from typing import List, Any
from google.genai import types
from src.llm.client import get_gemini_client
from config.settings import settings
from config.prompts import SYSTEM_INSTRUCTION
from src.memory.redis_memory import memory

class BaseAgent:
    def __init__(self, tools: List[Any] = None, system_instruction: str = SYSTEM_INSTRUCTION):
        self.model = settings.GEMINI_MODEL
        self.tools = tools or []
        self.system_instruction = system_instruction

    def get_or_create_chat(self, session_id: str):
        existing_chat = memory.get_chat_session(session_id)
        if existing_chat is not None:
            return existing_chat

        client = get_gemini_client()
        config = types.GenerateContentConfig(
            tools=self.tools,
            system_instruction=self.system_instruction,
            temperature=0.2,
        )

        chat = client.chats.create(
            model=self.model,
            config=config
        )
        memory.set_chat_session(session_id, chat)
        return chat

    def execute_chat(self, user_message: str, session_id: str = "default") -> str:
        try:
            chat = self.get_or_create_chat(session_id)
            response = chat.send_message(user_message)
            return response.text or "Tôi đã ghi nhận thông tin nhưng không có nội dung phản hồi văn bản."
        except Exception as e:
            err_str = str(e)
            print(f"[BaseAgent Error] Session {session_id}: {err_str}")
            if "ResourceExhausted" in err_str or "429" in err_str:
                return "⚠️ Hệ thống AI hiện đang vượt hạn mức lưu lượng trong giây lát. Vui lòng thử lại sau 30 giây."
            return f"⚠️ Đã có lỗi xảy ra khi xử lý phản hồi từ AI Assistant: {err_str}"

