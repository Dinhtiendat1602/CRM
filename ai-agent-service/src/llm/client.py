"""Khởi tạo LLM Client và tích hợp cơ chế bảo toàn Thought Signature cho Gemini trên LangGraph."""
import warnings
from typing import Optional
from google import genai
import langchain_google_genai.chat_models as gm
from langchain_core.messages import AIMessage
from config.settings import settings

# Bỏ qua các cảnh báo không quan trọng về môi trường
warnings.filterwarnings("ignore")

_client: Optional[genai.Client] = None
_patched: bool = False

def patch_langchain_gemini_thought_signature():
    """
    Bảo toàn thought_signature giữa các vòng lặp Function Calling trong LangGraph.
    Đối với các mô hình Gemini có cơ chế suy luận (Thinking Models), API yêu cầu
    phải truyền lại thought_signature của Part khi gửi kết quả thực thi tool.
    Hàm này mở rộng parser của langchain-google-genai để tự động chuyển tiếp chữ ký này.
    """
    global _patched
    if _patched:
        return

    # 1. Ghi nhận thought_signature từ response_candidate vào tool_calls của AIMessage
    orig_parse = gm._parse_response_candidate
    def patched_parse(response_candidate, streaming=False):
        ai_msg = orig_parse(response_candidate, streaming=streaming)
        signatures = {}
        for part in response_candidate.content.parts:
            if part.function_call and hasattr(part, "thought_signature") and part.thought_signature:
                for tc in ai_msg.tool_calls:
                    if tc["name"] == part.function_call.name:
                        tc["thought_signature"] = part.thought_signature
                        signatures[tc["id"]] = part.thought_signature
        if signatures:
            ai_msg.additional_kwargs["thought_signatures"] = signatures
        return ai_msg

    gm._parse_response_candidate = patched_parse

    # 2. Khôi phục thought_signature vào Part khi gửi lại payload cho Gemini
    orig_parse_history = gm._parse_chat_history
    def patched_parse_history(input_messages, convert_system_message_to_human=False):
        sys_inst, messages = orig_parse_history(
            input_messages,
            convert_system_message_to_human=convert_system_message_to_human
        )
        for content in messages:
            if content.role == "model":
                for p in content.parts:
                    if p.function_call and not p.thought_signature:
                        for msg in input_messages:
                            if isinstance(msg, AIMessage) and msg.tool_calls:
                                for tc in msg.tool_calls:
                                    if tc["name"] == p.function_call.name:
                                        sig = (
                                            tc.get("thought_signature")
                                            or msg.additional_kwargs.get("thought_signatures", {}).get(tc.get("id"))
                                        )
                                        if sig:
                                            p.thought_signature = sig
        return sys_inst, messages

    gm._parse_chat_history = patched_parse_history
    _patched = True

def get_gemini_client() -> genai.Client:
    """Khởi tạo Google GenAI Client nguyên bản."""
    global _client
    if _client is None:
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY không được tìm thấy trong file .env hoặc cấu hình!")
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client

def get_chat_model(temperature: float = 0.2) -> gm.ChatGoogleGenerativeAI:
    """Khởi tạo LangChain ChatGoogleGenerativeAI với patch thought_signature đã kích hoạt."""
    patch_langchain_gemini_thought_signature()
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY không được tìm thấy trong file .env hoặc cấu hình!")
    return gm.ChatGoogleGenerativeAI(
        model=settings.GEMINI_MODEL,
        google_api_key=settings.GEMINI_API_KEY,
        temperature=temperature
    )
