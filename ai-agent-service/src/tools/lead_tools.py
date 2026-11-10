"""Công cụ cho Agent thực hiện thao tác tự động trên Khách hàng tiềm năng (Leads)."""
from typing import Optional
from datetime import datetime
from src.database.connection import query_one, get_db_connection
from src.utils.normalizer import format_vietnamese_name, clean_phone

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
    Tự động thêm một Khách hàng tiềm năng (Lead) mới vào hệ thống Zen CRM.
    - first_name: Tên của khách hàng (VD: 'Nam', 'Đức')
    - last_name: Họ và tên đệm (VD: 'Nguyễn Văn', 'Phan Cảnh')
    - phone: Số điện thoại (bắt buộc, chống trùng lặp theo quy chuẩn BR-02)
    - email: Email của khách hàng (tùy chọn, chống trùng lặp theo quy chuẩn BR-02)
    - career: Nghề nghiệp hoặc chức danh (VD: 'Kỹ sư', 'Kinh doanh')
    - address: Địa chỉ liên hệ (VD: '456 Trần Phú, Đà Nẵng')
    - campaign_id: ID chiến dịch tiếp thị mang lại khách này (tùy chọn)
    
    Hàm tự động kiểm tra trùng SĐT/Email, thêm vào CSDL và trả về thông tin xác nhận.
    """
    clean_p = clean_phone(phone)
    if not clean_p:
        return {"error": "Số điện thoại là bắt buộc và không được để trống."}
    
    fn = (first_name or "").strip()
    ln = (last_name or "").strip()
    if not fn and not ln:
        return {"error": "Họ và tên khách hàng không được để trống."}

    # 1. Kiểm tra chống trùng lặp theo BR-02
    dup_sql = "SELECT id, first_name, last_name, phone, email FROM leads WHERE phone = %s"
    dup_params = [clean_p]
    if email and email.strip():
        dup_sql += " OR email ILIKE %s"
        dup_params.append(email.strip())
    
    existing = query_one(dup_sql, tuple(dup_params))
    if existing:
        existing_name = format_vietnamese_name(existing.get("first_name", ""), existing.get("last_name", ""))
        return {
            "success": False,
            "status": "duplicate_rejected",
            "message": f"Quy chuẩn BR-02 từ chối: Số điện thoại '{clean_p}' hoặc Email '{email}' đã tồn tại trên hệ thống (Khách hàng #{existing['id']}: {existing_name}).",
            "existing_lead": {
                "id": existing["id"],
                "ho_va_ten": existing_name,
                "phone": existing["phone"],
                "email": existing["email"]
            }
        }

    # 2. Thêm mới bản ghi vào bảng leads
    insert_sql = """
        INSERT INTO leads (first_name, last_name, phone, email, career, address, campaign_id, entered_date)
        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
        RETURNING id, entered_date;
    """
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    insert_sql,
                    (fn, ln, clean_p, (email.strip() if email else None), career, address, campaign_id)
                )
                res = cur.fetchone()
                conn.commit()
                new_id = res[0]
                entered_at = res[1].strftime("%Y-%m-%d %H:%M:%S")

        full_name = format_vietnamese_name(fn, ln)
        return {
            "success": True,
            "status": "created",
            "message": f"Đã thêm thành công khách hàng tiềm năng mới '{full_name}' vào hệ thống Zen CRM.",
            "lead": {
                "id": new_id,
                "ho_va_ten": full_name,
                "so_dien_thoai": clean_p,
                "email": email or "Chưa cập nhật",
                "nghe_nghiep": career or "Chưa cập nhật",
                "dia_chi": address or "Chưa cập nhật",
                "ngay_nhap": entered_at
            },
            "next_suggested_actions": [
                f"Tạo cơ hội bán hàng mới cho {full_name}",
                f"Ghi nhận nhật ký liên hệ/cuộc gọi đầu tiên với {full_name}"
            ]
        }
    except Exception as e:
        return {"error": f"Lỗi cơ sở dữ liệu khi tạo Lead: {str(e)}"}

LEAD_ACTION_TOOLS = [create_lead]

