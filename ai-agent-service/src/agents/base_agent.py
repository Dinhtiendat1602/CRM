"""Base Agent đóng gói kết nối và vòng lặp đồ thị LangGraph (StateGraph & ReAct) theo RBAC."""
import json
import ast
from typing import List, Any, Optional, Dict, Union, Tuple
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langgraph.prebuilt import create_react_agent
from langgraph.checkpoint.memory import MemorySaver
from config.settings import settings
from config.prompts import (
    SYSTEM_INSTRUCTION,
    get_system_prompt_for_role
)
from src.tools import (
    ALL_CRM_TOOLS,
    get_tools_for_role,
    ROLE_TOOLS_MAPPING
)
from src.memory.redis_memory import memory
from src.llm.client import get_chat_model

class BaseAgent:
    def __init__(self, tools: Optional[List[Any]] = None, system_instruction: str = SYSTEM_INSTRUCTION):
        self.model_name = settings.GEMINI_MODEL
        self.tools = tools or ALL_CRM_TOOLS
        self.system_instruction = system_instruction
        self.checkpointer = MemorySaver()

        # Khởi tạo Chat Model Google Generative AI (Gemini) với Thought Signature Guard
        self.llm = get_chat_model(temperature=0.2)

        # Biên dịch các đồ thị LangGraph ReAct cho từng vai trò (ADMIN, SALE_MANAGER, SALESMAN)
        self.role_graphs: Dict[str, Any] = {}
        for role_name in ["ADMIN", "SALE_MANAGER", "SALESMAN"]:
            r_tools = get_tools_for_role(role_name)
            r_prompt = get_system_prompt_for_role(role_name)
            self.role_graphs[role_name] = create_react_agent(
                model=self.llm,
                tools=r_tools,
                checkpointer=self.checkpointer,
                prompt=r_prompt,
                name=f"ZenCRM_{role_name}_Agent"
            )

        # Đồ thị mặc định (Manager - toàn quyền CRM) tương thích ngược
        self.graph = self.role_graphs["SALE_MANAGER"]

    def _hydrate_session_if_needed(self, session_id: str, graph=None):
        """Đồng bộ lịch sử từ bộ nhớ bền vững (Redis/File) vào Checkpointer nếu phiên chưa nạp."""
        target_graph = graph or self.graph
        config = {"configurable": {"thread_id": session_id}}
        state = target_graph.get_state(config)
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
                    target_graph.update_state(config, {"messages": messages_to_hydrate})

    def _extract_actions_from_messages(self, messages: List[Any]) -> List[Dict[str, Any]]:
        """Trích xuất danh sách các tác vụ nghiệp vụ (actions) đã thực thi trong lượt hiện tại."""
        actions: List[Dict[str, Any]] = []
        for msg in reversed(messages):
            # Dừng lại khi gặp tin nhắn user của lượt này
            if getattr(msg, "type", None) == "human":
                break

            content = getattr(msg, "content", None)
            data: Optional[Dict[str, Any]] = None

            if isinstance(content, dict):
                data = content
            elif isinstance(content, str) and content.strip():
                try:
                    data = json.loads(content)
                except Exception:
                    try:
                        data = ast.literal_eval(content)
                    except Exception:
                        data = None

            if isinstance(data, dict):
                status = data.get("status")
                if status == "created" and "lead" in data:
                    actions.append({
                        "type": "lead_created",
                        "status": "success",
                        "lead": data.get("lead"),
                        "message": data.get("message")
                    })
                elif status == "duplicate_rejected":
                    if "existing_opportunity_id" in data:
                        actions.append({
                            "type": "opportunity_duplicate_rejected",
                            "status": "rejected",
                            "existing_opportunity_id": data.get("existing_opportunity_id"),
                            "lead_name": data.get("lead_name"),
                            "product_name": data.get("product_name"),
                            "message": data.get("message")
                        })
                    else:
                        actions.append({
                            "type": "lead_duplicate_rejected",
                            "status": "rejected",
                            "existing_lead": data.get("existing_lead"),
                            "message": data.get("message")
                        })
                elif status == "created" and "opportunity" in data:
                    actions.append({
                        "type": "opportunity_created",
                        "status": "success",
                        "opportunity": data.get("opportunity"),
                        "message": data.get("message")
                    })

        # Đảo lại theo thứ tự thực thi
        actions.reverse()
        return actions

    def execute_chat(
        self,
        user_message: str,
        session_id: str = "default",
        role: str = "SALE_MANAGER",
        return_actions: bool = False
    ) -> Union[str, Tuple[str, List[Dict[str, Any]]]]:
        """Thực thi một lượt hội thoại qua đồ thị LangGraph theo vai trò được phân quyền."""
        try:
            clean_role = (role or "SALE_MANAGER").upper()
            target_graph = self.role_graphs.get(clean_role, self.graph)
            
            self._hydrate_session_if_needed(session_id, graph=target_graph)
            config = {"configurable": {"thread_id": session_id}}
            result = target_graph.invoke(
                {"messages": [HumanMessage(content=user_message)]},
                config=config
            )           

            messages = result.get("messages", [])
            actions = self._extract_actions_from_messages(messages) if return_actions else []

            if not messages:
                reply = "Tôi đã ghi nhận thông tin nhưng không có nội dung phản hồi văn bản."
                return (reply, actions) if return_actions else reply

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

            reply = reply or "Tôi đã ghi nhận thông tin nhưng không có nội dung phản hồi văn bản."
            return (reply, actions) if return_actions else reply
        except Exception as e:
            err_str = str(e)
            print(f"[LangGraph BaseAgent Error] Session {session_id} (Role: {role}): {err_str}")
            if "ResourceExhausted" in err_str or "429" in err_str:
                reply = "⚠️ Hệ thống AI hiện đang vượt hạn mức lưu lượng trong giây lát. Vui lòng thử lại sau 30 giây."
            else:
                reply = f"⚠️ Đã có lỗi xảy ra khi xử lý phản hồi từ AI Assistant: {err_str}"
            return (reply, []) if return_actions else reply

    def reset_session(self, session_id: str = "default") -> bool:
        """Làm mới phiên hội thoại trong LangGraph Checkpointer và kho lưu trữ."""
        if self.checkpointer and hasattr(self.checkpointer, "delete_thread"):
            try:
                self.checkpointer.delete_thread(session_id)
            except Exception:
                pass
        return memory.clear_session(session_id)
