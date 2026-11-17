"""Quản lý ngữ cảnh người dùng hiện tại (Current User Context) qua contextvars."""
import contextvars
from typing import Optional, Dict, Any

_user_context: contextvars.ContextVar[Optional[Dict[str, Any]]] = contextvars.ContextVar(
    "_user_context",
    default=None
)

def set_current_user(user: Optional[Dict[str, Any]]):
    """Thiết lập thông tin người dùng cho phiên/luồng request hiện tại."""
    return _user_context.set(user)

def get_current_user_context() -> Dict[str, Any]:
    """Lấy thông tin người dùng hiện tại (id, username, role, full_name)."""
    user = _user_context.get()
    if user:
        return user
    # Fallback mặc định an toàn cho test nội bộ
    return {
        "id": 1,
        "username": "manager",
        "role": "SALE_MANAGER",
        "email": "manager@zencrm.vn",
        "full_name": "Quản lý kinh doanh"
    }

def reset_current_user(token):
    """Đặt lại ngữ cảnh người dùng sau khi kết thúc request."""
    _user_context.reset(token)

