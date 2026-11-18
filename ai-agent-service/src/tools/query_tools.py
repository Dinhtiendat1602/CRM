"""
Các công cụ tra cứu cơ sở dữ liệu Zen CRM dành cho Trợ lý AI Gemini (Function Calling)
thực thi hoàn toàn thông qua việc gửi yêu cầu đến Express REST API Backend kèm JWT Bearer Token.
"""

from datetime import datetime
from typing import Optional
from src.utils.normalizer import format_vietnamese_name, format_currency
from src.utils.context import get_current_user_context
from src.services.backend_client import backend_client


def get_leads_summary(limit: int = 10, query: Optional[str] = "") -> dict:
    """
    Tra cứu tổng quan về Khách hàng tiềm năng (Leads) qua Express REST API /api/leads.
    - limit: Số lượng lead cần lấy (mặc định 10).
    - query: Từ khóa tìm kiếm theo họ tên (có dấu hoặc không dấu), số điện thoại hoặc email.
    Trả về tổng số lead trong hệ thống, số lead mới hôm nay, số lead tháng này và danh sách chi tiết.
    Đối với Salesman: Tự động chỉ trả về các khách hàng do nhân viên này phụ trách.
    """
    user = get_current_user_context()
    is_salesman = (user.get("role") == "SALESMAN")
    user_id = user.get("id")

    params = {
        "limit": limit,
        "all_time": "true"
    }
    clean_q = (query or "").strip()
    if clean_q:
        params["search"] = clean_q
    if is_salesman and user_id:
        params["assigned_to"] = user_id

    api_res = backend_client.get("/leads", params=params)
    if "error" in api_res:
        return api_res

    leads_data = api_res.get("data", [])
    pagination = api_res.get("pagination", {})
    total = pagination.get("total", len(leads_data))

    today_str = datetime.now().strftime("%Y-%m-%d")
    current_month_str = datetime.now().strftime("%Y-%m")

    today_count = 0
    month_count = 0
    formatted_leads = []

    for l in leads_data:
        entered = str(l.get("entered_date", ""))
        if entered.startswith(today_str):
            today_count += 1
        if entered.startswith(current_month_str):
            month_count += 1

        full_name = l.get("full_name") or format_vietnamese_name(l.get("first_name", ""), l.get("last_name", ""))
        formatted_leads.append({
            "id": l.get("id"),
            "ho_va_ten": full_name,
            "so_dien_thoai": l.get("phone"),
            "email": l.get("email"),
            "nghe_nghiep": l.get("career") or "Chưa cập nhật",
            "dia_chi": l.get("address") or "Chưa cập nhật",
            "ngay_nhap": entered
        })

    return {
        "tong_so_lead_toan_he_thong": total,
        "so_lead_moi_hom_nay": today_count,
        "so_lead_moi_thang_nay": month_count,
        "so_lead_tra_ve": len(formatted_leads),
        "danh_sach_lead": formatted_leads
    }


def get_revenue_and_forecast(year: Optional[int] = None, month: Optional[int] = None) -> dict:
    """
    Tra cứu báo cáo doanh số thực tế và tiến độ hoàn thành chỉ tiêu kế hoạch (Sales Forecast) qua Express REST API.
    - year: Năm tài chính (mặc định là năm hiện tại 2026).
    - month: Tháng (1-12, mặc định là tháng hiện tại).
    Trả về doanh thu thực tế, số đơn hàng thành công, chỉ tiêu kế hoạch, tỉ lệ đạt được và bảng tổng hợp 12 tháng.
    Yêu cầu quyền hạn: Chỉ Sale Manager và Admin được phép truy cập (Salesman sẽ bị Backend từ chối 403 Forbidden).
    """
    user = get_current_user_context()
    if user.get("role") == "SALESMAN":
        return {
            "error": "Quyền truy cập bị từ chối: Báo cáo tài chính, chỉ tiêu và doanh số toàn công ty chỉ dành riêng cho vai trò Quản lý (Sale Manager)."
        }

    now = datetime.now()
    target_year = year or now.year
    target_month = month or now.month

    # Gọi API kiểm tra performance kế hoạch & thực tế từ Express Backend
    fc_res = backend_client.get("/forecasts/performance", params={"year": target_year})
    if "error" in fc_res:
        return fc_res

    fc_data = fc_res.get("data", {})
    months = fc_data.get("months", [])
    fc_summary = fc_data.get("summary", {})

    target_month_data = next((m for m in months if m.get("month") == target_month), {})
    actual_rev = float(target_month_data.get("actually_value", 0))
    target_plan = float(target_month_data.get("plan", 0))
    achieved_pct = float(target_month_data.get("percentage", 0))
    orders_cnt = int(target_month_data.get("orders_count", 0))

    monthly_breakdown = [
        {
            "thang": m.get("month"),
            "so_don_thanh_cong": m.get("orders_count", 0),
            "doanh_thu_vnd": float(m.get("actually_value", 0))
        }
        for m in months
    ]

    return {
        "nam_tai_chinh": target_year,
        "thang": target_month,
        "doanh_thu_thang_thuc_te_vnd": actual_rev,
        "so_don_thanh_cong_thang": orders_cnt,
        "chi_tieu_ke_hoach_thang_vnd": target_plan,
        "ti_le_hoan_thanh_ke_hoach_percent": achieved_pct,
        "doanh_thu_luy_ke_ca_nam_vnd": float(fc_summary.get("total_actual", 0)),
        "tong_so_don_ca_nam": int(fc_summary.get("total_orders", 0)),
        "bang_tong_hop_doanh_thu_cac_thang_nam": monthly_breakdown
    }


def get_products_and_inventory(query: Optional[str] = "", low_stock_only: bool = False, limit: int = 25) -> dict:
    """
    Tra cứu danh mục sản phẩm, đơn giá và số lượng tồn kho qua Express REST API /api/products.
    - query: Tên sản phẩm, danh mục hoặc mã sản phẩm cần tìm.
    - low_stock_only: Chỉ hiển thị các sản phẩm sắp hết hàng (tồn kho <= 5).
    - limit: Số lượng sản phẩm hiển thị (mặc định 25).
    Đối với Salesman: Express Backend tự động lọc chỉ hiển thị các sản phẩm được phân quyền bán (salesman_products).
    """
    params = {
        "limit": 100
    }
    clean_q = (query or "").strip()
    if clean_q:
        params["search"] = clean_q

    api_res = backend_client.get("/products", params=params)
    if "error" in api_res:
        return api_res

    products = api_res.get("products") or api_res.get("data") or []
    total_products = api_res.get("pagination", {}).get("totalRecords", len(products))

    # Đếm số lượng sản phẩm sắp hết hàng
    low_count = sum(1 for p in products if int(p.get("stock_qty", 0)) <= 5)

    if low_stock_only:
        products = [p for p in products if int(p.get("stock_qty", 0)) <= 5]

    # Sắp xếp theo tồn kho tăng dần và giới hạn kết quả
    products.sort(key=lambda p: int(p.get("stock_qty", 0)))
    display_products = products[:limit]

    items = []
    for r in display_products:
        stock = int(r.get("stock_qty", 0))
        items.append({
            "id": r.get("id"),
            "ma_san_pham": r.get("product_code"),
            "ten_san_pham": r.get("name"),
            "danh_muc": r.get("category_name") or "Khác",
            "don_gia_vnd": float(r.get("unit_price", 0)),
            "so_luong_ton_kho": stock,
            "canh_bao": "Sắp hết hàng!" if stock <= 5 else "Bình thường"
        })

    return {
        "tong_so_san_pham_toan_he_thong": total_products,
        "so_san_pham_khop_tim_kiem": len(items),
        "so_san_pham_canh_bao_het_hang": low_count,
        "danh_sach_san_pham": items
    }


def get_opportunities_overview() -> dict:
    """
    Tra cứu tổng quan về Cơ hội bán hàng (Opportunities) qua Express REST API /api/opportunities.
    Bao gồm phân bố theo từng giai đoạn (NEW, CONTACTED, QUALIFIED, PROPOSAL, ORDERED, LOST)
    và danh sách các cơ hội bán hàng có giá trị lớn nhất hiện có.
    Đối với Salesman: Tự động chỉ hiển thị các cơ hội do nhân viên phụ trách hoặc tạo lập.
    """
    user = get_current_user_context()
    is_salesman = (user.get("role") == "SALESMAN")
    user_id = user.get("id")

    params = {
        "limit": 100,
        "all_time": "true"
    }
    if is_salesman and user_id:
        params["created_by"] = user_id

    api_res = backend_client.get("/opportunities", params=params)
    if "error" in api_res:
        return api_res

    opps_list = api_res.get("data", [])

    pipeline = {
        "NEW": 0,
        "CONTACTED": 0,
        "QUALIFIED": 0,
        "PROPOSAL": 0,
        "ORDERED": 0,
        "LOST": 0
    }
    for opp in opps_list:
        st = str(opp.get("status", "NEW")).upper()
        if st in pipeline:
            pipeline[st] += 1
        else:
            pipeline[st] = pipeline.get(st, 0) + 1

    # Tính toán tổng giá trị pipeline đang mở (chưa ORDERED hoặc LOST)
    open_opps = [o for o in opps_list if str(o.get("status", "")).upper() not in ["ORDERED", "LOST"]]
    
    def get_opp_value(o):
        try:
            return float(o.get("estimated_value") or (int(o.get("quantity", 1)) * float(o.get("unit_price", 0))))
        except Exception:
            return 0.0

    total_open_val = sum(get_opp_value(o) for o in open_opps)

    # Sắp xếp top cơ hội tiềm năng có giá trị lớn nhất
    open_opps.sort(key=get_opp_value, reverse=True)
    top_rows = open_opps[:6]

    top_opps = []
    for r in top_rows:
        lead_name = r.get("lead_name") or format_vietnamese_name(r.get("lead_first_name", ""), r.get("lead_last_name", ""))
        top_opps.append({
            "id": r.get("id"),
            "khach_hang": lead_name,
            "so_dien_thoai": r.get("lead_phone", "Chưa cập nhật"),
            "san_pham": r.get("product_name"),
            "so_luong": r.get("quantity", 1),
            "gia_tri_du_kien_vnd": get_opp_value(r),
            "trang_thai": r.get("status"),
            "ngay_du_kien_chot": str(r.get("expected_close_date", "Chưa rõ"))
        })

    return {
        "phan_bo_theo_giai_doan": pipeline,
        "tong_so_co_hoi_dang_mo": len(open_opps),
        "tong_gia_tri_pipeline_dang_mo_vnd": total_open_val,
        "top_co_hoi_tiem_nang": top_opps
    }


def get_campaigns_overview(query: Optional[str] = "") -> dict:
    """
    Tra cứu danh sách các chiến dịch tiếp thị (Campaigns) đang diễn ra hoặc đã kết thúc,
    ngân sách và số lượng Lead thu thập được từ mỗi chiến dịch qua Express REST API /api/campaigns.
    - query: Tìm kiếm chiến dịch theo tên (tùy chọn).
    Đối với Salesman: Bị từ chối vì báo cáo chiến dịch chỉ dành cho cấp Quản lý.
    """
    user = get_current_user_context()
    if user.get("role") == "SALESMAN":
        return {
            "error": "Quyền truy cập bị từ chối: Báo cáo chiến dịch và ngân sách tiếp thị chỉ dành riêng cho Quản lý (Sale Manager)."
        }

    params = {"limit": 50}
    clean_q = (query or "").strip()
    if clean_q:
        params["search"] = clean_q

    api_res = backend_client.get("/campaigns", params=params)
    if "error" in api_res:
        return api_res

    rows = api_res.get("data", [])
    pagination = api_res.get("pagination", {})
    total_campaigns = pagination.get("total", len(rows))

    campaigns = []
    for r in rows:
        campaigns.append({
            "id": r.get("id"),
            "ten_chien_dich": r.get("name"),
            "ngan_sach_vnd": float(r.get("budget", 0)),
            "ngay_bat_dau": str(r.get("start_date", "")),
            "ngay_ket_thuc": str(r.get("end_date", "")),
            "so_lead_thu_thap_duoc": int(r.get("leads_count", 0))
        })

    return {
        "tong_so_chien_dich_he_thong": total_campaigns,
        "so_chien_dich_khop": len(campaigns),
        "danh_sach_chien_dich": campaigns
    }


def get_orders_summary(limit: int = 10, query: Optional[str] = "", status: Optional[str] = "") -> dict:
    """
    Tra cứu danh sách các đơn hàng (Orders) trong hệ thống qua Express REST API /api/orders.
    - limit: Số lượng đơn hàng cần lấy (mặc định 10).
    - query: Tìm kiếm theo mã đơn (VD: 'ORD-20260115-0001'), tên khách hàng hoặc tên sản phẩm.
    - status: Lọc theo trạng thái đơn ('COMPLETED', 'PENDING', 'CANCELLED').
    Trả về tổng số đơn, tổng giá trị và chi tiết từng đơn hàng kèm tên sản phẩm, số lượng, ngày đặt.
    Đối với Salesman: Tự động chỉ hiển thị các đơn hàng của khách hàng do nhân viên phụ trách.
    """
    user = get_current_user_context()
    is_salesman = (user.get("role") == "SALESMAN")
    user_id = user.get("id")

    params = {
        "limit": limit,
        "all_time": "true"
    }
    clean_q = (query or "").strip()
    if clean_q:
        params["search"] = clean_q
    clean_st = (status or "").strip().upper()
    if clean_st:
        params["status"] = clean_st
    if is_salesman and user_id:
        params["created_by"] = user_id

    api_res = backend_client.get("/orders", params=params)
    if "error" in api_res:
        return api_res

    orders_data = api_res.get("data", [])
    summary = api_res.get("summary", {})
    total_orders = summary.get("totalOrders", len(orders_data))
    total_amount = float(summary.get("totalRevenue", 0))

    completed_orders = sum(1 for o in orders_data if str(o.get("status", "")).upper() == "COMPLETED")

    orders_list = []
    for r in orders_data:
        lead_name = r.get("lead_name") or format_vietnamese_name(r.get("first_name", ""), r.get("last_name", ""))
        orders_list.append({
            "id": r.get("id"),
            "ma_don": r.get("order_code"),
            "khach_hang": lead_name,
            "so_dien_thoai": r.get("lead_phone") or r.get("phone", "Chưa cập nhật"),
            "san_pham": r.get("product_name"),
            "ma_san_pham": r.get("product_code"),
            "so_luong": r.get("quantity", 1),
            "don_gia_vnd": float(r.get("unit_price", 0)),
            "tong_tien_vnd": float(r.get("total_amount", 0)),
            "ngay_dat": str(r.get("order_date", "")),
            "phuong_thuc_thanh_toan": r.get("payment_info", "Chưa cập nhật"),
            "dia_chi_giao_hang": r.get("shipping_address", "Chưa cập nhật"),
            "trang_thai": r.get("status")
        })

    return {
        "tong_so_don_hang": total_orders,
        "tong_so_don_thanh_cong": completed_orders,
        "tong_gia_tri_vnd": total_amount,
        "danh_sach_don_hang": orders_list
    }


def search_customer(keyword: str) -> dict:
    """
    Tìm kiếm thông tin chi tiết một khách hàng cụ thể theo số điện thoại, email hoặc họ tên qua Express REST API.
    Hỗ trợ tìm kiếm tiếng Việt có dấu hoặc không dấu, thứ tự họ tên tự nhiên.
    Trả về thông tin cá nhân cùng toàn bộ lịch sử các sản phẩm đã mua, đơn hàng và cơ hội bán hàng.
    Đối với Salesman: Tự động chỉ tìm kiếm trong tệp khách hàng do nhân viên phụ trách.
    """
    user = get_current_user_context()
    is_salesman = (user.get("role") == "SALESMAN")
    user_id = user.get("id")

    clean_keyword = (keyword or "").strip()
    params = {
        "search": clean_keyword,
        "all_time": "true",
        "limit": 5
    }
    if is_salesman and user_id:
        params["assigned_to"] = user_id

    lead_res = backend_client.get("/leads", params=params)
    if "error" in lead_res:
        return lead_res

    matching_leads = lead_res.get("data", [])
    if not matching_leads:
        if is_salesman:
            return {"thong_bao": f"Không tìm thấy khách hàng nào khớp với từ khóa '{keyword}' trong danh sách phụ trách của bạn (hoặc khách hàng thuộc phụ trách của nhân viên khác)."}
        return {"thong_bao": f"Không tìm thấy khách hàng nào khớp với từ khóa '{keyword}' trong cơ sở dữ liệu Zen CRM."}

    # Chọn khách hàng phù hợp nhất đầu tiên
    primary_lead = matching_leads[0]
    lead_id = primary_lead["id"]

    # Lấy thông tin chi tiết kèm các cơ hội liên quan qua GET /api/leads/:id
    detail_res = backend_client.get(f"/leads/{lead_id}")
    lead_detail = detail_res.get("data", primary_lead) if not "error" in detail_res else primary_lead

    full_name = lead_detail.get("full_name") or format_vietnamese_name(lead_detail.get("first_name", ""), lead_detail.get("last_name", ""))
    raw_opps = lead_detail.get("opportunities", [])
    opps = []
    for o in raw_opps:
        qty = int(o.get("quantity", 1))
        unit_p = float(o.get("unit_price", 0))
        opps.append({
            "id": o.get("id"),
            "product_name": o.get("product_name"),
            "product_code": o.get("product_code"),
            "quantity": qty,
            "unit_price": unit_p,
            "estimated_val": qty * unit_p,
            "status": o.get("status"),
            "expected_close_date": o.get("expected_close_date")
        })

    # Lấy lịch sử đơn hàng của khách hàng này qua GET /api/orders?lead_id=...
    orders_res = backend_client.get("/orders", params={"lead_id": lead_id, "all_time": "true", "limit": 20})
    raw_orders = orders_res.get("data", []) if not "error" in orders_res else []
    orders = []
    for ord_item in raw_orders:
        orders.append({
            "id": ord_item.get("id"),
            "order_code": ord_item.get("order_code"),
            "product_name": ord_item.get("product_name"),
            "product_code": ord_item.get("product_code"),
            "quantity": ord_item.get("quantity"),
            "unit_price": float(ord_item.get("unit_price", 0)),
            "total_amount": float(ord_item.get("total_amount", 0)),
            "order_date": ord_item.get("order_date"),
            "status": ord_item.get("status"),
            "payment_info": ord_item.get("payment_info"),
            "shipping_address": ord_item.get("shipping_address")
        })

    # Tính tổng giá trị đơn hàng đã mua
    total_spent = sum(o["total_amount"] for o in orders if str(o.get("status", "")).upper() == "COMPLETED")

    return {
        "khach_hang": {
            "id": lead_id,
            "ho_va_ten": full_name,
            "so_dien_thoai": lead_detail.get("phone"),
            "email": lead_detail.get("email"),
            "nghe_nghiep": lead_detail.get("career") or "Chưa cập nhật",
            "dia_chi": lead_detail.get("address") or "Chưa cập nhật",
            "ngay_nhap_crm": str(lead_detail.get("entered_date", "")),
            "nguoi_phu_trach": lead_detail.get("assigned_to_name") or "Chưa gán"
        },
        "tong_quan_chi_tieu": {
            "so_don_da_mua": len([o for o in orders if str(o.get("status", "")).upper() == "COMPLETED"]),
            "tong_tien_da_thanh_toan_vnd": total_spent,
            "tong_so_co_hoi_dang_theo_duoi": len([o for o in opps if str(o.get("status", "")).upper() not in ["ORDERED", "LOST"]])
        },
        "danh_sach_co_hoi_ban_hang": opps,
        "danh_sach_don_hang_da_dat": orders
    }

QUERY_TOOLS = [
    get_leads_summary,
    get_revenue_and_forecast,
    get_products_and_inventory,
    get_opportunities_overview,
    get_campaigns_overview,
    get_orders_summary,
    search_customer,
]
