from fastapi import HTTPException
from src.database.connection import check_db_health

def get_db_health_dependency():
    """Kiểm tra kết nối Database khả dụng trước khi thực thi các tác vụ quan trọng."""
    if not check_db_health():
        raise HTTPException(status_code=503, detail="Dịch vụ CSDL PostgreSQL tạm thời gián đoạn.")
    return True

