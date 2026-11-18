"""Công cụ cho Agent thực hiện thao tác tự động trên Cơ hội bán hàng & Đơn hàng qua Express REST API."""
from typing import Optional, Dict, Any
from datetime import datetime
from src.utils.normalizer import format_vietnamese_name, format_currency
from src.utils.context import get_current_user_context
from src.services.backend_client import backend_client

def create_opportunity(
    lead_id: int,
    product_identifier: str,
    expected_quantity: int = 1,
    expected_close_date: Optional[str] = None
) -> dict:
    """
    Tự động tạo Cơ hội bán hàng mới (Opportunity) và khớp sản phẩm trong kho thông qua Express REST API.
    - lead_id: ID của khách hàng tiềm năng.
    - product_identifier: Tên hoặc mã sản phẩm (VD: 'PROD-001', 'Kit Livestream').
    - expected_quantity: Số lượng dự kiến mua (mặc định 1).
    - expected_close_date: Ngày dự kiến chốt hợp đồng (định dạng YYYY-MM-DD).
    
    Hàm gọi Express REST API /api/opportunities:
    - Express tự động kiểm tra quyền phân phối sản phẩm trong salesman_products nếu là Salesman (403 Forbidden nếu chưa được gán).
    - Tự động kiểm tra khách hàng có thuộc quyền phụ trách của Salesman hay không.
    """
    user = get_current_user_context()
    if user.get("role") == "ADMIN":
        return {"error": "Từ chối thao tác: Vai trò Quản trị viên (ADMIN) không được phép tạo hoặc chỉnh sửa cơ hội bán hàng CRM."}

    is_salesman = (user.get("role") == "SALESMAN")
    user_id = user.get("id")

    try:
        # 1. Kiểm tra Lead tồn tại & kiểm tra phân quyền khách hàng qua GET /api/leads/:id
        lead_res = backend_client.get(f"/leads/{lead_id}")
        if "error" in lead_res or not lead_res.get("success"):
            return {"error": f"Không tìm thấy khách hàng tiềm năng với ID #{lead_id}"}
        
        lead_data = lead_res.get("data", {})
        if is_salesman and lead_data.get("assigned_to") != user_id:
            return {"error": f"Quyền truy cập bị từ chối: Khách hàng #{lead_id} không do bạn phụ trách. Bạn chỉ có thể tạo cơ hội cho khách hàng của mình."}

        lead_name = lead_data.get("full_name") or format_vietnamese_name(lead_data.get("first_name", ""), lead_data.get("last_name", ""))

        # 2. Khớp sản phẩm qua Express API GET /api/products
        clean_prod_id = (product_identifier or "").strip()
        prod_res = backend_client.get("/products", params={"search": clean_prod_id, "limit": 10})
        if "error" in prod_res:
            return prod_res
        
        products = prod_res.get("products") or prod_res.get("data") or []
        if not products:
            return {"error": f"Không tìm thấy sản phẩm phù hợp với từ khóa '{product_identifier}' trong hệ thống."}

        # Tìm sản phẩm khớp mã chính xác hoặc phần tử đầu tiên
        target_product = products[0]
        for p in products:
            if p.get("product_code", "").upper() == clean_prod_id.upper():
                target_product = p
                break

        product_id = target_product["id"]
        product_name = target_product.get("name", "")
        product_code = target_product.get("product_code", "")
        unit_price = float(target_product.get("unit_price", 0))

        qty = max(1, expected_quantity)
        close_date = expected_close_date or datetime.now().strftime("%Y-%m-%d")

        # 3. Tạo cơ hội qua Express API POST /api/opportunities
        # Express Backend sẽ tự động kiểm tra bảng salesman_products đối với SALESMAN và trả về 403 nếu chưa được phân quyền
        payload: Dict[str, Any] = {
            "lead_id": lead_id,
            "product_id": product_id,
            "quantity": qty,
            "expected_close_date": close_date,
            "status": "NEW"
        }

        opp_res = backend_client.post("/opportunities", json=payload)
        if "error" in opp_res:
            return opp_res

        if not opp_res.get("success"):
            return {"error": opp_res.get("message", "Không thể tạo cơ hội bán hàng qua Express API.")}

        new_opp = opp_res.get("data", {})
        opp_id = new_opp.get("id")
        est_revenue = unit_price * qty

        return {
            "success": True,
            "status": "created",
            "message": f"Đã tạo cơ hội bán hàng mới #{opp_id} cho khách hàng {lead_name}.",
            "opportunity": {
                "id": opp_id,
                "khach_hang": lead_name,
                "san_pham": f"{product_name} ({product_code})",
                "so_luong_du_kien": qty,
                "don_gia_niem_yet": format_currency(unit_price),
                "doanh_thu_du_kien": format_currency(est_revenue),
                "ngay_du_kien_chot": close_date,
                "giai_doan": "NEW (Mới tiếp cận)",
                "nguoi_tao": user.get("full_name") or user.get("username")
            }
        }
    except Exception as e:
        return {"error": f"Lỗi ngoại lệ khi tạo cơ hội bán hàng qua API: {str(e)}"}

ORDER_ACTION_TOOLS = [create_opportunity]
