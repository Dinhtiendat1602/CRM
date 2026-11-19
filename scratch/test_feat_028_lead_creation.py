"""Test Live E2E Gemini Agent executing feat-028 Autonomous Lead Creation."""
import sys
import json
import importlib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent / "ai-agent-service"
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

_agents_mod = importlib.import_module("src.agents")
crm_agent = _agents_mod.crm_agent
from src.database.connection import execute_commit, query_all

def test_autonomous_lead_creation():
    test_phone = "0987112233"
    test_email = "nam.nguyen@gmail.com"
    # Dọn dẹp trước nếu đã có
    execute_commit("DELETE FROM leads WHERE phone = %s OR email = %s", (test_phone, test_email))

    print("=== Bước 1: Ra lệnh thêm khách hàng mới qua Chat bằng Ngôn ngữ tự nhiên ===")
    user_msg = "Thêm khách hàng mới Nguyễn Văn Nam, SĐT 0987112233, Email nam.nguyen@gmail.com, Địa chỉ 456 Trần Phú Đà Nẵng, Nghề Kỹ sư"
    salesman_user = {"id": 3, "username": "salesman1", "role": "SALESMAN", "full_name": "Nhân viên Bán hàng 1"}

    reply = crm_agent.chat(
        user_message=user_msg,
        session_id="test_feat028_sess_1",
        user=salesman_user
    )
    print("\n[AI RESPONSE - LẦN 1]:\n", reply)

    # Kiểm tra CSDL PostgreSQL
    leads = query_all("SELECT * FROM leads WHERE phone = %s", (test_phone,))
    print("\n[CSDL POSTGRESQL CHECK]:", leads)
    assert len(leads) == 1, "Bản ghi lead chưa được thêm vào CSDL!"
    lead = leads[0]
    assert lead["phone"] == test_phone
    assert lead["email"] == test_email
    assert lead["first_name"] == "Nam"
    assert lead["last_name"] == "Nguyễn Văn"
    assert lead["career"] == "Kỹ sư"
    assert "456 Trần Phú" in lead["address"]
    print(">>> PASS: Lead mới đã được thêm chính xác 100% vào CSDL!")

    print("\n=== Bước 2: Thử thêm lại cùng SĐT để kiểm tra cơ chế chống trùng BR-02 ===")
    reply_dup = crm_agent.chat(
        user_message="Tạo khách hàng mới Nguyễn Văn Nam SĐT 0987112233",
        session_id="test_feat028_sess_2",
        user=salesman_user
    )
    print("\n[AI RESPONSE - LẦN 2 (TRÙNG LẶP)]:\n", reply_dup)

    # Dọn dẹp sau kiểm thử
    execute_commit("DELETE FROM leads WHERE phone = %s OR email = %s", (test_phone, test_email))
    print("\n>>> Đã dọn dẹp dữ liệu test an toàn!")

if __name__ == "__main__":
    test_autonomous_lead_creation()

