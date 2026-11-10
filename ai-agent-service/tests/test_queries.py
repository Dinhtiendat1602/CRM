try:
    import pytest
except ImportError:
    pytest = None
from src.utils.normalizer import (
    format_vietnamese_name,
    remove_vietnamese_accents,
    format_currency,
    clean_phone
)
from src.database.connection import check_db_health
from src.tools.query_tools import (
    get_leads_summary,
    get_revenue_and_forecast,
    get_products_and_inventory,
    get_opportunities_overview,
    get_campaigns_overview,
    get_orders_summary,
    search_customer,
)

def test_vietnamese_name_formatting():
    # Trường hợp 1: fn là họ, ln là tên đệm & tên
    assert format_vietnamese_name("Nguyen", "Van An") == "Nguyen Van An"
    # Trường hợp 2: ln là họ & tên đệm, fn là tên
    assert format_vietnamese_name("Đức", "Phan Cảnh") == "Phan Cảnh Đức"
    assert format_vietnamese_name("", "Nguyễn Văn Nam") == "Nguyễn Văn Nam"

def test_remove_vietnamese_accents():
    assert remove_vietnamese_accents("Nguyễn Văn Nam") == "Nguyen Van Nam"
    assert remove_vietnamese_accents("Đà Nẵng") == "Da Nang"

def test_clean_phone():
    assert clean_phone("0987.112.233") == "0987112233"
    assert clean_phone("+84 987 112 233") == "+84987112233"

def test_format_currency():
    assert format_currency(24500000) == "24.500.000 ₫"

def test_database_health():
    is_healthy = check_db_health()
    assert is_healthy is True, "Database PostgreSQL phải phản hồi SELECT 1 thành công"

def test_get_leads_summary():
    res = get_leads_summary(limit=5)
    assert "error" not in res
    assert "tong_so_lead_toan_he_thong" in res
    assert isinstance(res["danh_sach_lead"], list)

def test_get_revenue_and_forecast():
    res = get_revenue_and_forecast()
    assert "error" not in res
    assert "doanh_thu_thang_thuc_te_vnd" in res
    assert "chi_tieu_ke_hoach_thang_vnd" in res

def test_get_products_and_inventory():
    res = get_products_and_inventory(limit=10)
    assert "error" not in res
    assert "tong_so_san_pham_toan_he_thong" in res

def test_get_opportunities_overview():
    res = get_opportunities_overview()
    assert "error" not in res
    assert "tong_so_co_hoi_dang_mo" in res

def test_get_campaigns_overview():
    res = get_campaigns_overview()
    assert "error" not in res
    assert "tong_so_chien_dich_he_thong" in res

def test_get_orders_summary():
    res = get_orders_summary(limit=5)
    assert "error" not in res
    assert "tong_so_don_hang" in res

def test_search_customer_accent_insensitivity():
    # Tìm kiếm khách hàng không dấu và có dấu đều phải tìm ra
    res_accent = search_customer("Nguyễn Văn An")
    res_no_accent = search_customer("Nguyen Van An")
    assert "error" not in res_accent
    assert "error" not in res_no_accent
    assert "khach_hang" in res_accent
    assert "khach_hang" in res_no_accent
