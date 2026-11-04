"""
Các công cụ tra cứu cơ sở dữ liệu Zen CRM dành cho Trợ lý AI Gemini (Function Calling).
Mỗi hàm đều có docstring rõ ràng và type hints để Gemini hiểu chính xác ngữ cảnh sử dụng.
"""

from datetime import datetime
from database import query_all, query_one

def format_vietnamese_name(first_name: str, last_name: str) -> str:
    """
    Chuẩn hóa ghép họ và tên tiếng Việt một cách tự nhiên và chính xác.
    Xử lý tự động cả 2 trường hợp:
    1. first_name = Họ ('Nguyen'), last_name = Tên đệm & Tên ('Van An') -> 'Nguyen Van An'
    2. last_name = Họ & Tên đệm ('Phan Cảnh'), first_name = Tên ('Đức') -> 'Phan Cảnh Đức'
    """
    fn = (first_name or "").strip()
    ln = (last_name or "").strip()
    if not fn:
        return ln
    if not ln:
        return fn

    common_surnames = {
        'nguyen', 'tran', 'le', 'pham', 'hoang', 'huynh', 'phan', 'vu', 'vo', 
        'dang', 'bui', 'do', 'ho', 'ngo', 'duong', 'ly', 'dinh', 'trinh', 'mai', 
        'dao', 'doan', 'luong', 'nguyễn', 'trần', 'lê', 'phạm', 'hoàng', 'huỳnh', 
        'phần', 'vũ', 'võ', 'đặng', 'bùi', 'đỗ', 'hồ', 'ngô', 'dương', 'lý', 'đinh', 'trịnh'
    }

    fn_lower = fn.lower()
    ln_lower = ln.lower().split()
    first_word_ln = ln_lower[0] if ln_lower else ""

    if fn_lower in common_surnames and first_word_ln not in common_surnames:
        return f"{fn} {ln}"
    return f"{ln} {fn}"


def get_leads_summary(limit: int = 10, query: str = "") -> dict:
    """
    Tra cứu tổng quan về Khách hàng tiềm năng (Leads).
    - limit: Số lượng lead cần lấy (mặc định 10).
    - query: Từ khóa tìm kiếm theo họ tên (có dấu hoặc không dấu), số điện thoại hoặc email.
    Trả về tổng số lead trong hệ thống, số lead mới hôm nay, số lead tháng này và danh sách chi tiết.
    """
    try:
        total_res = query_one("SELECT COUNT(*) AS total FROM leads")
        total = total_res["total"] if total_res else 0

        today_str = datetime.now().strftime("%Y-%m-%d")
        today_res = query_one(
            "SELECT COUNT(*) AS today_count FROM leads WHERE DATE(entered_date) = %s",
            (today_str,)
        )
        today_count = today_res["today_count"] if today_res else 0

        current_month = datetime.now().month
        current_year = datetime.now().year
        month_res = query_one(
            "SELECT COUNT(*) AS month_count FROM leads WHERE EXTRACT(MONTH FROM entered_date) = %s AND EXTRACT(YEAR FROM entered_date) = %s",
            (current_month, current_year)
        )
        month_count = month_res["month_count"] if month_res else 0

        if query.strip():
            like_val = f"%{query.strip()}%"
            leads_sql = """
                SELECT id, first_name, last_name, email, phone, career, address, entered_date
                FROM leads
                WHERE phone ILIKE %s 
                   OR email ILIKE %s 
                   OR unaccent(first_name) ILIKE unaccent(%s)
                   OR unaccent(last_name) ILIKE unaccent(%s)
                   OR unaccent(first_name || ' ' || last_name) ILIKE unaccent(%s)
                   OR unaccent(last_name || ' ' || first_name) ILIKE unaccent(%s)
                ORDER BY entered_date DESC
                LIMIT %s
            """
            leads = query_all(leads_sql, (like_val, like_val, like_val, like_val, like_val, like_val, limit))
        else:
            leads_sql = """
                SELECT id, first_name, last_name, email, phone, career, address, entered_date
                FROM leads
                ORDER BY entered_date DESC
                LIMIT %s
            """
            leads = query_all(leads_sql, (limit,))

        formatted_leads = []
        for l in leads:
            full_name = format_vietnamese_name(l.get("first_name", ""), l.get("last_name", ""))
            formatted_leads.append({
                "id": l["id"],
                "ho_va_ten": full_name,
                "so_dien_thoai": l["phone"],
                "email": l["email"],
                "nghe_nghiep": l["career"] or "Chưa cập nhật",
                "dia_chi": l["address"] or "Chưa cập nhật",
                "ngay_nhap": l["entered_date"]
            })

        return {
            "tong_so_lead_toan_he_thong": total,
            "so_lead_moi_hom_nay": today_count,
            "so_lead_moi_thang_nay": month_count,
            "so_lead_tra_ve": len(formatted_leads),
            "danh_sach_lead": formatted_leads
        }
    except Exception as e:
        return {"error": f"Lỗi khi tra cứu danh sách Lead: {str(e)}"}


def get_revenue_and_forecast(year: int = None, month: int = None) -> dict:
    """
    Tra cứu báo cáo doanh số thực tế và tiến độ hoàn thành chỉ tiêu kế hoạch (Sales Forecast).
    - year: Năm tài chính (mặc định là năm hiện tại 2026).
    - month: Tháng (1-12, mặc định là tháng hiện tại).
    Trả về doanh thu thực tế, số đơn hàng thành công, chỉ tiêu kế hoạch, tỉ lệ đạt được và bảng tổng hợp 12 tháng.
    """
    try:
        now = datetime.now()
        target_year = year or now.year
        target_month = month or now.month

        # Doanh số thực tế từ đơn hàng COMPLETED trong tháng/năm đó
        orders_sql = """
            SELECT 
                COUNT(*) AS total_completed_orders,
                COALESCE(SUM(total_amount), 0) AS total_revenue
            FROM orders
            WHERE status = 'COMPLETED'
              AND EXTRACT(YEAR FROM order_date) = %s
              AND EXTRACT(MONTH FROM order_date) = %s
        """
        rev_data = query_one(orders_sql, (target_year, target_month)) or {"total_completed_orders": 0, "total_revenue": 0}

        # Doanh số cả năm
        year_orders_sql = """
            SELECT 
                COUNT(*) AS year_orders,
                COALESCE(SUM(total_amount), 0) AS year_revenue
            FROM orders
            WHERE status = 'COMPLETED'
              AND EXTRACT(YEAR FROM order_date) = %s
        """
        year_rev_data = query_one(year_orders_sql, (target_year,)) or {"year_orders": 0, "year_revenue": 0}

        # Chỉ tiêu từ bảng sale_forecasts
        plan_sql = """
            SELECT target_amount 
            FROM sale_forecasts 
            WHERE fiscal_year = %s AND month = %s
        """
        plan_data = query_one(plan_sql, (target_year, target_month))
        target_amount = plan_data["target_amount"] if plan_data else 0

        actual_month_rev = float(rev_data["total_revenue"])
        percent_achieved = round((actual_month_rev / target_amount * 100), 2) if target_amount > 0 else 0

        # Tổng hợp doanh số từng tháng trong năm để Gemini có bức tranh toàn cảnh
        monthly_summary_sql = """
            SELECT 
                EXTRACT(MONTH FROM order_date)::int AS month,
                COUNT(*) AS orders_count,
                COALESCE(SUM(total_amount), 0) AS revenue
            FROM orders
            WHERE status = 'COMPLETED'
              AND EXTRACT(YEAR FROM order_date) = %s
            GROUP BY EXTRACT(MONTH FROM order_date)
            ORDER BY month ASC
        """
        monthly_rows = query_all(monthly_summary_sql, (target_year,))
        monthly_breakdown = [
            {
                "thang": int(r["month"]),
                "so_don_thanh_cong": r["orders_count"],
                "doanh_thu_vnd": float(r["revenue"])
            }
            for r in monthly_rows
        ]

        return {
            "nam_tai_chinh": target_year,
            "thang": target_month,
            "doanh_thu_thang_thuc_te_vnd": actual_month_rev,
            "so_don_thanh_cong_thang": rev_data["total_completed_orders"],
            "chi_tieu_ke_hoach_thang_vnd": float(target_amount),
            "ti_le_hoan_thanh_ke_hoach_percent": percent_achieved,
            "doanh_thu_luy_ke_ca_nam_vnd": float(year_rev_data["year_revenue"]),
            "tong_so_don_ca_nam": year_rev_data["year_orders"],
            "bang_tong_hop_doanh_thu_cac_thang_nam": monthly_breakdown
        }
    except Exception as e:
        return {"error": f"Lỗi khi tra cứu doanh số: {str(e)}"}


def get_products_and_inventory(query: str = "", low_stock_only: bool = False, limit: int = 25) -> dict:
    """
    Tra cứu danh mục sản phẩm, đơn giá và số lượng tồn kho.
    - query: Tên sản phẩm, danh mục hoặc mã sản phẩm cần tìm (hỗ trợ tiếng Việt có dấu và không dấu).
    - low_stock_only: Chỉ hiển thị các sản phẩm sắp hết hàng (tồn kho <= 5).
    - limit: Số lượng sản phẩm hiển thị (mặc định 25).
    """
    try:
        # Tổng số sản phẩm toàn hệ thống
        total_products_res = query_one("SELECT COUNT(*) AS total FROM products")
        total_products = total_products_res["total"] if total_products_res else 0

        # Số sản phẩm cảnh báo tồn kho thấp (<= 5)
        low_stock_count = query_one("SELECT COUNT(*) AS cnt FROM products WHERE stock_qty <= 5")
        low_count = low_stock_count["cnt"] if low_stock_count else 0

        where_clauses = []
        params = []

        if query.strip():
            where_clauses.append("(unaccent(p.name) ILIKE unaccent(%s) OR p.product_code ILIKE %s OR unaccent(c.name) ILIKE unaccent(%s))")
            like_val = f"%{query.strip()}%"
            params.extend([like_val, like_val, like_val])

        if low_stock_only:
            where_clauses.append("p.stock_qty <= 5")

        where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

        sql = f"""
            SELECT 
                p.id, 
                p.product_code, 
                p.name, 
                c.name AS category_name,
                p.unit_price, 
                p.stock_qty
            FROM products p
            LEFT JOIN product_categories c ON p.category_id = c.id
            {where_sql}
            ORDER BY p.stock_qty ASC, p.name ASC
            LIMIT %s
        """
        params.append(limit)
        rows = query_all(sql, tuple(params))

        items = []
        for r in rows:
            items.append({
                "id": r["id"],
                "ma_san_pham": r["product_code"],
                "ten_san_pham": r["name"],
                "danh_muc": r["category_name"] or "Khác",
                "don_gia_vnd": float(r["unit_price"]),
                "so_luong_ton_kho": r["stock_qty"],
                "canh_bao": "Sắp hết hàng!" if r["stock_qty"] <= 5 else "Bình thường"
            })

        return {
            "tong_so_san_pham_toan_he_thong": total_products,
            "so_san_pham_khop_tim_kiem": len(items),
            "so_san_pham_canh_bao_het_hang": low_count,
            "danh_sach_san_pham": items
        }
    except Exception as e:
        return {"error": f"Lỗi khi tra cứu sản phẩm: {str(e)}"}


def get_opportunities_overview() -> dict:
    """
    Tra cứu tổng quan về Cơ hội bán hàng (Opportunities).
    Bao gồm phân bố theo từng giai đoạn (NEW, CONTACTED, QUALIFIED, PROPOSAL, ORDERED, LOST)
    và danh sách các cơ hội bán hàng có giá trị lớn nhất hiện có.
    """
    try:
        status_sql = """
            SELECT status, COUNT(*) AS count 
            FROM opportunities 
            GROUP BY status
        """
        status_rows = query_all(status_sql)
        pipeline = {r["status"]: r["count"] for r in status_rows}

        top_opps_sql = """
            SELECT 
                o.id,
                l.first_name, l.last_name, l.phone,
                p.name AS product_name,
                o.quantity,
                p.unit_price,
                (o.quantity * p.unit_price) AS estimated_value,
                o.status,
                o.expected_close_date
            FROM opportunities o
            JOIN leads l ON o.lead_id = l.id
            JOIN products p ON o.product_id = p.id
            WHERE o.status NOT IN ('ORDERED', 'LOST')
            ORDER BY estimated_value DESC
            LIMIT 6
        """
        top_rows = query_all(top_opps_sql)

        top_opps = []
        for r in top_rows:
            full_name = format_vietnamese_name(r.get("first_name", ""), r.get("last_name", ""))
            top_opps.append({
                "id": r["id"],
                "khach_hang": full_name,
                "so_dien_thoai": r["phone"],
                "san_pham": r["product_name"],
                "so_luong": r["quantity"],
                "gia_tri_du_kien_vnd": float(r["estimated_value"]),
                "trang_thai": r["status"],
                "ngay_du_kien_chot": str(r["expected_close_date"]) if r["expected_close_date"] else "Chưa rõ"
            })

        total_open_val_res = query_one("""
            SELECT COALESCE(SUM(o.quantity * p.unit_price), 0) AS total_val
            FROM opportunities o
            JOIN products p ON o.product_id = p.id
            WHERE o.status NOT IN ('ORDERED', 'LOST')
        """)
        total_open_val = float(total_open_val_res["total_val"]) if total_open_val_res else 0.0

        return {
            "phan_bo_theo_giai_doan": pipeline,
            "tong_so_co_hoi_dang_mo": sum(v for k, v in pipeline.items() if k not in ["ORDERED", "LOST"]),
            "tong_gia_tri_pipeline_dang_mo_vnd": total_open_val,
            "top_co_hoi_tiem_nang": top_opps
        }
    except Exception as e:
        return {"error": f"Lỗi khi tra cứu cơ hội bán hàng: {str(e)}"}


def get_campaigns_overview(query: str = "") -> dict:
    """
    Tra cứu danh sách các chiến dịch tiếp thị (Campaigns) đang diễn ra hoặc đã kết thúc,
    ngân sách và số lượng Lead thu thập được từ mỗi chiến dịch.
    - query: Tìm kiếm chiến dịch theo tên (tùy chọn).
    """
    try:
        where_sql = ""
        params = []
        if query.strip():
            where_sql = "WHERE unaccent(c.name) ILIKE unaccent(%s)"
            params.append(f"%{query.strip()}%")

        sql = f"""
            SELECT 
                c.id, 
                c.name, 
                c.budget, 
                c.start_date, 
                c.end_date,
                COUNT(l.id) AS leads_count
            FROM campaigns c
            LEFT JOIN leads l ON l.campaign_id = c.id
            {where_sql}
            GROUP BY c.id
            ORDER BY c.start_date DESC
            LIMIT 25
        """
        rows = query_all(sql, tuple(params))

        total_campaigns_res = query_one("SELECT COUNT(*) AS total FROM campaigns")
        total_campaigns = total_campaigns_res["total"] if total_campaigns_res else 0

        campaigns = []
        for r in rows:
            campaigns.append({
                "id": r["id"],
                "ten_chien_dich": r["name"],
                "ngan_sach_vnd": float(r["budget"]),
                "ngay_bat_dau": str(r["start_date"]),
                "ngay_ket_thuc": str(r["end_date"]),
                "so_lead_thu_thap_duoc": r["leads_count"]
            })
        return {
            "tong_so_chien_dich_he_thong": total_campaigns,
            "so_chien_dich_khop": len(campaigns),
            "danh_sach_chien_dich": campaigns
        }
    except Exception as e:
        return {"error": f"Lỗi khi tra cứu chiến dịch: {str(e)}"}


def get_orders_summary(limit: int = 10, query: str = "", status: str = "") -> dict:
    """
    Tra cứu danh sách các đơn hàng (Orders) trong hệ thống.
    - limit: Số lượng đơn hàng cần lấy (mặc định 10).
    - query: Tìm kiếm theo mã đơn (VD: 'ORD-20260115-0001'), tên khách hàng hoặc tên sản phẩm.
    - status: Lọc theo trạng thái đơn ('COMPLETED', 'PENDING', 'CANCELLED').
    Trả về tổng số đơn, tổng giá trị và chi tiết từng đơn hàng kèm tên sản phẩm, số lượng, ngày đặt.
    """
    try:
        where_clauses = []
        params = []

        if query.strip():
            where_clauses.append("""(
                o.order_code ILIKE %s
                OR unaccent(p.name) ILIKE unaccent(%s)
                OR p.product_code ILIKE %s
                OR unaccent(l.first_name || ' ' || l.last_name) ILIKE unaccent(%s)
                OR unaccent(l.last_name || ' ' || l.first_name) ILIKE unaccent(%s)
                OR l.phone ILIKE %s
            )""")
            like_val = f"%{query.strip()}%"
            params.extend([like_val, like_val, like_val, like_val, like_val, like_val])

        if status.strip():
            where_clauses.append("o.status = %s")
            params.append(status.strip().upper())

        where_sql = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

        count_sql = f"""
            SELECT 
                COUNT(*) AS total_orders,
                COALESCE(SUM(o.total_amount), 0) AS total_amount,
                COUNT(CASE WHEN o.status = 'COMPLETED' THEN 1 END) AS completed_orders
            FROM orders o
            JOIN leads l ON o.lead_id = l.id
            JOIN products p ON o.product_id = p.id
            {where_sql}
        """
        stats = query_one(count_sql, tuple(params)) or {"total_orders": 0, "total_amount": 0, "completed_orders": 0}

        orders_sql = f"""
            SELECT 
                o.id,
                o.order_code,
                l.first_name,
                l.last_name,
                l.phone,
                p.name AS product_name,
                p.product_code,
                o.quantity,
                o.unit_price,
                o.total_amount,
                o.order_date,
                o.payment_info,
                o.shipping_address,
                o.status
            FROM orders o
            JOIN leads l ON o.lead_id = l.id
            JOIN products p ON o.product_id = p.id
            {where_sql}
            ORDER BY o.order_date DESC
            LIMIT %s
        """
        params.append(limit)
        rows = query_all(orders_sql, tuple(params))

        orders_list = []
        for r in rows:
            full_name = format_vietnamese_name(r.get("first_name", ""), r.get("last_name", ""))
            orders_list.append({
                "id": r["id"],
                "ma_don": r["order_code"],
                "khach_hang": full_name,
                "so_dien_thoai": r["phone"],
                "san_pham": r["product_name"],
                "ma_san_pham": r["product_code"],
                "so_luong": r["quantity"],
                "don_gia_vnd": float(r["unit_price"]),
                "tong_tien_vnd": float(r["total_amount"]),
                "ngay_dat": str(r["order_date"]),
                "phuong_thuc_thanh_toan": r["payment_info"],
                "dia_chi_giao_hang": r["shipping_address"],
                "trang_thai": r["status"]
            })

        return {
            "tong_so_don_hang": stats["total_orders"],
            "tong_so_don_thanh_cong": stats["completed_orders"],
            "tong_gia_tri_vnd": float(stats["total_amount"]),
            "danh_sach_don_hang": orders_list
        }
    except Exception as e:
        return {"error": f"Lỗi khi tra cứu danh sách đơn hàng: {str(e)}"}


def search_customer(keyword: str) -> dict:
    """
    Tìm kiếm thông tin chi tiết một khách hàng cụ thể theo số điện thoại, email hoặc họ tên.
    Hỗ trợ tìm kiếm tiếng Việt có dấu hoặc không dấu, thứ tự họ tên tự nhiên.
    Trả về thông tin cá nhân cùng toàn bộ lịch sử các sản phẩm đã mua, đơn hàng và cơ hội bán hàng.
    """
    try:
        clean_keyword = keyword.strip()
        like_val = f"%{clean_keyword}%"

        lead_sql = """
            SELECT id, first_name, last_name, email, phone, career, address, entered_date
            FROM leads
            WHERE phone ILIKE %s 
               OR email ILIKE %s 
               OR unaccent(first_name) ILIKE unaccent(%s)
               OR unaccent(last_name) ILIKE unaccent(%s)
               OR unaccent(first_name || ' ' || last_name) ILIKE unaccent(%s)
               OR unaccent(last_name || ' ' || first_name) ILIKE unaccent(%s)
            ORDER BY entered_date DESC
            LIMIT 5
        """
        matching_leads = query_all(lead_sql, (like_val, like_val, like_val, like_val, like_val, like_val))
        if not matching_leads:
            return {"thong_bao": f"Không tìm thấy khách hàng nào khớp với từ khóa '{keyword}' trong cơ sở dữ liệu Zen CRM."}

        # Khách hàng phù hợp nhất
        primary_lead = matching_leads[0]
        lead_id = primary_lead["id"]
        full_name = format_vietnamese_name(primary_lead.get("first_name", ""), primary_lead.get("last_name", ""))

        # Lấy cơ hội bán hàng
        opps_sql = """
            SELECT 
                o.id, 
                p.name AS product_name, 
                p.product_code,
                o.quantity, 
                p.unit_price,
                (o.quantity * p.unit_price) AS estimated_val,
                o.status,
                o.expected_close_date
            FROM opportunities o
            JOIN products p ON o.product_id = p.id
            WHERE o.lead_id = %s
            ORDER BY o.created_at DESC
        """
        opps = query_all(opps_sql, (lead_id,))

        # Lấy đơn hàng và chi tiết sản phẩm đã mua
        orders_sql = """
            SELECT 
                o.id,
                o.order_code, 
                p.name AS product_name,
                p.product_code,
                o.quantity,
                o.unit_price,
                o.total_amount, 
                o.order_date, 
                o.status,
                o.payment_info,
                o.shipping_address
            FROM orders o
            JOIN products p ON o.product_id = p.id
            WHERE o.lead_id = %s
            ORDER BY o.order_date DESC
        """
        orders = query_all(orders_sql, (lead_id,))

        # Lấy nhật ký chăm sóc (follow-ups) gần nhất qua opportunities
        follow_ups_sql = """
            SELECT 
                f.follow_date,
                f.contact_method,
                f.content,
                f.customer_response,
                f.next_plan
            FROM follow_ups f
            JOIN opportunities o ON f.opportunity_id = o.id
            WHERE o.lead_id = %s
            ORDER BY f.follow_date DESC
            LIMIT 5
        """
        follow_ups = query_all(follow_ups_sql, (lead_id,))

        # Danh sách các khách hàng khác khớp từ khóa nếu có nhiều hơn 1
        other_matches = []
        if len(matching_leads) > 1:
            for other in matching_leads[1:]:
                other_matches.append({
                    "id": other["id"],
                    "ho_va_ten": format_vietnamese_name(other.get("first_name", ""), other.get("last_name", "")),
                    "so_dien_thoai": other["phone"],
                    "email": other["email"]
                })

        return {
            "khach_hang": {
                "id": primary_lead["id"],
                "ho_va_ten": full_name,
                "email": primary_lead["email"],
                "so_dien_thoai": primary_lead["phone"],
                "dia_chi": primary_lead["address"] or "Chưa cập nhật",
                "nghe_nghiep": primary_lead["career"] or "Chưa cập nhật",
                "ngay_nhap_crm": str(primary_lead["entered_date"])
            },
            "tong_so_don_da_mua": len(orders),
            "tong_chi_tieu_vnd": sum(float(od["total_amount"]) for od in orders if od["status"] == "COMPLETED"),
            "chi_tiet_don_hang_va_san_pham_da_mua": [
                {
                    "ma_don_hang": od["order_code"],
                    "san_pham": od["product_name"],
                    "ma_san_pham": od["product_code"],
                    "so_luong": od["quantity"],
                    "don_gia_vnd": float(od["unit_price"]),
                    "tong_tien_vnd": float(od["total_amount"]),
                    "ngay_dat_hang": str(od["order_date"]),
                    "trang_thai": od["status"],
                    "phuong_thuc_thanh_toan": od["payment_info"],
                    "dia_chi_nhan": od["shipping_address"]
                }
                for od in orders
            ],
            "cac_co_hoi_ban_hang": [
                {
                    "id": op["id"],
                    "san_pham": op["product_name"],
                    "ma_san_pham": op["product_code"],
                    "so_luong": op["quantity"],
                    "gia_tri_du_kien_vnd": float(op["estimated_val"]),
                    "trang_thai": op["status"],
                    "ngay_du_kien_chot": str(op["expected_close_date"]) if op["expected_close_date"] else "Chưa rõ"
                }
                for op in opps
            ],
            "nhat_ky_cham_soc_gan_nhat": [
                {
                    "ngay_lien_he": str(fu["follow_date"]),
                    "hinh_thuc": fu["contact_method"],
                    "noi_dung": fu["content"],
                    "phan_hoi_khach": fu["customer_response"],
                    "ke_hoach_tiep_theo": fu["next_plan"]
                }
                for fu in follow_ups
            ],
            "cac_ket_qua_khop_khac": other_matches
        }
    except Exception as e:
        return {"error": f"Lỗi khi tra cứu khách hàng: {str(e)}"}


# =============================================================================
# DANH SÁCH BỘ CÔNG CỤ FUNCTION CALLING CUNG CẤP CHO GEMINI AI
# =============================================================================
# Gemini Engine sử dụng danh sách này để đăng ký các tool thời gian thực.
# Mỗi khi người dùng trò chuyện, Gemini sẽ tự động nhận diện ý định (Intent)
# và kích hoạt hàm tương ứng để truy vấn dữ liệu trực tiếp từ PostgreSQL.
ALL_CRM_TOOLS = [
    # 1. Tra cứu khách hàng tiềm năng: Tổng số lead, số lead mới hôm nay/tháng này và lọc tìm kiếm theo tên, SĐT, email
    get_leads_summary,

    # 2. Thống kê tài chính & KPI: Doanh thu thực tế, tiến độ hoàn thành chỉ tiêu kế hoạch và bảng phân rã doanh thu 12 tháng năm tài chính
    get_revenue_and_forecast,

    # 3. Quản lý kho & danh mục: Tra cứu toàn bộ danh mục sản phẩm, đơn giá, số lượng tồn kho thực tế và cảnh báo sắp hết hàng (<= 5)
    get_products_and_inventory,

    # 4. Quản lý phễu bán hàng (Pipeline): Phân bố cơ hội qua 6 giai đoạn (NEW, CONTACTED,...) và top deal giá trị lớn nhất
    get_opportunities_overview,

    # 5. Đánh giá chiến dịch tiếp thị: Danh sách chiến dịch marketing, ngân sách chi tiêu và hiệu quả số lượng lead thu được
    get_campaigns_overview,

    # 6. Quản trị đơn hàng: Tra cứu các đơn hàng gần nhất, tìm kiếm theo mã đơn (ORD-...), tên khách hàng hoặc sản phẩm
    get_orders_summary,

    # 7. Hồ sơ khách hàng 360 độ: Tra cứu chi tiết một khách hàng theo tên (hỗ trợ có dấu/không dấu), SĐT, email; bao gồm lịch sử mua hàng, sản phẩm đã mua, cơ hội và nhật ký chăm sóc
    search_customer,
]
