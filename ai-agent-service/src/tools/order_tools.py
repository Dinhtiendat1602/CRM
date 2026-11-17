"""Công cụ cho Agent thực hiện thao tác tự động trên Cơ hội bán hàng & Đơn hàng."""
from typing import Optional
from datetime import datetime
from src.database.connection import query_one, get_db_connection
from src.utils.normalizer import format_vietnamese_name, format_currency
from src.utils.context import get_current_user_context

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
    
    Đối với Salesman: Chỉ tạo được cho khách hàng mình phụ trách và sản phẩm mình được phân quyền bán.
    """
    user = get_current_user_context()
    if user.get("role") == "ADMIN":
        return {"error": "Từ chối thao tác: Vai trò Quản trị viên (ADMIN) không được phép tạo hoặc chỉnh sửa cơ hội bán hàng CRM."}

    is_salesman = (user.get("role") == "SALESMAN")
    user_id = user.get("id")

    try:
        # 1. Kiểm tra Lead tồn tại & kiểm tra phân quyền khách hàng
        lead = query_one("SELECT id, first_name, last_name, assigned_to FROM leads WHERE id = %s", (lead_id,))
        if not lead:
            return {"error": f"Không tìm thấy khách hàng tiềm năng với ID #{lead_id}"}
        
        if is_salesman and lead.get("assigned_to") != user_id:
            return {"error": f"Quyền truy cập bị từ chối: Khách hàng #{lead_id} không do bạn phụ trách. Bạn chỉ có thể tạo cơ hội cho khách hàng của mình."}

        lead_name = format_vietnamese_name(lead.get("first_name", ""), lead.get("last_name", ""))

        # 2. Khớp sản phẩm theo mã hoặc tên
        prod_sql = """
            SELECT id, product_code, name, unit_price, stock_qty
            FROM products
            WHERE product_code ILIKE %s OR unaccent(name) ILIKE unaccent(%s)
            LIMIT 1
        """
        like_p = f"%{product_identifier.strip()}%"
        product = query_one(prod_sql, (like_p, like_p))
        if not product:
            return {"error": f"Không tìm thấy sản phẩm phù hợp với từ khóa '{product_identifier}' trong hệ thống."}

        # 3. Đối với Salesman: Kiểm tra quyền bán sản phẩm qua salesman_products
        if is_salesman:
            sp_check = query_one(
                "SELECT 1 FROM salesman_products WHERE user_id = %s AND product_id = %s",
                (user_id, product["id"])
            )
            if not sp_check:
                return {
                    "error": f"Quyền truy cập bị từ chối: Bạn chưa được phân quyền bán sản phẩm '{product['name']}' ({product['product_code']}). Vui lòng liên hệ Quản lý kinh doanh để được gán sản phẩm."
                }

        unit_price = float(product["unit_price"])
        qty = max(1, expected_quantity)
        est_revenue = unit_price * qty
        close_date = expected_close_date or datetime.now().strftime("%Y-%m-%d")
        created_by = user_id if is_salesman else (user.get("id") or None)

        # 4. Insert cơ hội mới vào CSDL
        insert_sql = """
            INSERT INTO opportunities (lead_id, product_id, quantity, expected_close_date, status, created_by, created_at)
            VALUES (%s, %s, %s, %s, 'NEW', %s, NOW())
            RETURNING id;
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(insert_sql, (lead_id, product["id"], qty, close_date, created_by))
                opp_id = cur.fetchone()[0]
                conn.commit()

        return {
            "success": True,
            "status": "created",
            "message": f"Đã tạo cơ hội bán hàng mới #{opp_id} cho khách hàng {lead_name}.",
            "opportunity": {
                "id": opp_id,
                "khach_hang": lead_name,
                "san_pham": f"{product['name']} ({product['product_code']})",
                "so_luong_du_kien": qty,
                "don_gia_niem_yet": format_currency(unit_price),
                "doanh_thu_du_kien": format_currency(est_revenue),
                "ngay_du_kien_chot": close_date,
                "giai_doan": "NEW (Mới tiếp cận)",
                "nguoi_tao": user.get("full_name") or user.get("username")
            }
        }
    except Exception as e:
        return {"error": f"Lỗi cơ sở dữ liệu khi tạo cơ hội bán hàng: {str(e)}"}

ORDER_ACTION_TOOLS = [create_opportunity]


