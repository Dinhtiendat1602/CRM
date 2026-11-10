"""Router phân loại ý định (Intent Classification) cho các yêu cầu từ người dùng."""
import re
from src.utils.normalizer import remove_vietnamese_accents

class IntentRouter:
    @staticmethod
    def classify(message: str) -> str:
        """
        Phân loại ý định của người dùng thành:
        - ACTION_LEAD: Yêu cầu thêm/tạo khách hàng mới
        - ACTION_ORDER: Yêu cầu tạo cơ hội, đặt hàng, chốt đơn
        - QUERY_REPORT: Hỏi về doanh số, báo cáo, tồn kho, chỉ tiêu
        - GENERAL_QUERY: Chào hỏi hoặc tra cứu thông thường
        """
        msg_raw = message.strip()
        msg_norm = remove_vietnamese_accents(msg_raw.lower())

        # Kiểm tra ý định tạo khách hàng tiềm năng mới
        lead_patterns = [
            r"\b(them|tao|nhap|luu)\s+(khach|lead|khach hang|khach tiem nang)\b",
            r"\b(them|tao)\s+moi\b",
            r"\bkhach hang moi\b",
        ]
        for pat in lead_patterns:
            if re.search(pat, msg_norm):
                return "ACTION_LEAD"

        # Kiểm tra ý định tạo cơ hội hoặc đặt hàng
        order_patterns = [
            r"\b(chot|tao|dat|them)\s+(don|don hang|hop dong)\b",
            r"\b(tao|mo|them)\s+(co hoi|deal|pipeline)\b",
            r"\bmua\s+(san pham|hang)\b",
        ]
        for pat in order_patterns:
            if re.search(pat, msg_norm):
                return "ACTION_ORDER"

        # Kiểm tra ý định báo cáo / tài chính / kho
        report_patterns = [
            r"\b(doanh thu|doanh so|chi tieu|ke hoach|forecast)\b",
            r"\b(ton kho|het hang|kho hang|san pham)\b",
            r"\b(bao cao|thong ke|pipeline)\b",
        ]
        for pat in report_patterns:
            if re.search(pat, msg_norm):
                return "QUERY_REPORT"

        return "GENERAL_QUERY"

router = IntentRouter()

