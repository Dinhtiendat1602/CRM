"""Module xác thực JWT Token và phân quyền vai trò (RBAC) cho AI Agent Service."""
import jwt
from typing import Optional, Dict, Any
from fastapi import Header, HTTPException, status
from config.settings import settings

VALID_ROLES = {"ADMIN", "SALE_MANAGER", "SALESMAN"}

def decode_jwt_token(token: str) -> Dict[str, Any]:
    """Giải mã và xác thực chữ ký JWT Token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token xác thực không hợp lệ: {str(e)}"
        )

def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    FastAPI Dependency: Trích xuất danh tính và vai trò người dùng từ Bearer Token.
    - Bắt buộc kiểm tra nếu có Authorization header.
    - Nếu không truyền header (hỗ trợ backward compatibility cho test cũ / demo): fallback về SALE_MANAGER.
    """
    if authorization:
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Định dạng Header phải là 'Bearer <token>'."
            )
        token = authorization.split(" ", 1)[1].strip()
        payload = decode_jwt_token(token)
        
        user_id = payload.get("id")
        raw_role = payload.get("role", "")
        role = str(raw_role).upper()
        
        if role not in VALID_ROLES:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Vai trò '{role}' không được phép truy cập vào Trợ lý AI Zen CRM."
            )
            
        return {
            "id": user_id,
            "username": payload.get("username", f"user_{user_id}"),
            "role": role,
            "email": payload.get("email", ""),
            "full_name": payload.get("full_name", "")
        }

    # Chế độ fallback cho unit-test / kiểm thử nội bộ không token
    return {
        "id": 1,
        "username": "manager",
        "role": "SALE_MANAGER",
        "email": "manager@zencrm.vn",
        "full_name": "Quản lý kinh doanh"
    }

