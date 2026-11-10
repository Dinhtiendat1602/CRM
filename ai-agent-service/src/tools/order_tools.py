"""Công cụ cho Agent thực hiện thao tác tự động trên Cơ hội bán hàng & Đơn hàng."""
from typing import Optional
from datetime import datetime
from src.database.connection import query_one, query_all, get_db_connection
from src.utils.normalizer import format_vietnamese_name, format_currency

def create_opportunity(
    lead_id: int,
    product_identifier: str,
    expected_quantity: int = 1,
    expected_close_date: Optional[str] = None
) -> dict:
    """
    Tự động tạo Cơ hội bán hàng mới (Opportunity) và khớp sản phẩm trong kho.
    - lead_id: ID của khách hàng tiềm năng.
    - product_identifier: Tên hoặc mã sản phẩm (VD: 'PROD-001', 'Kit Livestream').
    - expected_quantity: Số lượng dự kiến mua (mặc định 1).
    - expected_close_date: Ngày dự kiến chốt hợp đồng (định dạng YYYY-MM-DD).
    """
    try:
        # 1. Kiểm tra Lead tồn tại
        lead = query_one("SELECT id, first_name, last_name FROM leads WHERE id = %s", (lead_id,))
        if not lead:
            return {"error": f"Không tìm thấy khách hàng tiềm năng với ID #{lead_id}"}
        lead_name = format_vietnamese_name(lead.get("first_name", ""), lead.get("last_name", ""))

        # 2. Khớp sản phẩm theo mã hoặc tên
        prod_sql = """
            SELECT id, product_code, product_name, price, stock_quantity
            FROM products
            WHERE product_code ILIKE %s OR unaccent(product_name) ILIKE unaccent(%s)
            LIMIT 1
        """
        like_p = f"%{product_identifier.strip()}%"
        product = query_one(prod_sql, (like_p, like_p))
        if not product:
            return {"error": f"Không tìm thấy sản phẩm phù hợp với từ khóa '{product_identifier}' trong hệ thống."}

        unit_price = float(product["price"])
        qty = max(1, expected_quantity)
        est_revenue = unit_price * qty
        close_date = expected_close_date or datetime.now().strftime("%Y-%m-%d")

        # 3. Insert cơ hội mới
        insert_sql = """
            INSERT INTO opportunities (lead_id, product_id, expected_quantity, expected_close_date, stage, created_at)
            VALUES (%s, %s, %s, %s, 'NEW', NOW())
            RETURNING id;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(insert_sql, (lead_id, product["id"], qty, close_date))
                opp_id = cur.fetchone()[0]
                conn.commit()

        return {
            "success": True,
            "status": "created",
            "message": f"Đã tạo cơ hội bán hàng mới #{opp_id} cho khách hàng {lead_name}.",
            "opportunity": {
                "id": opp_id,
                "khach_hang": lead_name,
                "san_pham": f"{product['product_name']} ({product['product_code']})",
                "so_luong_du_kien": qty,
                "don_gia_niem_yet": format_currency(unit_price),
                "doanh_thu_du_kien": format_currency(est_revenue),
                "ngay_du_kien_chot": close_date,
                "giai_doan": "NEW (Mới tiếp cận)"
            }
        }
    except Exception as e:
        return {"error": f"Lỗi cơ sở dữ liệu khi tạo cơ hội bán hàng: {str(e)}"}

ORDER_ACTION_TOOLS = [create_opportunity]

