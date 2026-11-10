from typing import Optional, List
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    message: str = Field(..., description="Nội dung câu hỏi hoặc yêu cầu từ người dùng")
    session_id: Optional[str] = Field("default", description="Mã định danh phiên hội thoại")

class ChatResponse(BaseModel):
    reply: str = Field(..., description="Câu trả lời phản hồi từ Zen AI Assistant")
    session_id: str = Field(..., description="ID phiên hội thoại tương ứng")

class ResetRequest(BaseModel):
    session_id: Optional[str] = Field("default", description="ID phiên hội thoại muốn làm mới")

class QuickPromptsResponse(BaseModel):
    prompts: List[str] = Field(..., description="Danh sách các câu lệnh mẫu nhanh")

