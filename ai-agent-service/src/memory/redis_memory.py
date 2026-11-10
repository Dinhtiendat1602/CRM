import json
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional, List
from config.settings import settings

STORAGE_DIR = Path(__file__).resolve().parent.parent.parent / "storage" / "logs"

class SessionMemory:
    """Quản lý phiên hội thoại đa người dùng (In-Memory Buffer, lưu trữ file bền vững & mở rộng Redis)."""

    def __init__(self):
        # Lưu các phiên hội thoại và tin nhắn trong RAM
        self._sessions: Dict[str, Any] = {}
        self._history_buffers: Dict[str, List[dict]] = {}
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

    def save_message(self, session_id: str, role: str, content: str):
        """Lưu một tin nhắn mới vào lịch sử hội thoại (RAM + Persistent JSON file + Redis)."""
        if session_id not in self._history_buffers:
            self._history_buffers[session_id] = self._load_from_disk(session_id)

        msg_item = {
            "id": f"msg_{datetime.now().strftime('%Y%m%d%H%M%S%f')}",
            "role": role,
            "content": content,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
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

    def _get_history_file(self, session_id: str) -> Path:
        safe_id = "".join([c for c in session_id if c.isalnum() or c in ("-", "_")]) or "default"
        return STORAGE_DIR / f"chat_history_{safe_id}.json"

    def _save_to_disk(self, session_id: str, messages: List[dict]):
        try:
            file_path = self._get_history_file(session_id)
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(messages, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"[Memory Warning] Không thể lưu lịch sử hội thoại ra đĩa: {e}")

    def _load_from_disk(self, session_id: str) -> List[dict]:
        file_path = self._get_history_file(session_id)
        if file_path.exists():
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    return json.load(f)
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

    def list_saved_sessions(self) -> List[dict]:
        """Liệt kê danh sách tất cả các phiên trò chuyện đã lưu trên đĩa."""
        sessions = []
        for file_path in STORAGE_DIR.glob("chat_history_*.json"):
            try:
                session_id = file_path.stem.replace("chat_history_", "")
                mtime = datetime.fromtimestamp(file_path.stat().st_mtime).strftime("%Y-%m-%d %H:%M:%S")
                with open(file_path, "r", encoding="utf-8") as f:
                    messages = json.load(f)
                
                # Lấy câu hỏi đầu tiên của người dùng làm tiêu đề tóm tắt
                preview = "Cuộc trò chuyện mới"
                for m in messages:
                    if m.get("role") == "user":
                        preview = m.get("content", "")[:50]
                        break
                
                sessions.append({
                    "session_id": session_id,
                    "title": preview,
                    "total_messages": len(messages),
                    "updated_at": mtime
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
