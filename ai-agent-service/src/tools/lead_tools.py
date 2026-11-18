"""Công cụ cho Agent thực hiện thao tác tự động trên Khách hàng tiềm năng (Leads) qua Express REST API."""
from typing import Optional, Dict, Any
from src.utils.normalizer import format_vietnamese_name, clean_phone
from src.utils.context import get_current_user_context
from src.services.backend_client import backend_client

def create_lead(
    first_name: str,
    last_name: str,
    phone: str,
    email: Optional[str] = None,
    career: Optional[str] = None,
    address: Optional[str] = None,
    campaign_id: Optional[int] = None
) -> dict:
    """
    Tự động thêm một Khách hàng tiềm năng (Lead) mới vào hệ thống Zen CRM thông qua Express REST API.
    - first_name: Tên của khách hàng (VD: 'Nam', 'Đức')
    - last_name: Họ và tên đệm (VD: 'Nguyễn Văn', 'Phan Cảnh')
    - phone: Số điện thoại (bắt buộc, chống trùng lặp theo quy chuẩn BR-02)
    - email: Email của khách hàng (tùy chọn, chống trùng lặp theo quy chuẩn BR-02)
    - career: Nghề nghiệp hoặc chức danh (VD: 'Kỹ sư', 'Kinh doanh')
    - address: Địa chỉ liên hệ (VD: '456 Trần Phú, Đà Nẵng')
    - campaign_id: ID chiến dịch tiếp thị mang lại khách này (tùy chọn)
    
    Hàm gọi Express REST API /api/leads, kiểm tra phân quyền RBAC và chống trùng SĐT/Email theo quy chuẩn BR-02.
    Đối với Salesman: Tự động gán khách hàng mới cho nhân viên đang đăng nhập.
    """
    user = get_current_user_context()
    if user.get("role") == "ADMIN":
        return {"error": "Từ chối thao tác: Vai trò Quản trị viên (ADMIN) không được phép tạo hoặc chỉnh sửa dữ liệu khách hàng CRM."}

    clean_p = clean_phone(phone)
    if not clean_p:
        return {"error": "Số điện thoại là bắt buộc và không được để trống."}
    
    fn = (first_name or "").strip()
    ln = (last_name or "").strip()
    if not fn and not ln:
        return {"error": "Họ và tên khách hàng không được để trống."}

    # Đảm bảo trường email hợp lệ theo yêu cầu của Backend Express
    effective_email = email.strip() if (email and email.strip()) else f"lead_{clean_p}@zencrm.local"

    payload: Dict[str, Any] = {
        "first_name": fn,
        "last_name": ln,
        "phone": clean_p,
        "email": effective_email,
        "career": career,
        "address": address,
        "campaign_id": campaign_id
    }
    if user.get("role") == "SALESMAN" and user.get("id"):
        payload["assigned_to"] = user.get("id")

    # Gọi trực tiếp REST API của Express Backend
    api_res = backend_client.post("/leads", json=payload)

    # Xử lý trường hợp phát hiện trùng lặp BR-02 (HTTP 409 Conflict)
    if api_res.get("status") == "duplicate_rejected":
        existing = api_res.get("existing_data") or {}
        existing_name = existing.get("name") or "Khách hàng cũ"
        return {
            "success": False,
            "status": "duplicate_rejected",
            "message": f"Quy chuẩn BR-02 từ chối: Số điện thoại '{clean_p}' hoặc Email '{email or effective_email}' đã tồn tại trên hệ thống (Khách hàng #{existing.get('id', '')}: {existing_name}).",
            "existing_lead": existing
        }

    if "error" in api_res:
        return api_res

    if api_res.get("success"):
        new_lead = api_res.get("data", {})
        full_name = format_vietnamese_name(new_lead.get("first_name", fn), new_lead.get("last_name", ln))
        entered_at = str(new_lead.get("entered_date", ""))
        return {
            "success": True,
            "status": "created",
            "message": f"Đã thêm thành công khách hàng tiềm năng mới '{full_name}' vào hệ thống Zen CRM.",
            "lead": {
                "id": new_lead.get("id"),
                "ho_va_ten": full_name,
                "so_dien_thoai": new_lead.get("phone", clean_p),
                "email": email or "Chưa cập nhật",
                "nghe_nghiep": career or "Chưa cập nhật",
                "dia_chi": address or "Chưa cập nhật",
                "ngay_nhap": entered_at,
                "nguoi_phu_trach": user.get("full_name") or user.get("username") if user.get("role") == "SALESMAN" else "Chưa gán"
            },
            "next_suggested_actions": [
                f"Tạo cơ hội bán hàng mới cho {full_name}",
                f"Lên lịch liên hệ tư vấn sản phẩm cho số điện thoại {clean_p}"
            ]
        }

    return {"error": api_res.get("message", "Không thể tạo khách hàng tiềm năng qua API.")}

LEAD_ACTION_TOOLS = [create_lead]
