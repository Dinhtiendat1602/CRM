"""Base Agent đóng gói kết nối và vòng lặp đồ thị LangGraph (StateGraph & ReAct)."""
from typing import List, Any, Optional
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from config.settings import settings
from config.prompts import SYSTEM_INSTRUCTION
from src.memory.redis_memory import memory
from src.llm.client import get_chat_model

class BaseAgent:
    def __init__(self, tools: Optional[List[Any]] = None, system_instruction: str = SYSTEM_INSTRUCTION):
        self.model_name = settings.GEMINI_MODEL
        self.tools = tools or []
        self.system_instruction = system_instruction
        self.checkpointer = MemorySaver()

        # Khởi tạo Chat Model Google Generative AI (Gemini) với Thought Signature Guard
        self.llm = get_chat_model(temperature=0.2)

        # Biên dịch đồ thị LangGraph (CompiledStateGraph)
        self.graph = create_react_agent(
            model=self.llm,
            tools=self.tools,
            checkpointer=self.checkpointer,
            prompt=self.system_instruction,
            name="ZenCRMAgent"
        )

    def _hydrate_session_if_needed(self, session_id: str):
        """Đồng bộ lịch sử từ bộ nhớ bền vững (Redis/File) vào Checkpointer nếu phiên chưa nạp."""
        config = {"configurable": {"thread_id": session_id}}
        state = self.graph.get_state(config)
        if not state.values or not state.values.get("messages"):
            saved_history = memory.get_history(session_id)
            if saved_history:
                messages_to_hydrate: List[BaseMessage] = []
                for item in saved_history:
                    role = item.get("role")
                    content = item.get("content", "")
                    if role == "user":
                        messages_to_hydrate.append(HumanMessage(content=content))
                    elif role == "assistant":
                        messages_to_hydrate.append(AIMessage(content=content))
                if messages_to_hydrate:
                    self.graph.update_state(config, {"messages": messages_to_hydrate})

    def execute_chat(self, user_message: str, session_id: str = "default") -> str:
        """Thực thi một lượt hội thoại qua đồ thị LangGraph."""
        try:
            self._hydrate_session_if_needed(session_id)
            config = {"configurable": {"thread_id": session_id}}
            result = self.graph.invoke(
                {"messages": [HumanMessage(content=user_message)]},
                config=config
            )

            messages = result.get("messages", [])
            if not messages:
                return "Tôi đã ghi nhận thông tin nhưng không có nội dung phản hồi văn bản."

            last_msg = messages[-1]
            if isinstance(last_msg.content, str):
                reply = last_msg.content
            elif isinstance(last_msg.content, list):
                reply = "".join(
                    part.get("text", "") if isinstance(part, dict) else str(part)
                    for part in last_msg.content
                )
            else:
                reply = str(last_msg.content)

            return reply or "Tôi đã ghi nhận thông tin nhưng không có nội dung phản hồi văn bản."
        except Exception as e:
            err_str = str(e)
            print(f"[LangGraph BaseAgent Error] Session {session_id}: {err_str}")
            if "ResourceExhausted" in err_str or "429" in err_str:
                return "⚠️ Hệ thống AI hiện đang vượt hạn mức lưu lượng trong giây lát. Vui lòng thử lại sau 30 giây."
            return f"⚠️ Đã có lỗi xảy ra khi xử lý phản hồi từ AI Assistant: {err_str}"

    def reset_session(self, session_id: str = "default") -> bool:
        """Làm mới phiên hội thoại trong LangGraph Checkpointer và kho lưu trữ."""
        if self.checkpointer and hasattr(self.checkpointer, "delete_thread"):
            try:
                self.checkpointer.delete_thread(session_id)
            except Exception:
                pass
        return memory.clear_session(session_id)
