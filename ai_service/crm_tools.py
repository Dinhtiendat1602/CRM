"""
Các công cụ tra cứu cơ sở dữ liệu Zen CRM dành cho Trợ lý AI Gemini (Function Calling).
Mỗi hàm đều có docstring rõ ràng và type hints để Gemini hiểu chính xác ngữ cảnh sử dụng.
"""

from datetime import datetime
from database import query_all, query_one

def get_leads_summary(limit: int = 5, query: str = "") -> dict:
    """
    Tra cứu tổng quan về Khách hàng tiềm năng (Leads).
    - limit: Số lượng lead gần đây nhất cần lấy (mặc định 5).
    - query: Tìm kiếm theo tên, số điện thoại hoặc email (tùy chọn).
    Trả về tổng số lead, số lead mới hôm nay, số lead tháng này và danh sách chi tiết.
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
                WHERE first_name ILIKE %s OR last_name ILIKE %s OR phone ILIKE %s OR email ILIKE %s
                ORDER BY entered_date DESC
                LIMIT %s
            """
            leads = query_all(leads_sql, (like_val, like_val, like_val, like_val, limit))
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
            full_name = f"{l['last_name']} {l['first_name']}".strip()
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
            "tong_so_lead": total,
            "so_lead_hom_nay": today_count,
            "so_lead_thang_nay": month_count,
            "danh_sach_lead": formatted_leads
        }
    except Exception as e:
        return {"error": f"Lỗi khi tra cứu danh sách Lead: {str(e)}"}


def get_revenue_and_forecast(year: int = None, month: int = None) -> dict:
    """
    Tra cứu báo cáo doanh số thực tế và tiến độ hoàn thành chỉ tiêu kế hoạch (Sales Forecast).
    - year: Năm tài chính (mặc định là năm hiện tại).
    - month: Tháng (1-12, mặc định là tháng hiện tại).
    Trả về doanh thu thực tế, số đơn hàng thành công, chỉ tiêu kế hoạch và tỉ lệ đạt được.
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

        return {
            "nam_tai_chinh": target_year,
            "thang": target_month,
            "doanh_thu_thang_thuc_te_vnd": actual_month_rev,
            "so_don_thanh_cong_thang": rev_data["total_completed_orders"],
            "chi_tieu_ke_hoach_thang_vnd": float(target_amount),
            "ti_le_hoan_thanh_ke_hoach_percent": percent_achieved,
            "doanh_thu_luy_ke_ca_nam_vnd": float(year_rev_data["year_revenue"]),
            "tong_so_don_ca_nam": year_rev_data["year_orders"]
        }
    except Exception as e:
        return {"error": f"Lỗi khi tra cứu doanh số: {str(e)}"}


def get_products_and_inventory(query: str = "", low_stock_only: bool = False) -> dict:
    """
    Tra cứu danh mục sản phẩm, đơn giá và số lượng tồn kho.
    - query: Tên sản phẩm hoặc mã sản phẩm cần tìm (tùy chọn).
    - low_stock_only: Chỉ hiển thị các sản phẩm sắp hết hàng (tồn kho <= 5).
    """
    try:
        where_clauses = []
        params = []

        if query.strip():
            where_clauses.append("(p.name ILIKE %s OR p.product_code ILIKE %s)")
            like_val = f"%{query.strip()}%"
            params.extend([like_val, like_val])

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
            LIMIT 15
        """
        rows = query_all(sql, tuple(params))

        # Đếm số sản phẩm cảnh báo tồn kho thấp (<= 5)
        low_stock_count = query_one("SELECT COUNT(*) AS cnt FROM products WHERE stock_qty <= 5")
        low_count = low_stock_count["cnt"] if low_stock_count else 0

        items = []
        for r in rows:
            items.append({
                "ma_san_pham": r["product_code"],
                "ten_san_pham": r["name"],
                "danh_muc": r["category_name"] or "Khác",
                "don_gia_vnd": float(r["unit_price"]),
                "so_luong_ton_kho": r["stock_qty"],
                "canh_bao": "Sắp hết hàng!" if r["stock_qty"] <= 5 else "Bình thường"
            })

        return {
            "tong_so_san_pham_tim_thay": len(items),
            "so_san_pham_canh_bao_het_hang": low_count,
            "danh_sach_san_pham": items
        }
    except Exception as e:
        return {"error": f"Lỗi khi tra cứu sản phẩm: {str(e)}"}


def get_opportunities_overview() -> dict:
    """
    Tra cứu tổng quan về Cơ hội bán hàng (Opportunities).
    Bao gồm phân bố theo từng giai đoạn (NEW, CONTACTED, QUALIFIED, PROPOSAL, ORDERED, LOST)
    và danh sách các cơ hội bán hàng lớn nhất hiện có.
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
            LIMIT 5
        """
        top_rows = query_all(top_opps_sql)

        top_opps = []
        for r in top_rows:
            full_name = f"{r['last_name']} {r['first_name']}".strip()
            top_opps.append({
                "id": r["id"],
                "khach_hang": full_name,
                "so_dien_thoai": r["phone"],
                "san_pham": r["product_name"],
                "so_luong": r["quantity"],
                "gia_tri_du_kien_vnd": float(r["estimated_value"]),
                "trang_thai": r["status"],
                "ngay_du_kien_chot": r["expected_close_date"] or "Chưa rõ"
            })

        return {
            "phan_bo_theo_giai_doan": pipeline,
            "tong_so_co_hoi_dang_mo": sum(v for k, v in pipeline.items() if k not in ["ORDERED", "LOST"]),
            "top_co_hoi_tiem_nang": top_opps
        }
    except Exception as e:
        return {"error": f"Lỗi khi tra cứu cơ hội bán hàng: {str(e)}"}


def get_campaigns_overview() -> dict:
    """
    Tra cứu danh sách các chiến dịch tiếp thị (Campaigns) đang diễn ra hoặc đã kết thúc,
    ngân sách và số lượng Lead thu thập được từ mỗi chiến dịch.
    """
    try:
        sql = """
            SELECT 
                c.id, 
                c.name, 
                c.budget, 
                c.start_date, 
                c.end_date,
                COUNT(l.id) AS leads_count
            FROM campaigns c
            LEFT JOIN leads l ON l.campaign_id = c.id
            GROUP BY c.id
            ORDER BY c.start_date DESC
            LIMIT 6
        """
        rows = query_all(sql)
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
        return {"danh_sach_chien_dich": campaigns}
    except Exception as e:
        return {"error": f"Lỗi khi tra cứu chiến dịch: {str(e)}"}


def search_customer(keyword: str) -> dict:
    """
    Tìm kiếm thông tin chi tiết một khách hàng cụ thể theo số điện thoại, email hoặc họ tên.
    Trả về thông tin cá nhân cùng toàn bộ lịch sử cơ hội bán hàng và đơn hàng của khách hàng này.
    """
    try:
        like_val = f"%{keyword.strip()}%"
        lead_sql = """
            SELECT id, first_name, last_name, email, phone, career, address, entered_date
            FROM leads
            WHERE phone ILIKE %s OR email ILIKE %s OR first_name ILIKE %s OR last_name ILIKE %s
            LIMIT 1
        """
        lead = query_one(lead_sql, (like_val, like_val, like_val, like_val))
        if not lead:
            return {"thong_bao": f"Không tìm thấy khách hàng nào khớp với từ khóa '{keyword}'."}

        lead_id = lead["id"]
        # Lấy cơ hội
        opps_sql = """
            SELECT o.id, p.name AS product_name, o.quantity, o.status, (o.quantity * p.unit_price) AS val
            FROM opportunities o
            JOIN products p ON o.product_id = p.id
            WHERE o.lead_id = %s
        """
        opps = query_all(opps_sql, (lead_id,))

        # Lấy đơn hàng
        orders_sql = """
            SELECT order_code, total_amount, order_date, status
            FROM orders
            WHERE lead_id = %s
        """
        orders = query_all(orders_sql, (lead_id,))

        return {
            "khach_hang": {
                "ho_va_ten": f"{lead['last_name']} {lead['first_name']}".strip(),
                "email": lead["email"],
                "so_dien_thoai": lead["phone"],
                "dia_chi": lead["address"] or "Chưa có",
                "nghe_nghiep": lead["career"] or "Chưa có",
                "ngay_tao": lead["entered_date"]
            },
            "cac_co_hoi_ban_hang": [
                {
                    "san_pham": op["product_name"],
                    "so_luong": op["quantity"],
                    "trang_thai": op["status"],
                    "gia_tri_vnd": float(op["val"])
                }
                for op in opps
            ],
            "lich_su_don_hang": [
                {
                    "ma_don": od["order_code"],
                    "tong_tien_vnd": float(od["total_amount"]),
                    "ngay_dat": od["order_date"],
                    "trang_thai": od["status"]
                }
                for od in orders
            ]
        }
    except Exception as e:
        return {"error": f"Lỗi khi tra cứu khách hàng: {str(e)}"}


# Danh sách các công cụ cung cấp cho Gemini
ALL_CRM_TOOLS = [
    get_leads_summary,
    get_revenue_and_forecast,
    get_products_and_inventory,
    get_opportunities_overview,
    get_campaigns_overview,
    search_customer,
]
