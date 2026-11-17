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

def test_langgraph_crm_agent_structure():
    from src.agents import crm_agent, BaseAgent, CRMAgent
    from langgraph.graph.state import CompiledStateGraph
    
    assert isinstance(crm_agent, CRMAgent)
    assert isinstance(crm_agent, BaseAgent)
    assert isinstance(crm_agent.graph, CompiledStateGraph)
    
    node_names = list(crm_agent.graph.nodes.keys())
    assert "agent" in node_names
    assert "tools" in node_names
    assert len(crm_agent.tools) == 9
    
    # Kiểm tra hydrate session khi có lịch sử sẵn
    from src.memory.redis_memory import memory
    hydrate_session = "test_hydrate_session"
    memory.clear_session(hydrate_session)
    memory.save_message(hydrate_session, "user", "Tin nhắn trước đó")
    memory.save_message(hydrate_session, "assistant", "Câu trả lời trước đó")
    
    crm_agent._hydrate_session_if_needed(hydrate_session)
    config = {"configurable": {"thread_id": hydrate_session}}
    state = crm_agent.graph.get_state(config)
    assert "messages" in state.values
    assert len(state.values["messages"]) >= 2
    
    # Test reset session dọn dẹp cả checkpointer và memory
    res_reset = crm_agent.reset_session(hydrate_session)
    assert res_reset is True
    assert len(memory.get_history(hydrate_session)) == 0


def test_role_based_access_control_jwt():
    """Kiểm tra mã hóa, giải mã JWT và phân quyền vai trò người dùng."""
    import jwt
    from config.settings import settings
    from src.api.auth import decode_jwt_token, get_current_user

    # 1. Tạo JWT mẫu cho SALESMAN
    payload = {
        "id": 3,
        "username": "salesman1",
        "email": "salesman1@zencrm.vn",
        "role": "SALESMAN",
        "full_name": "Nhân viên Bán hàng 1"
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    
    # 2. Giải mã xác thực
    decoded = decode_jwt_token(token)
    assert decoded["username"] == "salesman1"
    assert decoded["role"] == "SALESMAN"

    # 3. Trích xuất qua FastAPI dependency
    user = get_current_user(f"Bearer {token}")
    assert user["id"] == 3
    assert user["role"] == "SALESMAN"
    assert user["full_name"] == "Nhân viên Bán hàng 1"

    # 4. Fallback khi không có token (chế độ an toàn cho manager)
    fallback_user = get_current_user(None)
    assert fallback_user["role"] == "SALE_MANAGER"


def test_admin_tools_and_restrictions():
    """Kiểm tra quyền hạn và giới hạn bảo mật của vai trò ADMIN."""
    from src.utils.context import set_current_user, reset_current_user
    from src.tools.admin_tools import get_admin_system_overview
    from src.tools.lead_tools import create_lead
    from src.tools.order_tools import create_opportunity

    # Thiết lập ngữ cảnh ADMIN
    admin_user = {"id": 1, "username": "admin", "role": "ADMIN", "full_name": "Quản trị viên"}
    tok = set_current_user(admin_user)
    try:
        # ADMIN được phép truy vấn trạng thái hệ thống
        overview = get_admin_system_overview()
        assert "error" not in overview
        assert "trang_thai_he_thong" in overview
        assert overview["trang_thai_he_thong"]["dich_vu"] == "Zen CRM Enterprise Core"
        assert "thong_ke_vai_tro" in overview

        # ADMIN bị chặn tạo khách hàng hoặc cơ hội kinh doanh
        lead_res = create_lead("Test", "Admin", "0911223344")
        assert "error" in lead_res
        assert "ADMIN" in lead_res["error"]

        opp_res = create_opportunity(1, "PROD-001")
        assert "error" in opp_res
        assert "ADMIN" in opp_res["error"]
    finally:
        reset_current_user(tok)

    # Người dùng không phải ADMIN bị từ chối công cụ admin
    sales_user = {"id": 3, "username": "sales", "role": "SALESMAN"}
    tok_sales = set_current_user(sales_user)
    try:
        denied = get_admin_system_overview()
        assert "error" in denied
    finally:
        reset_current_user(tok_sales)


def test_salesman_tools_rls_and_restrictions():
    """Kiểm tra Row-Level Security và giới hạn truy vấn của SALESMAN."""
    from src.utils.context import set_current_user, reset_current_user
    from src.tools.query_tools import (
        get_revenue_and_forecast,
        get_campaigns_overview,
        get_leads_summary,
        get_products_and_inventory
    )

    salesman_user = {"id": 3, "username": "salesman1", "role": "SALESMAN", "full_name": "Lê Văn Bán Hàng"}
    tok = set_current_user(salesman_user)
    try:
        # 1. Bị từ chối xem doanh thu & kế hoạch toàn công ty
        rev = get_revenue_and_forecast()
        assert "error" in rev
        assert "Quản lý" in rev["error"]

        # 2. Bị từ chối xem chiến dịch tiếp thị
        camp = get_campaigns_overview()
        assert "error" in camp
        assert "Quản lý" in camp["error"]

        # 3. Row-level security: Chỉ xem leads do mình phụ trách
        leads = get_leads_summary(limit=20)
        assert "error" not in leads
        assert "danh_sach_lead" in leads

        # 4. Chỉ xem các sản phẩm được phân quyền
        prods = get_products_and_inventory()
        assert "error" not in prods
        assert "danh_sach_san_pham" in prods
    finally:
        reset_current_user(tok)


def test_role_graphs_tool_allocation():
    """Kiểm tra việc phân bổ công cụ chính xác cho từng đồ thị LangGraph theo Role."""
    from src.agents import crm_agent

    assert "ADMIN" in crm_agent.role_graphs
    assert "SALE_MANAGER" in crm_agent.role_graphs
    assert "SALESMAN" in crm_agent.role_graphs

    from src.tools import get_tools_for_role
    admin_tools = get_tools_for_role("ADMIN")
    manager_tools = get_tools_for_role("SALE_MANAGER")
    salesman_tools = get_tools_for_role("SALESMAN")

    assert len(admin_tools) == 1
    assert admin_tools[0].name == "get_admin_system_overview"

    assert len(manager_tools) == 9
    assert len(salesman_tools) == 7

    salesman_tool_names = [t.name for t in salesman_tools]
    assert "get_revenue_and_forecast" not in salesman_tool_names
    assert "get_campaigns_overview" not in salesman_tool_names
    assert "get_leads_summary" in salesman_tool_names
    assert "create_lead" in salesman_tool_names
    assert "create_opportunity" in salesman_tool_names


def test_chat_history_role_isolation():
    """Kiểm tra cách ly lịch sử trò chuyện nghiêm ngặt theo vai trò và người dùng."""
    from src.memory.redis_memory import memory

    sess_admin = "test_iso_admin_sess"
    sess_mgr = "test_iso_mgr_sess"
    sess_sales = "test_iso_sales_sess"

    # Dọn dẹp trước
    memory.clear_session(sess_admin)
    memory.clear_session(sess_mgr)
    memory.clear_session(sess_sales)

    # 1. Lưu phiên cho từng vai trò
    admin_u = {"id": 1, "username": "admin", "role": "ADMIN"}
    mgr_u = {"id": 2, "username": "manager", "role": "SALE_MANAGER"}
    sales_u = {"id": 3, "username": "salesman1", "role": "SALESMAN"}

    memory.save_message(sess_admin, "user", "Tin nhắn từ Admin", user=admin_u)
    memory.save_message(sess_mgr, "user", "Tin nhắn từ Manager", user=mgr_u)
    memory.save_message(sess_sales, "user", "Tin nhắn từ Salesman", user=sales_u)

    # 2. Kiểm tra list_saved_sessions lọc chính xác
    admin_sessions = [s["session_id"] for s in memory.list_saved_sessions(role="ADMIN")]
    assert sess_admin in admin_sessions
    assert sess_mgr not in admin_sessions
    assert sess_sales not in admin_sessions

    mgr_sessions = [s["session_id"] for s in memory.list_saved_sessions(role="SALE_MANAGER")]
    assert sess_mgr in mgr_sessions
    assert sess_admin not in mgr_sessions
    assert sess_sales not in mgr_sessions

    sales_sessions = [s["session_id"] for s in memory.list_saved_sessions(role="SALESMAN", user_id=3)]
    assert sess_sales in sales_sessions
    assert sess_admin not in sales_sessions
    assert sess_mgr not in sales_sessions

    # 3. Kiểm tra vai trò của session
    assert memory.get_session_role(sess_admin) == "ADMIN"
    assert memory.get_session_role(sess_mgr) == "SALE_MANAGER"
    assert memory.get_session_role(sess_sales) == "SALESMAN"
    assert memory.get_session_user_id(sess_sales) == 3

    # Dọn dẹp
    memory.clear_session(sess_admin)
    memory.clear_session(sess_mgr)
    memory.clear_session(sess_sales)



