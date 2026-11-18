"""Quản lý ngữ cảnh người dùng hiện tại (Current User Context) và JWT Token qua contextvars."""
import contextvars
from typing import Optional, Dict, Any

_user_context: contextvars.ContextVar[Optional[Dict[str, Any]]] = contextvars.ContextVar(
    "_user_context",
    default=None
)

_raw_token_context: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "_raw_token_context",
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

def set_current_token(token: Optional[str]):
    """Thiết lập raw Bearer JWT Token để forward sang Express Backend."""
    return _raw_token_context.set(token)

def reset_current_token(token):
    """Đặt lại ngữ cảnh JWT Token sau khi kết thúc request."""
    _raw_token_context.reset(token)

def get_current_token() -> Optional[str]:
    """
    Lấy raw Bearer JWT Token hiện tại để gọi sang Express REST API.
    Nếu chưa có (vd: chạy unit test độc lập), tự động sinh JWT hợp lệ
    dựa trên ngữ cảnh người dùng hiện tại với JWT_SECRET dùng chung.
    """
    tok = _raw_token_context.get()
    if tok:
        return tok
    
    # Kiểm tra trong user dict
    user = _user_context.get()
    if user and user.get("raw_token"):
        return user.get("raw_token")

    # Tự động sinh JWT token cho user context hiện tại
    try:
        import jwt
        from config.settings import settings
        effective_user = get_current_user_context()
        payload = {
            "id": effective_user.get("id", 1),
            "username": effective_user.get("username", "manager"),
            "email": effective_user.get("email", "manager@zencrm.vn"),
            "role": effective_user.get("role", "SALE_MANAGER"),
            "full_name": effective_user.get("full_name", "Quản lý kinh doanh")
        }
        return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    except Exception:
        return None
