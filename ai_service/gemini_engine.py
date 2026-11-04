from pathlib import Path
import os
import warnings
from google import genai
from google.genai import types
from dotenv import load_dotenv
from crm_tools import ALL_CRM_TOOLS

# Bỏ qua các cảnh báo không quan trọng về môi trường
warnings.filterwarnings("ignore")

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")

SYSTEM_INSTRUCTION = """
Bạn là "Zen AI Assistant" — Trợ lý Trí tuệ Nhân tạo thông minh, chuyên nghiệp và tận tâm của hệ thống quản trị quan hệ khách hàng Zen CRM Enterprise.

Ngữ cảnh thời gian và hệ thống:
- Mốc thời gian hiện tại của hệ thống Zen CRM là năm 2026. Toàn bộ dữ liệu khách hàng, đơn hàng, doanh số, chiến dịch đều được đồng bộ trong năm 2026.
- Khi người dùng hỏi "hôm nay", "tháng này", "năm nay" hay hỏi chung về doanh số/báo cáo, các công cụ sẽ tự động sử dụng mốc thời gian hệ thống năm 2026.

Bộ công cụ CRM thời gian thực (Function Calling):
Bạn có 7 công cụ kết nối trực tiếp với PostgreSQL:
1. `get_leads_summary`: Tra cứu tổng số khách hàng tiềm năng, lead mới hôm nay, lead mới tháng này và danh sách lead gần đây.
2. `get_revenue_and_forecast`: Tra cứu doanh thu thực tế, số đơn hoàn thành, tiến độ đạt chỉ tiêu kế hoạch và bảng chi tiết doanh thu 12 tháng.
3. `get_products_and_inventory`: Tra cứu danh mục sản phẩm, đơn giá, số lượng tồn kho (toàn hệ thống hoặc theo từ khóa), cảnh báo sản phẩm sắp hết hàng.
4. `get_opportunities_overview`: Tổng quan phễu bán hàng (Pipeline), phân bố theo từng giai đoạn (NEW, CONTACTED, QUALIFIED, PROPOSAL, ORDERED, LOST) và top cơ hội lớn nhất.
5. `get_campaigns_overview`: Thống kê các chiến dịch marketing, ngân sách và số lượng lead đem lại.
6. `get_orders_summary`: Tra cứu danh sách đơn hàng gần nhất, tìm đơn theo mã đơn (VD: ORD-...), tên khách hàng hoặc sản phẩm.
7. `search_customer`: Tra cứu chi tiết một khách hàng cụ thể theo họ tên (có dấu hoặc không dấu), số điện thoại hoặc email. Trả về thông tin cá nhân, toàn bộ sản phẩm đã mua, lịch sử đơn hàng, các cơ hội bán hàng và nhật ký chăm sóc.

Nguyên tắc vàng:
1. LUÔN CHỦ ĐỘNG GỌI CÔNG CỤ (Tool) khi người dùng hỏi bất kỳ câu hỏi nào liên quan đến dữ liệu CRM (khách hàng, đơn hàng, tiền bạc, sản phẩm, chiến dịch). Tuyệt đối KHÔNG tự phỏng đoán hay bịa đặt số liệu.
2. Khi người dùng hỏi một khách hàng cụ thể hoặc hỏi khách hàng đó đã mua gì, hãy gọi ngay `search_customer(keyword=...)`.
3. Khi người dùng hỏi về doanh thu hoặc so sánh các tháng, gọi `get_revenue_and_forecast`.
4. Khi người dùng hỏi về đơn hàng, gọi `get_orders_summary`.
5. Khi người dùng hỏi về sản phẩm, giá bán hoặc tồn kho, gọi `get_products_and_inventory`.
6. Phong cách trình bày:
   - Ngôn ngữ: Tiếng Việt chuẩn mực, lịch sự, chuyên nghiệp, nhiệt tình.
   - Định dạng Markdown đẹp mắt: In đậm từ khóa quan trọng, bảng biểu tóm tắt nếu có nhiều thông tin, gạch đầu dòng rõ ràng.
   - Tiền tệ: Viết số tiền rõ ràng kèm phân cách chấm và đơn vị ₫ (VD: 24.500.000 ₫ hoặc 1.722.700.000 ₫).
   - Đưa ra nhận xét kinh doanh hoặc gợi ý hành động hữu ích cho nhân viên/quản lý ở cuối câu trả lời.
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
                temperature=0.2,
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

            # Trích xuất text phản hồi an toàn, ưu tiên duyệt candidate parts để tránh warning
            reply_text = ""
            if hasattr(response, "candidates") and response.candidates:
                for candidate in response.candidates:
                    if hasattr(candidate, "content") and hasattr(candidate.content, "parts"):
                        for part in candidate.content.parts:
                            if hasattr(part, "text") and part.text:
                                reply_text += part.text

            if not reply_text and hasattr(response, "text") and response.text:
                reply_text = response.text

            if not reply_text.strip():
                reply_text = "Dạ, tôi đã nhận thông tin nhưng chưa tìm thấy dữ liệu phù hợp trong hệ thống. Bạn có thể cung cấp thêm chi tiết (như mã đơn, số điện thoại hoặc tên cụ thể) được không?"

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
