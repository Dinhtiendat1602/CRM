"""Test Live E2E Gemini Agent executing API-driven tools."""
import sys
import importlib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent / "ai-agent-service"
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

_agents_mod = importlib.import_module("src.agents")
crm_agent = _agents_mod.crm_agent

def run_live_test():
    print("--- Testing Live Chat with Manager Role ---")
    mgr_user = {"id": 2, "username": "manager", "role": "SALE_MANAGER", "full_name": "Quản lý kinh doanh"}
    reply_mgr = crm_agent.chat(
        user_message="Báo cáo nhanh cho tôi tiến độ hoàn thành doanh số tháng này",
        session_id="test_api_mgr_sess",
        user=mgr_user
    )
    print("MGR REPLY:\n", reply_mgr)

    print("\n--- Testing Live Chat with Salesman Role ---")
    sale_user = {"id": 3, "username": "salesman", "role": "SALESMAN", "full_name": "Nhân viên bán hàng"}
    reply_sale = crm_agent.chat(
        user_message="Tôi được phân quyền bán những sản phẩm nào trong kho?",
        session_id="test_api_sale_sess",
        user=sale_user
    )
    print("SALE REPLY:\n", reply_sale)

if __name__ == "__main__":
    run_live_test()
