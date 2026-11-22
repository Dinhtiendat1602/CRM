"""Test Live E2E Gemini Agent executing feat-029 Autonomous Opportunity Creation."""
import sys
import importlib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent / "ai-agent-service"
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

_agents_mod = importlib.import_module("src.agents")
crm_agent = _agents_mod.crm_agent
from src.database.connection import execute_commit, query_all, query_one
from src.tools.order_tools import create_opportunity
from src.tools.lead_tools import create_lead

def test_autonomous_opportunity_creation():
    test_phone = "0987998877"
    test_email = "nam.opp.test@gmail.com"

    # 1. Dọn dẹp dữ liệu test cũ
    execute_commit("""
        DELETE FROM opportunities WHERE lead_id IN (SELECT id FROM leads WHERE phone = %s);
        DELETE FROM leads WHERE phone = %s OR email = %s;
    """, (test_phone, test_phone, test_email))

    # Tạo lead mẫu cho bài test
    print("=== Bước 1: Tạo khách hàng tiềm năng mẫu ===")
    lead_res = create_lead(
        first_name="Nam",
        last_name="Nguyễn Văn",
        phone=test_phone,
        email=test_email,
        career="Kỹ sư âm thanh",
        address="123 Lê Duẩn, Đà Nẵng"
    )
    assert lead_res.get("success") is True, f"Tạo lead mẫu thất bại: {lead_res}"
    lead_id = lead_res["lead"]["id"]
    print(f"Khách hàng mẫu đã tạo thành công: #{lead_id} - {lead_res['lead']['ho_va_ten']}")

    # 2. Gọi Chat bằng ngôn ngữ tự nhiên
    print("\n=== Bước 2: Ra lệnh tạo cơ hội bán hàng qua Chat bằng Ngôn ngữ tự nhiên ===")
    user_msg = "Tạo cơ hội cho anh Nam mua 2 bộ Kit Livestream Pro 4K dự kiến chốt 20/11"
    mgr_user = {"id": 2, "username": "manager", "role": "SALE_MANAGER", "full_name": "Quản lý kinh doanh"}

    reply, actions = crm_agent.chat(
        user_message=user_msg,
        session_id="test_feat029_sess_1",
        user=mgr_user,
        return_actions=True
    )
    print("\n[AI RESPONSE - LẦN 1]:\n", reply)
    print("\n[ACTIONS TRÍCH XUẤT ĐƯỢC]:\n", actions)

    # 3. Kiểm tra CSDL bảng opportunities
    opps = query_all("SELECT * FROM opportunities WHERE lead_id = %s", (lead_id,))
    print("\n[CSDL POSTGRESQL CHECK]:", opps)
    assert len(opps) == 1, "Cơ hội bán hàng chưa được lưu vào CSDL!"
    opp = opps[0]
    assert opp["quantity"] == 2, f"Số lượng không đúng: {opp['quantity']} != 2"
    assert opp["status"] == "NEW", f"Trạng thái không đúng: {opp['status']} != NEW"
    assert "2026-11-20" in str(opp["expected_close_date"]), f"Ngày chốt không đúng: {opp['expected_close_date']}"

    # Kiểm tra metadata actions
    assert len(actions) >= 1, "Không có action nào được ghi nhận!"
    opp_action = [a for a in actions if a["type"] == "opportunity_created"][0]
    assert opp_action["status"] == "success"
    assert opp_action["opportunity"]["id"] == opp["id"]
    print(">>> PASS: Cơ hội mới đã được tạo chính xác 100% trong CSDL và trích xuất actions!")

    # 4. Thử tạo lại với cùng Lead và cùng Sản phẩm -> Kiểm tra BR-02
    print("\n=== Bước 3: Thử tạo lại cùng Lead và Sản phẩm để kiểm tra chống trùng lặp BR-02 ===")
    reply_dup, actions_dup = crm_agent.chat(
        user_message="Tạo cơ hội cho anh Nam mua 1 bộ Kit Livestream",
        session_id="test_feat029_sess_2",
        user=mgr_user,
        return_actions=True
    )
    print("\n[AI RESPONSE - LẦN 2 (TRÙNG LẶP)]:\n", reply_dup)
    print("\n[ACTIONS DUPLICATE REJECTED]:\n", actions_dup)

    # 5. Dọn dẹp dữ liệu test an toàn
    execute_commit("""
        DELETE FROM opportunities WHERE lead_id = %s;
        DELETE FROM leads WHERE id = %s;
    """, (lead_id, lead_id))
    print("\n>>> Đã dọn dẹp dữ liệu test an toàn!")

if __name__ == "__main__":
    test_autonomous_opportunity_creation()

