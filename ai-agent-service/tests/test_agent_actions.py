try:
    import pytest
except ImportError:
    pytest = None
from src.agents.router import router
from src.tools.lead_tools import create_lead
from src.tools.order_tools import create_opportunity
from src.database.connection import query_one

def test_intent_router_classification():
    assert router.classify("Thêm khách hàng mới Nguyễn Văn Nam") == "ACTION_LEAD"
    assert router.classify("Tạo lead mới sđt 0987112233") == "ACTION_LEAD"
    assert router.classify("Chốt đơn hàng cho khách Nam") == "ACTION_ORDER"
    assert router.classify("Tạo cơ hội bán hàng mới") == "ACTION_ORDER"
    assert router.classify("Báo cáo doanh thu tháng này") == "QUERY_REPORT"
    assert router.classify("Sản phẩm nào sắp hết hàng trong kho?") == "QUERY_REPORT"
    assert router.classify("Xin chào bạn là ai") == "GENERAL_QUERY"

def test_lead_deduplication_br02():
    # Lấy 1 lead có sẵn trong DB
    existing = query_one("SELECT phone, email FROM leads LIMIT 1")
    if existing:
        phone = existing["phone"]
        res = create_lead(
            first_name="Test",
            last_name="Duplicate",
            phone=phone
        )
        assert res.get("success") is False
        assert res.get("status") == "duplicate_rejected"
        assert "BR-02" in res.get("message", "")

def test_lead_creation_and_cleanup():
    test_phone = "0999888777"
    # Dọn dẹp trước nếu có
    from src.database.connection import execute_commit
    execute_commit("DELETE FROM leads WHERE phone = %s", (test_phone,))

    res = create_lead(
        first_name="Hùng",
        last_name="Trần Văn",
        phone=test_phone,
        email="hung.tran.test@gmail.com",
        career="Kỹ sư phần mềm",
        address="123 Nguyễn Văn Linh, Đà Nẵng"
    )
    assert res.get("success") is True
    assert res.get("status") == "created"
    assert "lead" in res
    assert res["lead"]["ho_va_ten"] == "Trần Văn Hùng"

    # Thử tạo lại với số điện thoại vừa tạo -> Phải bị chặn BR-02
    res_dup = create_lead(
        first_name="Hùng",
        last_name="Trần",
        phone=test_phone
    )
    assert res_dup.get("success") is False
    assert res_dup.get("status") == "duplicate_rejected"

    # Dọn dẹp dữ liệu test
    execute_commit("DELETE FROM leads WHERE phone = %s", (test_phone,))

def test_chat_history_persistence():
    from src.memory.redis_memory import memory
    test_session = "test_persistence_session"
    
    # Xóa sạch phiên trước
    memory.clear_session(test_session)
    assert len(memory.get_history(test_session)) == 0

    # Lưu 2 tin nhắn
    memory.save_message(test_session, "user", "Xin chào AI")
    memory.save_message(test_session, "assistant", "Chào bạn, tôi là Zen AI")

    # Đọc lại lịch sử
    hist = memory.get_history(test_session)
    assert len(hist) == 2
    assert hist[0]["role"] == "user"
    assert hist[0]["content"] == "Xin chào AI"
    assert hist[1]["role"] == "assistant"
    assert hist[1]["content"] == "Chào bạn, tôi là Zen AI"

    # Dọn dẹp
    memory.clear_session(test_session)
    assert len(memory.get_history(test_session)) == 0
