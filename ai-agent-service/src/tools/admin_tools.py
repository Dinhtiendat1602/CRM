"""Công cụ chuyên biệt dành riêng cho vai trò Quản trị viên hệ thống (Administrator) gọi qua Express Backend REST API."""
from typing import Dict, Any
from config.settings import settings
from src.utils.context import get_current_user_context
from src.services.backend_client import backend_client

def get_admin_system_overview() -> Dict[str, Any]:
    """
    Dành riêng cho ADMIN: Tra cứu tổng quan trạng thái hệ thống, sức khỏe kết nối CSDL
    và thống kê tài khoản người dùng theo vai trò (ADMIN, SALE_MANAGER, SALESMAN) thông qua Express Admin REST API.
    """
    user = get_current_user_context()
    if user.get("role") != "ADMIN":
        return {
            "error": "Từ chối truy cập: Công cụ quản trị hệ thống chỉ dành riêng cho vai trò ADMINISTRATOR."
        }

    try:
        # 1. Kiểm tra sức khỏe hệ thống Backend Express
        health_res = backend_client.get("/health")
        if "error" in health_res:
            return health_res
        is_healthy = health_res.get("success", False)

        # 2. Lấy danh sách vai trò hệ thống từ Express Admin API
        roles_res = backend_client.get("/admin/roles")
        if "error" in roles_res:
            return roles_res
        roles_data = roles_res.get("data", [])
        role_names = [r.get("name") for r in roles_data if r.get("name")]

        # 3. Lấy danh sách người dùng từ Express Admin API
        users_res = backend_client.get("/admin/users", params={"limit": 200})
        if "error" in users_res:
            return users_res
        users_list = users_res.get("data", [])
        pagination = users_res.get("pagination", {})
        total_users = pagination.get("totalRecords", len(users_list))

        # 4. Thống kê theo từng vai trò
        roles_stat = []
        for r_name in (role_names or ["ADMIN", "SALE_MANAGER", "SALESMAN"]):
            role_users = [u for u in users_list if u.get("role_name") == r_name]
            active_cnt = sum(1 for u in role_users if u.get("is_active") is True)
            inactive_cnt = len(role_users) - active_cnt
            roles_stat.append({
                "role_name": r_name,
                "user_count": len(role_users),
                "active_count": active_cnt,
                "inactive_count": inactive_cnt
            })

        return {
            "trang_thai_he_thong": {
                "dich_vu": "Zen CRM Enterprise Core",
                "csdl_postgresql": "Hoạt động bình thường" if is_healthy else "Mất kết nối",
                "mo_hinh_ai": settings.GEMINI_MODEL,
                "tong_so_tai_khoan": total_users
            },
            "thong_ke_vai_tro": roles_stat
        }
    except Exception as e:
        return {"error": f"Lỗi khi trích xuất dữ liệu quản trị qua API: {str(e)}"}

ADMIN_TOOLS = [get_admin_system_overview]
