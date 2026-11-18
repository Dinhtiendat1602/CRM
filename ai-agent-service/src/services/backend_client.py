"""
Client HTTP trung gian điều phối và chuyển tiếp yêu cầu từ AI Agent Tools
sang Express RESTful API Backend kèm xác thực Bearer JWT Token.
"""
from typing import Optional, Dict, Any
import httpx
from config.settings import settings
from src.utils.context import get_current_token

class BackendAPIClient:
    def __init__(self, base_url: Optional[str] = None, timeout: float = 10.0):
        self.base_url = (base_url or getattr(settings, "BACKEND_API_BASE", "http://localhost:8888/api")).rstrip("/")
        self.timeout = timeout

    def _get_headers(self, custom_headers: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        token = get_current_token()
        if token:
            headers["Authorization"] = f"Bearer {token}"
        if custom_headers:
            headers.update(custom_headers)
        return headers

    def _format_error_response(self, response: httpx.Response) -> Dict[str, Any]:
        """Chuẩn hóa lỗi HTTP từ Express Backend thành phản hồi tường minh cho Gemini AI."""
        try:
            data = response.json()
        except Exception:
            data = {"message": response.text}

        status_code = response.status_code
        message = data.get("message") if isinstance(data, dict) else str(data)

        if status_code == 401:
            return {
                "error": f"Lỗi xác thực (401 Unauthorized): {message or 'Token không hợp lệ hoặc đã hết hạn.'}"
            }
        elif status_code == 403:
            return {
                "error": f"Quyền truy cập bị từ chối: {message or 'Bạn không có quyền thực hiện thao tác này.'} (Mã lỗi 403 Forbidden từ Backend Express)."
            }
        elif status_code == 409:
            # Xung đột / Trùng lặp dữ liệu theo BR-02
            return {
                "success": False,
                "status": "duplicate_rejected",
                "message": message or "Phát hiện trùng lặp dữ liệu (BR-02 Conflict).",
                "existing_data": (data.get("existingLead") or data.get("existingOpportunity")) if isinstance(data, dict) else None
            }
        elif status_code == 404:
            return {
                "error": f"Không tìm thấy dữ liệu (404 Not Found): {message or 'Tài nguyên yêu cầu không tồn tại.'}"
            }
        elif status_code == 400:
            return {
                "error": f"Yêu cầu không hợp lệ (400 Bad Request): {message or 'Tham số đầu vào không đúng định dạng.'}"
            }
        else:
            return {
                "error": f"Lỗi máy chủ Backend Express ({status_code}): {message or 'Lỗi không xác định.'}"
            }

    def get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Gửi GET request sang Express Backend kèm Token xác thực."""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        clean_params = {k: v for k, v in params.items() if v is not None} if params else None
        headers = self._get_headers()

        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.get(url, params=clean_params, headers=headers)
                if 200 <= resp.status_code < 300:
                    return resp.json()
                return self._format_error_response(resp)
        except httpx.ConnectError:
            return {
                "error": f"Không thể kết nối đến Backend Express tại {self.base_url}. Vui lòng kiểm tra server Backend đang chạy."
            }
        except httpx.TimeoutException:
            return {
                "error": f"Quá thời gian chờ phản hồi ({self.timeout}s) từ Backend Express API tại {url}."
            }
        except Exception as e:
            return {
                "error": f"Lỗi ngoại lệ khi gọi Backend Express API: {str(e)}"
            }

    def post(self, endpoint: str, json: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Gửi POST request sang Express Backend kèm Token xác thực."""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = self._get_headers()

        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(url, json=json, headers=headers)
                if 200 <= resp.status_code < 300:
                    return resp.json()
                return self._format_error_response(resp)
        except httpx.ConnectError:
            return {
                "error": f"Không thể kết nối đến Backend Express tại {self.base_url}. Vui lòng kiểm tra server Backend đang chạy."
            }
        except httpx.TimeoutException:
            return {
                "error": f"Quá thời gian chờ phản hồi ({self.timeout}s) từ Backend Express API tại {url}."
            }
        except Exception as e:
            return {
                "error": f"Lỗi ngoại lệ khi gửi dữ liệu sang Backend Express API: {str(e)}"
            }

    def put(self, endpoint: str, json: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Gửi PUT request sang Express Backend kèm Token xác thực."""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = self._get_headers()

        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.put(url, json=json, headers=headers)
                if 200 <= resp.status_code < 300:
                    return resp.json()
                return self._format_error_response(resp)
        except Exception as e:
            return {"error": f"Lỗi ngoại lệ PUT API: {str(e)}"}

    def delete(self, endpoint: str) -> Dict[str, Any]:
        """Gửi DELETE request sang Express Backend kèm Token xác thực."""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = self._get_headers()

        try:
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.delete(url, headers=headers)
                if 200 <= resp.status_code < 300:
                    return resp.json()
                return self._format_error_response(resp)
        except Exception as e:
            return {"error": f"Lỗi ngoại lệ DELETE API: {str(e)}"}

backend_client = BackendAPIClient()

