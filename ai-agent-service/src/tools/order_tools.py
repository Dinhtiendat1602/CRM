"""Công cụ cho Agent thực hiện thao tác tự động trên Cơ hội bán hàng & Đơn hàng qua Express REST API."""
import re
from typing import Optional, Dict, Any, Union
from datetime import datetime
from src.utils.normalizer import format_vietnamese_name, format_currency
from src.utils.context import get_current_user_context
from src.services.backend_client import backend_client

def parse_expected_date(date_str: Optional[str]) -> str:
    """Chuẩn hóa ngày dự kiến chốt về định dạng chuẩn YYYY-MM-DD trong năm hệ thống 2026."""
    if not date_str or not str(date_str).strip():
        return datetime.now().strftime("%Y-%m-%d")
    
    clean = str(date_str).strip()
    if re.match(r"^\d{4}-\d{2}-\d{2}$", clean):
        return clean
    
    m1 = re.match(r"^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$", clean)
    if m1:
        d, m, y = m1.groups()
        return f"{int(y):04d}-{int(m):02d}-{int(d):02d}"
    
    m2 = re.match(r"^(\d{1,2})[/\-](\d{1,2})$", clean)
    if m2:
        d, m = m2.groups()
        return f"2026-{int(m):02d}-{int(d):02d}"
    
    return datetime.now().strftime("%Y-%m-%d")

def parse_quantity(qty_val: Any) -> int:
    """Trích xuất số lượng nguyên dương từ giá trị đầu vào."""
    if isinstance(qty_val, int):
        return max(1, qty_val)
    if isinstance(qty_val, (float, str)):
        m = re.search(r"\d+", str(qty_val))
        if m:
            return max(1, int(m.group(0)))
    return 1

def create_opportunity(
    lead_id: Optional[Union[int, str]] = None,
    product_identifier: Optional[str] = None,
    expected_quantity: Any = 1,
    expected_close_date: Optional[str] = None,
    customer_name_or_phone: Optional[str] = None,
    notes: Optional[str] = None
) -> dict:
    """
    Tự động tạo Cơ hội bán hàng mới (Opportunity) và khớp sản phẩm trong kho thông qua Express REST API.
    - lead_id: ID (số) hoặc Tên / SĐT của khách hàng tiềm năng.
    - product_identifier: Tên hoặc mã sản phẩm cần mua (VD: 'LIVE-KIT-STUDIO', 'Kit Livestream Pro 4K').
    - expected_quantity: Số lượng dự kiến mua (mặc định 1).
    - expected_close_date: Ngày dự kiến chốt hợp đồng (VD: '2026-11-20', '20/11').
    - customer_name_or_phone: Họ tên hoặc số điện thoại khách hàng (nếu không có lead_id).
    - notes: Ghi chú thêm cho cơ hội bán hàng.
    
    Hàm gọi Express REST API /api/opportunities:
    - Express tự động kiểm tra quyền phân phối sản phẩm trong salesman_products nếu là Salesman (403 Forbidden nếu chưa được gán).
    - Tự động kiểm tra khách hàng có thuộc quyền phụ trách của Salesman hay không.
    - Kiểm tra chống trùng lặp cơ hội chưa đóng cho cặp Lead-Product (BR-02, HTTP 409 Conflict).
    """
    user = get_current_user_context()
    if user.get("role") == "ADMIN":
        return {"error": "Từ chối thao tác: Vai trò Quản trị viên (ADMIN) không được phép tạo hoặc chỉnh sửa cơ hội bán hàng CRM."}

    is_salesman = (user.get("role") == "SALESMAN")
    user_id = user.get("id")

    try:
        # 1. Xác định Lead ID và lấy thông tin khách hàng
        target_lead_id = None
        lead_name = ""

        # Kiểm tra nếu lead_id là số nguyên hoặc chuỗi số
        if lead_id is not None and (isinstance(lead_id, int) or (isinstance(lead_id, str) and lead_id.strip().isdigit())):
            target_lead_id = int(lead_id)
        else:
            # Tìm kiếm khách hàng theo tên hoặc số điện thoại
            query_cust = str(customer_name_or_phone or lead_id or "").strip()
            # Bỏ các tiền tố xưng hô tiếng Việt thông dụng
            for prefix in ["anh ", "chị ", "bác ", "ông ", "bà ", "khách ", "khách hàng "]:
                if query_cust.lower().startswith(prefix):
                    query_cust = query_cust[len(prefix):].strip()

            if not query_cust:
                return {"error": "Vui lòng cung cấp ID khách hàng (lead_id) hoặc Tên / SĐT của khách hàng để tạo cơ hội."}

            leads_res = backend_client.get("/leads", params={"search": query_cust, "limit": 10})
            leads_list = leads_res.get("data") or leads_res.get("leads") or []
            if not leads_list:
                return {"error": f"Không tìm thấy khách hàng tiềm năng nào có tên hoặc SĐT '{query_cust}'. Vui lòng thêm khách hàng mới trước hoặc kiểm tra lại thông tin."}

            # Nếu là Salesman, ưu tiên chọn lead do chính mình phụ trách
            if is_salesman and user_id:
                my_leads = [l for l in leads_list if l.get("assigned_to") == user_id]
                target_lead = my_leads[0] if my_leads else leads_list[0]
            else:
                target_lead = leads_list[0]

            target_lead_id = target_lead["id"]
            lead_name = target_lead.get("full_name") or format_vietnamese_name(target_lead.get("first_name", ""), target_lead.get("last_name", ""))

        # Xác thực lại thông tin khách hàng qua GET /api/leads/:id
        lead_res = backend_client.get(f"/leads/{target_lead_id}")
        if "error" in lead_res or not lead_res.get("success"):
            return {"error": f"Không tìm thấy khách hàng tiềm năng với ID #{target_lead_id} trong hệ thống."}

        lead_data = lead_res.get("data", {})
        if is_salesman and lead_data.get("assigned_to") != user_id:
            return {"error": f"Quyền truy cập bị từ chối: Khách hàng #{target_lead_id} ({lead_data.get('full_name')}) không do bạn phụ trách. Bạn chỉ có thể tạo cơ hội cho khách hàng của mình."}

        if not lead_name:
            lead_name = lead_data.get("full_name") or format_vietnamese_name(lead_data.get("first_name", ""), lead_data.get("last_name", ""))

        # 2. Khớp sản phẩm qua Express API GET /api/products
        clean_prod_id = (product_identifier or "").strip()
        if not clean_prod_id:
            return {"error": "Vui lòng cung cấp Tên hoặc Mã sản phẩm cần tạo cơ hội."}

        prod_res = backend_client.get("/products", params={"search": clean_prod_id, "limit": 20})
        products = prod_res.get("products") or prod_res.get("data") or []

        # Nếu tìm kiếm trực tiếp không thấy, tìm kiếm mở rộng trong danh mục
        if not products:
            all_prods_res = backend_client.get("/products", params={"limit": 50})
            all_prods = all_prods_res.get("products") or all_prods_res.get("data") or []
            q_lower = clean_prod_id.lower()
            matched = [p for p in all_prods if q_lower in p.get("name", "").lower() or q_lower in p.get("product_code", "").lower()]
            if not matched:
                words = [w for w in q_lower.split() if len(w) > 2]
                if words:
                    matched = [p for p in all_prods if any(w in p.get("name", "").lower() for w in words)]
            products = matched

        if not products:
            return {"error": f"Không tìm thấy sản phẩm phù hợp với từ khóa '{product_identifier}' trong hệ thống."}

        # Tìm sản phẩm khớp mã chính xác hoặc tên
        target_product = products[0]
        for p in products:
            if p.get("product_code", "").upper() == clean_prod_id.upper() or p.get("name", "").lower() == clean_prod_id.lower():
                target_product = p
                break

        product_id = target_product["id"]
        product_name = target_product.get("name", "")
        product_code = target_product.get("product_code", "")
        unit_price = float(target_product.get("unit_price", 0))

        qty = parse_quantity(expected_quantity)
        close_date = parse_expected_date(expected_close_date)
        est_revenue = unit_price * qty

        # 3. Tạo cơ hội qua Express API POST /api/opportunities
        payload: Dict[str, Any] = {
            "lead_id": target_lead_id,
            "product_id": product_id,
            "quantity": qty,
            "expected_close_date": close_date,
            "status": "NEW",
            "notes": (notes or "").strip() or f"Tự động tạo bởi Zen AI Assistant cho khách {lead_name}"
        }

        opp_res = backend_client.post("/opportunities", json=payload)

        # Xử lý trường hợp trùng lặp BR-02 (HTTP 409 Conflict)
        if opp_res.get("status") == "duplicate_rejected":
            exist_id = opp_res.get("existing_opportunity_id") or opp_res.get("existing_data") or ""
            return {
                "success": False,
                "status": "duplicate_rejected",
                "message": f"Quy chuẩn BR-02 từ chối: Khách hàng '{lead_name}' đã có một cơ hội bán hàng đang xử lý đối với sản phẩm '{product_name}' (Mã cơ hội #{exist_id}).",
                "existing_opportunity_id": exist_id,
                "lead_name": lead_name,
                "product_name": product_name
            }

        if "error" in opp_res:
            return opp_res

        if not opp_res.get("success"):
            return {"error": opp_res.get("message", "Không thể tạo cơ hội bán hàng qua Express API.")}

        new_opp = opp_res.get("data", {})
        opp_id = new_opp.get("id")

        return {
            "success": True,
            "status": "created",
            "message": f"Đã tạo thành công cơ hội bán hàng mới #{opp_id} cho khách hàng {lead_name}.",
            "opportunity": {
                "id": opp_id,
                "lead_id": target_lead_id,
                "khach_hang": lead_name,
                "product_id": product_id,
                "san_pham": f"{product_name} ({product_code})",
                "so_luong_du_kien": qty,
                "don_gia_niem_yet": format_currency(unit_price),
                "doanh_thu_du_kien": format_currency(est_revenue),
                "doanh_thu_du_kien_so": est_revenue,
                "ngay_du_kien_chot": close_date,
                "giai_doan": "NEW (Mới tiếp cận)",
                "nguoi_tao": user.get("full_name") or user.get("username")
            },
            "next_suggested_actions": [
                f"Ghi nhật ký chăm sóc (Follow-up) liên hệ với {lead_name}",
                f"Gửi báo giá sản phẩm {product_name} cho khách hàng",
                f"Chốt đơn hàng khi khách hàng đồng ý thanh toán"
            ]
        }
    except Exception as e:
        return {"error": f"Lỗi ngoại lệ khi tạo cơ hội bán hàng qua API: {str(e)}"}

ORDER_ACTION_TOOLS = [create_opportunity]
