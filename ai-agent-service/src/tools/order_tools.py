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

def log_follow_up(
    opportunity_id: Optional[Union[int, str]] = None,
    customer_name_or_phone: Optional[str] = None,
    contact_method: Optional[str] = "PHONE",
    content: Optional[str] = None,
    customer_response: Optional[str] = None,
    next_plan: Optional[str] = None,
    new_status: Optional[str] = None
) -> dict:
    """
    Tự động ghi nhật ký chăm sóc khách hàng (Follow-up) và cập nhật trạng thái Pipeline cơ hội bán hàng qua Express REST API.
    - opportunity_id: ID (số) của cơ hội bán hàng (VD: 194, '#194').
    - customer_name_or_phone: Họ tên hoặc SĐT khách hàng nếu không nhớ ID cơ hội (VD: 'anh Nam', '0987112233').
    - contact_method: Hình thức liên hệ: 'PHONE' (gọi điện), 'EMAIL' (gửi thư), 'MEETING' (gặp trực tiếp), 'ZALO' (nhắn tin Zalo/chat).
    - content: Nội dung cuộc trao đổi / tương tác (bắt buộc).
    - customer_response: Phản hồi, thái độ hoặc yêu cầu của khách hàng (VD: 'Khách hào hứng xin báo giá').
    - next_plan: Kế hoạch hành động tiếp theo (VD: 'Ngày mai gửi báo giá qua Zalo').
    - new_status: Trạng thái cơ hội mới nếu muốn chuyển đổi ('CONTACTED', 'QUALIFIED', 'PROPOSAL', v.v.). Mặc định nếu cơ hội đang là NEW thì hệ thống tự động chuyển sang CONTACTED theo SRS 3.11.
    """
    user = get_current_user_context()
    if user.get("role") == "ADMIN":
        return {"error": "Từ chối thao tác: Vai trò Quản trị viên (ADMIN) không được phép ghi nhật ký chăm sóc cơ hội CRM."}

    is_salesman = (user.get("role") == "SALESMAN")
    user_id = user.get("id")

    try:
        # 1. Xác định target opportunity ID
        target_opp_id = None
        opp_info: Optional[Dict[str, Any]] = None

        # Kiểm tra nếu opportunity_id là số nguyên hoặc chuỗi số
        if opportunity_id is not None:
            clean_opp_str = str(opportunity_id).strip().lstrip("#")
            if clean_opp_str.isdigit():
                target_opp_id = int(clean_opp_str)

        if not target_opp_id:
            # Tra cứu cơ hội theo tên hoặc SĐT khách hàng
            query_cust = str(customer_name_or_phone or (opportunity_id if opportunity_id is not None else "") or "").strip()
            # Bỏ tiền tố xưng hô tiếng Việt thông dụng
            for prefix in ["anh ", "chị ", "bác ", "ông ", "bà ", "khách ", "khách hàng "]:
                if query_cust.lower().startswith(prefix):
                    query_cust = query_cust[len(prefix):].strip()

            if not query_cust:
                return {"error": "Vui lòng cung cấp Mã cơ hội (opportunity_id) hoặc Tên / SĐT của khách hàng để ghi nhật ký chăm sóc."}

            opps_res = backend_client.get("/opportunities", params={"search": query_cust, "limit": 10})
            opps_list = opps_res.get("data") or opps_res.get("opportunities") or []

            # Nếu không tìm thấy bằng search cơ hội, thử tìm lead rồi lấy cơ hội
            if not opps_list:
                leads_res = backend_client.get("/leads", params={"search": query_cust, "limit": 5})
                leads = leads_res.get("data") or leads_res.get("leads") or []
                if leads:
                    lead_id = leads[0].get("id")
                    opps_by_lead = backend_client.get("/opportunities", params={"lead_id": lead_id, "limit": 10})
                    opps_list = opps_by_lead.get("data") or opps_by_lead.get("opportunities") or []

            if not opps_list:
                return {"error": f"Không tìm thấy cơ hội bán hàng nào của khách hàng '{query_cust}'. Vui lòng tạo cơ hội bán hàng mới trước."}

            # Lọc theo nhân viên nếu là Salesman
            if is_salesman and user_id:
                my_opps = [o for o in opps_list if o.get("created_by") == user_id]
                filtered_opps = my_opps if my_opps else opps_list
            else:
                filtered_opps = opps_list

            # Ưu tiên các cơ hội đang mở (NEW, CONTACTED, QUALIFIED, PROPOSAL)
            active_opps = [o for o in filtered_opps if o.get("status") in ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL"]]
            chosen_opp = active_opps[0] if active_opps else filtered_opps[0]

            target_opp_id = chosen_opp["id"]
            opp_info = chosen_opp

        # 2. Lấy thông tin chi tiết cơ hội qua GET /api/opportunities/:id
        detail_res = backend_client.get(f"/opportunities/{target_opp_id}")
        if "error" in detail_res or not detail_res.get("success"):
            return {"error": f"Không tìm thấy cơ hội bán hàng #{target_opp_id} trong hệ thống."}

        current_opp = detail_res.get("data", {})
        if is_salesman and user_id and current_opp.get("created_by") != user_id:
            # Cho phép nếu lead_id thuộc quyền phụ trách của salesman
            lead_check = current_opp.get("lead_id")
            if lead_check:
                lead_data = backend_client.get(f"/leads/{lead_check}").get("data", {})
                if lead_data.get("assigned_to") != user_id:
                    return {"error": f"Quyền truy cập bị từ chối: Cơ hội bán hàng #{target_opp_id} không thuộc quyền phụ trách của bạn."}

        cust_name = current_opp.get("lead_name") or (opp_info.get("lead_name") if opp_info else f"Khách hàng #{current_opp.get('lead_id')}")
        prod_name = current_opp.get("product_name") or (opp_info.get("product_name") if opp_info else "Sản phẩm")
        current_status = current_opp.get("status", "NEW")

        # 3. Chuẩn hóa hình thức liên hệ (contact_method)
        raw_method = str(contact_method or "PHONE").upper().strip()
        if any(w in raw_method for w in ["GẶP", "TRỰC TIẾP", "MEET", "FACE", "CAFE", "VĂN PHÒNG"]):
            clean_method = "MEETING"
        elif any(w in raw_method for w in ["MAIL", "THƯ", "GMAIL"]):
            clean_method = "EMAIL"
        elif any(w in raw_method for w in ["ZALO", "CHAT", "TIN NHẮN", "SMS"]):
            clean_method = "ZALO"
        else:
            clean_method = "PHONE"

        # 4. Chuẩn hóa nội dung chăm sóc (content là bắt buộc theo SRS 3.11.3 REQ-1)
        clean_content = str(content or "").strip()
        if not clean_content:
            parts = []
            if customer_response and str(customer_response).strip():
                parts.append(f"Phản hồi khách: {str(customer_response).strip()}")
            if next_plan and str(next_plan).strip():
                parts.append(f"Kế hoạch: {str(next_plan).strip()}")
            if parts:
                clean_content = f"Liên hệ chăm sóc khách hàng qua {clean_method}. " + ". ".join(parts)
            else:
                clean_content = f"Trao đổi chăm sóc khách hàng qua {clean_method} về sản phẩm {prod_name}."

        # 5. Chuẩn hóa trạng thái mới (new_status)
        valid_statuses = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "ORDERED", "LOST"]
        clean_new_status = None
        if new_status and str(new_status).strip().upper() in valid_statuses:
            clean_new_status = str(new_status).strip().upper()

        payload: Dict[str, Any] = {
            "contact_method": clean_method,
            "content": clean_content,
            "customer_response": str(customer_response).strip() if customer_response else None,
            "next_plan": str(next_plan).strip() if next_plan else None,
        }
        if clean_new_status:
            payload["new_status"] = clean_new_status

        # 6. Gửi POST sang Express Backend /api/opportunities/:id/follow-ups
        fu_res = backend_client.post(f"/opportunities/{target_opp_id}/follow-ups", json=payload)
        if "error" in fu_res:
            return fu_res

        if not fu_res.get("success"):
            return {"error": fu_res.get("message", "Không thể ghi nhận nhật ký chăm sóc qua Express API.")}

        created_fu = fu_res.get("data", {})
        final_status = fu_res.get("opportunity_status") or (clean_new_status or ("CONTACTED" if current_status == "NEW" else current_status))

        return {
            "success": True,
            "status": "follow_up_logged",
            "message": f"Đã ghi nhận nhật ký chăm sóc thành công cho cơ hội #{target_opp_id} ({cust_name} - {prod_name}). Trạng thái cơ hội hiện tại: {final_status}.",
            "follow_up": {
                "id": created_fu.get("id"),
                "opportunity_id": target_opp_id,
                "khach_hang": cust_name,
                "san_pham": prod_name,
                "hinh_thuc": clean_method,
                "noi_dung": clean_content,
                "phan_hoi_khach": customer_response or "Quan tâm tích cực",
                "ke_hoach_tiep_theo": next_plan or "Tiếp tục tư vấn và chăm sóc",
                "thoi_gian": created_fu.get("follow_date") or datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "trang_thai_truoc": current_status,
                "trang_thai_moi": final_status,
                "nguoi_thuc_hien": user.get("full_name") or user.get("username")
            },
            "next_suggested_actions": [
                f"Gửi báo giá sản phẩm {prod_name} cho {cust_name}",
                f"Thực hiện kế hoạch tiếp theo: {next_plan or 'Liên hệ lại'}",
                f"Chốt đơn hàng (feat-031) khi khách hàng đồng ý thanh toán"
            ]
        }
    except Exception as e:
        return {"error": f"Lỗi ngoại lệ khi ghi nhật ký chăm sóc qua API: {str(e)}"}

ORDER_ACTION_TOOLS = [create_opportunity, log_follow_up]
