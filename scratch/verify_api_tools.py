"""
Kịch bản kiểm thử toàn diện: AI Agent CRM Tools gọi qua Express REST API (Approach 2)
Kiểm tra token forwarding, phân quyền RBAC và kiểm soát lỗi từ Express Backend.
"""
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent / "ai-agent-service"
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from src.utils.context import set_current_user, reset_current_user, set_current_token, reset_current_token
from src.tools.admin_tools import get_admin_system_overview
from src.tools.query_tools import (
    get_leads_summary,
    get_revenue_and_forecast,
    get_products_and_inventory,
    get_opportunities_overview,
    get_campaigns_overview,
    get_orders_summary,
    search_customer
)
from src.tools.lead_tools import create_lead
from src.tools.order_tools import create_opportunity

def test_admin_flow():
    print("\n--- 1. Kiểm thử ADMIN gọi API qua Tool ---")
    admin_user = {"id": 1, "username": "admin", "role": "ADMIN", "full_name": "Quản trị viên"}
    u_tok = set_current_user(admin_user)
    t_tok = set_current_token(None)
    try:
        res = get_admin_system_overview()
        print("Trạng thái hệ thống:", res.get("trang_thai_he_thong"))
        print("Thống kê vai trò:", res.get("thong_ke_vai_tro"))
        assert "trang_thai_he_thong" in res
        assert "thong_ke_vai_tro" in res
        print("✔ ADMIN gọi /api/admin/users và /api/admin/roles thành công!")
    finally:
        reset_current_user(u_tok)
        reset_current_token(t_tok)

def test_manager_flow():
    print("\n--- 2. Kiểm thử SALE_MANAGER gọi API qua Tool ---")
    mgr_user = {"id": 2, "username": "manager", "role": "SALE_MANAGER", "full_name": "Quản lý kinh doanh"}
    u_tok = set_current_user(mgr_user)
    t_tok = set_current_token(None)
    try:
        # Báo cáo doanh số
        rev = get_revenue_and_forecast()
        print("Doanh số tháng:", rev.get("doanh_thu_thang_thuc_te_vnd"), "Chỉ tiêu:", rev.get("chi_tieu_ke_hoach_thang_vnd"))
        assert "doanh_thu_thang_thuc_te_vnd" in rev

        # Danh sách lead
        leads = get_leads_summary(limit=3)
        print("Tổng lead:", leads.get("tong_so_lead_toan_he_thong"), "Số lead lấy về:", len(leads.get("danh_sach_lead", [])))
        assert "danh_sach_lead" in leads

        # Tồn kho sản phẩm
        prods = get_products_and_inventory(limit=3)
        print("Tổng sản phẩm:", prods.get("tong_so_san_pham_toan_he_thong"))
        assert "danh_sach_san_pham" in prods
        print("✔ SALE_MANAGER truy vấn toàn công ty thành công qua Express API!")
    finally:
        reset_current_user(u_tok)
        reset_current_token(t_tok)

def test_salesman_flow():
    print("\n--- 3. Kiểm thử SALESMAN bị Backend từ chối 403 & bảo mật RLS qua API ---")
    salesman_user = {"id": 3, "username": "salesman", "role": "SALESMAN", "full_name": "Nhân viên bán hàng"}
    u_tok = set_current_user(salesman_user)
    t_tok = set_current_token(None)
    try:
        # Salesman thử gọi báo cáo doanh thu -> Express Backend trả về 403 Forbidden
        rev = get_revenue_and_forecast()
        print("Salesman xem doanh số:", rev)
        assert "error" in rev
        assert ("từ chối" in rev["error"].lower() or "403" in rev["error"] or "quyền" in rev["error"].lower())

        # Salesman thử gọi công cụ Admin -> Phải bị từ chối
        admin_ov = get_admin_system_overview()
        print("Salesman gọi Admin Overview:", admin_ov)
        assert "error" in admin_ov

        # Salesman gọi tra cứu sản phẩm -> Express chỉ trả về sản phẩm được phân quyền
        prods = get_products_and_inventory(limit=10)
        print("Sản phẩm Salesman được phân quyền xem:", prods.get("so_san_pham_khop_tim_kiem"))
        assert "danh_sach_san_pham" in prods

        # Salesman thử tạo Lead trùng SĐT -> Express Backend trả về 409 Conflict (BR-02)
        dup_lead = create_lead(
            first_name="Test",
            last_name="Trùng SĐT",
            phone="0565376829",
            email="test_dup_api@zencrm.local"
        )
        print("Kết quả tạo Lead trùng:", dup_lead)
        assert dup_lead.get("status") == "duplicate_rejected"
        assert "BR-02" in dup_lead.get("message", "")

        print("✔ SALESMAN kiểm soát phân quyền RBAC & RLS qua Express REST API hoàn hảo!")
    finally:
        reset_current_user(u_tok)
        reset_current_token(t_tok)

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Bắt đầu kiểm thử toàn diện các Tool gọi qua Express REST API")
    print("=" * 60)
    test_admin_flow()
    test_manager_flow()
    test_salesman_flow()
    print("\n" + "=" * 60)
    print("🎉 TẤT CẢ CÁC KIỂM THỬ GỌI TOOL QUA API ĐỀU THÀNH CÔNG RỰC RỠ!")
    print("=" * 60)
