import re
import unicodedata

def format_vietnamese_name(first_name: str, last_name: str) -> str:
    """
    Chuẩn hóa ghép họ và tên tiếng Việt một cách tự nhiên và chính xác.
    Xử lý tự động cả 2 trường hợp:
    1. first_name = Họ ('Nguyen'), last_name = Tên đệm & Tên ('Van An') -> 'Nguyen Van An'
    2. last_name = Họ & Tên đệm ('Phan Cảnh'), first_name = Tên ('Đức') -> 'Phan Cảnh Đức'
    """
    fn = (first_name or "").strip()
    ln = (last_name or "").strip()
    if not fn:
        return ln
    if not ln:
        return fn

    common_surnames = {
        'nguyen', 'tran', 'le', 'pham', 'hoang', 'huynh', 'phan', 'vu', 'vo', 
        'dang', 'bui', 'do', 'ho', 'ngo', 'duong', 'ly', 'dinh', 'trinh', 'mai', 
        'dao', 'doan', 'luong', 'nguyễn', 'trần', 'lê', 'phạm', 'hoàng', 'huỳnh', 
        'phần', 'vũ', 'võ', 'đặng', 'bùi', 'đỗ', 'hồ', 'ngô', 'dương', 'lý', 'đinh', 'trịnh'
    }

    fn_lower = fn.lower()
    ln_lower = ln.lower().split()
    first_word_ln = ln_lower[0] if ln_lower else ""

    if fn_lower in common_surnames and first_word_ln not in common_surnames:
        return f"{fn} {ln}"
    return f"{ln} {fn}"

def remove_vietnamese_accents(text: str) -> str:
    """Khử dấu tiếng Việt (ví dụ: 'Nguyễn Văn Nam' -> 'Nguyen Van Nam')."""
    if not text:
        return ""
    text = unicodedata.normalize('NFD', text)
    text = ''.join([c for c in text if unicodedata.category(c) != 'Mn'])
    # Thay thế thủ công ký tự đ/Đ
    text = text.replace('đ', 'd').replace('Đ', 'D')
    return unicodedata.normalize('NFC', text)

def format_currency(amount: float) -> str:
    """Định dạng số tiền kèm phân cách dấu chấm và đơn vị ₫ (ví dụ: 24.500.000 ₫)."""
    try:
        val = int(amount)
        return f"{val:,}".replace(",", ".") + " ₫"
    except Exception:
        return f"{amount} ₫"

def clean_phone(phone: str) -> str:
    """Chuẩn hóa số điện thoại, loại bỏ khoảng trắng và ký tự đặc biệt."""
    if not phone:
        return ""
    return re.sub(r"[^\d+]", "", phone.strip())
