"""Định nghĩa cấu trúc State cho LangGraph Zen CRM Agent."""
from typing import Annotated, Sequence, Optional
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class CRMState(TypedDict):
    """Trạng thái trung tâm được truyền qua các Node trong đồ thị LangGraph."""
    messages: Annotated[Sequence[BaseMessage], add_messages]
    session_id: Optional[str]
    intent: Optional[str]

