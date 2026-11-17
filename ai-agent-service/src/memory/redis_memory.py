import json
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional, List
from config.settings import settings
from src.utils.context import get_current_user_context

STORAGE_DIR = Path(__file__).resolve().parent.parent.parent / "storage" / "logs"

class SessionMemory:
    """Quản lý phiên hội thoại đa người dùng và phân quyền lịch sử theo vai trò (RBAC Session Memory)."""

    def __init__(self):
        # Lưu các phiên hội thoại và tin nhắn trong RAM
        self._sessions: Dict[str, Any] = {}
        self._history_buffers: Dict[str, List[dict]] = {}
        self._session_metadata: Dict[str, dict] = {}
        self.redis_client = None
        self._init_redis()
        
        # Đảm bảo thư mục lưu trữ file tồn tại
        STORAGE_DIR.mkdir(parents=True, exist_ok=True)

    def _init_redis(self):
        """Khởi tạo kết nối Redis dự phòng (nếu có thư viện redis và host khả dụng)."""
        try:
            import importlib
            redis = importlib.import_module("redis")
            if settings.REDIS_HOST:
                self.redis_client = redis.Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    password=settings.REDIS_PASSWORD or None,
                    decode_responses=True,
                    socket_connect_timeout=1
                )
                self.redis_client.ping()
                print("🟢 [Memory] Đã kết nối Redis Cache thành công.")
        except Exception:
            # Fallback an toàn sang In-Memory Dict
            self.redis_client = None

    def get_chat_session(self, session_id: str) -> Optional[Any]:
        return self._sessions.get(session_id)

    def set_chat_session(self, session_id: str, chat_obj: Any):
        self._sessions[session_id] = chat_obj

    def save_message(self, session_id: str, role: str, content: str, user: Optional[Dict[str, Any]] = None):
        """Lưu một tin nhắn mới vào lịch sử hội thoại (RAM + Persistent JSON file + Redis) kèm siêu dữ liệu vai trò."""
        if session_id not in self._history_buffers:
            self._history_buffers[session_id] = self._load_from_disk(session_id)

        # Xác định thông tin người dùng và vai trò
        current_u = user or get_current_user_context()
        user_role = (current_u.get("role") or "SALE_MANAGER").upper()
        user_id = current_u.get("id")
        username = current_u.get("username")

        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if session_id not in self._session_metadata:
            self._session_metadata[session_id] = {
                "session_id": session_id,
                "role": user_role,
                "user_id": user_id,
                "username": username,
                "created_at": now_str,
                "updated_at": now_str
            }
        else:
            self._session_metadata[session_id]["updated_at"] = now_str
            if user_role:
                self._session_metadata[session_id]["role"] = user_role
            if user_id is not None:
                self._session_metadata[session_id]["user_id"] = user_id
            if username:
                self._session_metadata[session_id]["username"] = username

        msg_item = {
            "id": f"msg_{datetime.now().strftime('%Y%m%d%H%M%S%f')}",
            "role": role,
            "content": content,
            "timestamp": now_str
        }
        self._history_buffers[session_id].append(msg_item)
        self._save_to_disk(session_id, self._history_buffers[session_id])

        if self.redis_client:
            try:
                self.redis_client.rpush(f"crm_chat_history:{session_id}", json.dumps(msg_item, ensure_ascii=False))
            except Exception:
                pass

    def get_history(self, session_id: str) -> List[dict]:
        """Lấy toàn bộ lịch sử tin nhắn của phiên trò chuyện."""
        if session_id in self._history_buffers:
            return self._history_buffers[session_id]
        
        # Nếu chưa có trong RAM, nạp từ đĩa
        history = self._load_from_disk(session_id)
        self._history_buffers[session_id] = history
        return history

    def get_session_metadata(self, session_id: str) -> Optional[dict]:
        """Lấy thông tin metadata phân quyền của phiên trò chuyện."""
        if session_id not in self._session_metadata:
            self._load_from_disk(session_id)
        return self._session_metadata.get(session_id)

    def get_session_role(self, session_id: str) -> Optional[str]:
        """Lấy vai trò sở hữu phiên trò chuyện."""
        meta = self.get_session_metadata(session_id)
        return meta.get("role") if meta else None

    def get_session_user_id(self, session_id: str) -> Optional[int]:
        """Lấy User ID sở hữu phiên trò chuyện."""
        meta = self.get_session_metadata(session_id)
        return meta.get("user_id") if meta else None

    def _get_history_file(self, session_id: str) -> Path:
        safe_id = "".join([c for c in session_id if c.isalnum() or c in ("-", "_")]) or "default"
        return STORAGE_DIR / f"chat_history_{safe_id}.json"

    def _save_to_disk(self, session_id: str, messages: List[dict]):
        try:
            file_path = self._get_history_file(session_id)
            meta = self._session_metadata.get(session_id, {
                "session_id": session_id,
                "role": "SALE_MANAGER",
                "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            })
            payload = {
                "metadata": meta,
                "messages": messages
            }
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[Memory Warning] Không thể lưu lịch sử hội thoại ra đĩa: {e}")

    def _load_from_disk(self, session_id: str) -> List[dict]:
        file_path = self._get_history_file(session_id)
        if file_path.exists():
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                if isinstance(data, dict) and "messages" in data:
                    if "metadata" in data and isinstance(data["metadata"], dict):
                        self._session_metadata[session_id] = data["metadata"]
                    return data.get("messages", [])
                elif isinstance(data, list):
                    # Tương thích ngược phiên cũ
                    inferred_role = "SALE_MANAGER"
                    if session_id.startswith("admin_") or "admin" in session_id:
                        inferred_role = "ADMIN"
                    elif session_id.startswith("sales_") or session_id.startswith("salesman_") or "sales" in session_id:
                        inferred_role = "SALESMAN"
                    
                    self._session_metadata[session_id] = {
                        "session_id": session_id,
                        "role": inferred_role,
                        "updated_at": datetime.fromtimestamp(file_path.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")
                    }
                    return data
            except Exception:
                return []
        return []

    def clear_session(self, session_id: str) -> bool:
        cleared = False
        if session_id in self._sessions:
            del self._sessions[session_id]
            cleared = True
        if session_id in self._history_buffers:
            del self._history_buffers[session_id]
            cleared = True
        if session_id in self._session_metadata:
            del self._session_metadata[session_id]
            cleared = True
        
        # Xóa file trên đĩa
        file_path = self._get_history_file(session_id)
        if file_path.exists():
            try:
                os.remove(file_path)
                cleared = True
            except Exception:
                pass

        if self.redis_client:
            try:
                self.redis_client.delete(f"crm_chat:{session_id}")
                self.redis_client.delete(f"crm_chat_history:{session_id}")
            except Exception:
                pass
        return cleared

    def list_saved_sessions(self, role: Optional[str] = None, user_id: Optional[int] = None) -> List[dict]:
        """
        Liệt kê danh sách các phiên trò chuyện đã lưu trên đĩa,
        lọc nghiêm ngặt theo vai trò (Role) và mã nhân viên (User ID).
        """
        sessions = []
        clean_role = role.upper() if role else None

        for file_path in STORAGE_DIR.glob("chat_history_*.json"):
            try:
                session_id = file_path.stem.replace("chat_history_", "")
                mtime = datetime.fromtimestamp(file_path.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)

                if isinstance(data, dict) and "messages" in data:
                    meta = data.get("metadata", {})
                    messages = data.get("messages", [])
                elif isinstance(data, list):
                    messages = data
                    inferred_role = "SALE_MANAGER"
                    if session_id.startswith("admin_") or "admin" in session_id:
                        inferred_role = "ADMIN"
                    elif session_id.startswith("sales_") or session_id.startswith("salesman_") or "sales" in session_id:
                        inferred_role = "SALESMAN"
                    meta = {"role": inferred_role, "session_id": session_id}
                else:
                    continue

                sess_role = (meta.get("role") or "SALE_MANAGER").upper()
                sess_uid = meta.get("user_id")

                # 1. Chặn hoàn toàn phiên của vai trò khác
                if clean_role and sess_role != clean_role:
                    continue

                # 2. Đối với Salesman: Chỉ hiển thị phiên của chính nhân viên đó
                if clean_role == "SALESMAN" and user_id is not None and sess_uid is not None:
                    if int(sess_uid) != int(user_id):
                        continue

                # Lấy câu hỏi đầu tiên của người dùng làm tiêu đề tóm tắt
                preview = "Cuộc trò chuyện mới"
                for m in messages:
                    if m.get("role") == "user":
                        preview = m.get("content", "")[:50]
                        break

                sessions.append({
                    "session_id": session_id,
                    "role": sess_role,
                    "user_id": sess_uid,
                    "username": meta.get("username"),
                    "title": preview,
                    "message_count": len(messages),
                    "total_messages": len(messages),
                    "updated_at": meta.get("updated_at", mtime)
                })
            except Exception:
                continue

        # Sắp xếp phiên mới nhất lên đầu
        sessions.sort(key=lambda x: x["updated_at"], reverse=True)
        return sessions

    def list_active_sessions(self) -> list:
        return list(self._sessions.keys())

# Singleton memory instance
memory = SessionMemory()
