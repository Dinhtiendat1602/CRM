"""Công cụ chuyên biệt dành riêng cho vai trò Quản trị viên hệ thống (Administrator)."""
from typing import Dict, Any
from src.database.connection import query_one, query_all, check_db_health
from config.settings import settings
from src.utils.context import get_current_user_context

def get_admin_system_overview() -> Dict[str, Any]:
    """
    Dành riêng cho ADMIN: Tra cứu tổng quan trạng thái hệ thống, sức khỏe kết nối CSDL
    và thống kê tài khoản người dùng theo vai trò (ADMIN, SALE_MANAGER, SALESMAN).
    """
    user = get_current_user_context()
    if user.get("role") != "ADMIN":
        return {
            "error": "Từ chối truy cập: Công cụ quản trị hệ thống chỉ dành riêng cho vai trò ADMINISTRATOR."
        }

    try:
        db_ok = check_db_health()
        
        # Thống kê người dùng theo vai trò
        roles_sql = """
            SELECT r.name as role_name, COUNT(u.id) as user_count,
                   SUM(CASE WHEN u.is_active = TRUE THEN 1 ELSE 0 END) as active_count,
                   SUM(CASE WHEN u.is_active = FALSE THEN 1 ELSE 0 END) as inactive_count
            FROM roles r
            LEFT JOIN users u ON r.id = u.role_id
            GROUP BY r.name
            ORDER BY r.name ASC;
        """
        roles_stat = query_all(roles_sql)
        
        # Tổng số người dùng
        total_sql = "SELECT COUNT(*) as total_users FROM users;"
        total_res = query_one(total_sql)
        
        return {
            "trang_thai_he_thong": {
                "dich_vu": "Zen CRM Enterprise Core",
                "csdl_postgresql": "Hoạt động bình thường" if db_ok else "Mất kết nối",
                "mo_hinh_ai": settings.GEMINI_MODEL,
                "tong_so_tai_khoan": int(total_res.get("total_users", 0)) if total_res else 0
            },
            "thong_ke_vai_tro": roles_stat or []
        }
    except Exception as e:
        return {"error": f"Lỗi khi trích xuất dữ liệu quản trị: {str(e)}"}

ADMIN_TOOLS = [get_admin_system_overview]
