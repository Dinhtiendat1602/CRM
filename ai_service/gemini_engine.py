from pathlib import Path
import os
import warnings
from google import genai
from google.genai import types
from dotenv import load_dotenv
from crm_tools import ALL_CRM_TOOLS

# Bỏ qua các cảnh báo không quan trọng về phiên bản môi trường
warnings.filterwarnings("ignore")

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Sử dụng gemini-flash-lite-latest (Gemini 3.5 Flash Lite) có tốc độ phản hồi cực nhanh và hỗ trợ Function Calling hoàn hảo
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")

SYSTEM_INSTRUCTION = """
Bạn là "Zen AI Assistant" — Trợ lý Trí tuệ Nhân tạo thông minh, chuyên nghiệp và tận tâm của hệ thống quản trị quan hệ khách hàng Zen CRM Enterprise.

Ngữ cảnh thời gian:
- Năm hiện tại của hệ thống là 2026. Khi gọi các hàm thống kê (như doanh thu, báo cáo), nếu người dùng nói "tháng này", "năm nay", "hôm nay", hãy để tham số year=None, month=None để hàm tự lấy thời gian thực hiện tại.

Nhiệm vụ cốt lõi của bạn:
1. Hỗ trợ người dùng (nhân viên kinh doanh, quản lý bán hàng, ban giám đốc) tra cứu dữ liệu thời gian thực:
   - Khách hàng tiềm năng (Leads)
   - Doanh thu thực tế, đơn hàng và tiến độ thực hiện chỉ tiêu kế hoạch (Sales Forecast)
   - Danh mục sản phẩm, đơn giá và số lượng tồn kho (Inventory)
   - Cơ hội bán hàng (Opportunities) theo từng giai đoạn (Pipeline)
   - Chiến dịch tiếp thị (Campaigns) và hiệu quả thu thập Lead
2. Khi người dùng hỏi thông tin liên quan đến dữ liệu trong hệ thống CRM, hãy CHỦ ĐỘNG và TỰ ĐỘNG gọi các công cụ (Function Calling) thích hợp để lấy dữ liệu chính xác từ PostgreSQL trước khi trả lời.
3. Nguyên tắc trình bày:
   - Ngôn ngữ: Tiếng Việt chuẩn mực, lịch sự, chuyên nghiệp, thân thiện.
   - Định dạng: Sử dụng Markdown sinh động (in đậm, bảng biểu nếu nhiều dữ liệu, gạch đầu dòng rõ ràng).
   - Định dạng tiền tệ: Luôn viết số tiền rõ ràng kèm phân cách dấu chấm (VD: 150.000.000 ₫ hoặc 150.000.000 VNĐ).
   - Đưa ra nhận xét hoặc khuyến nghị kinh doanh ngắn gọn hữu ích (ví dụ: cảnh báo sản phẩm sắp hết hàng, khen ngợi chỉ tiêu đạt cao, nhắc nhở cơ hội lớn cần chốt).
4. Tư vấn nghiệp vụ:
   - Nếu người dùng hỏi về kỹ năng bán hàng, cách chăm sóc khách hàng, cách xử lý từ chối hoặc quy trình CRM, hãy chia sẻ kiến thức bán hàng chuẩn quốc tế một cách thực tế và truyền cảm hứng.
"""

class GeminiEngine:
    def __init__(self):
        if not GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY không được tìm thấy trong file .env hoặc biến môi trường!")
        self.client = genai.Client(api_key=GEMINI_API_KEY)
        self.model = GEMINI_MODEL
        self.sessions = {}

    def _get_or_create_chat(self, session_id: str):
        if session_id not in self.sessions:
            config = types.GenerateContentConfig(
                tools=ALL_CRM_TOOLS,
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.3,
            )
            chat = self.client.chats.create(
                model=self.model,
                config=config,
            )
            self.sessions[session_id] = chat
        return self.sessions[session_id]

    def chat(self, user_message: str, session_id: str = "default") -> str:
        try:
            chat_instance = self._get_or_create_chat(session_id)
            response = chat_instance.send_message(user_message)

            # Trích xuất text phản hồi an toàn
            reply_text = ""
            if hasattr(response, "text") and response.text:
                reply_text = response.text
            elif hasattr(response, "candidates") and response.candidates:
                for candidate in response.candidates:
                    if hasattr(candidate, "content") and hasattr(candidate.content, "parts"):
                        for part in candidate.content.parts:
                            if hasattr(part, "text") and part.text:
                                reply_text += part.text

            if not reply_text.strip():
                reply_text = "Dạ, tôi đã nhận thông tin nhưng chưa có câu trả lời phù hợp. Bạn có thể hỏi cụ thể hơn được không?"

            return reply_text.strip()
        except Exception as e:
            error_str = str(e)
            print(f"[GeminiEngine Error] {error_str}")
            return f"⚠️ Rất tiếc, đã có lỗi xảy ra khi xử lý yêu cầu: {error_str}"

    def reset_session(self, session_id: str = "default") -> bool:
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False

# Singleton instance
engine = GeminiEngine()
