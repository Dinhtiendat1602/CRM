"""
Unit & Integration Tests cho Zen CRM AI Service (Python FastAPI & CRM Tools)
"""

import unittest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Thêm thư mục hiện tại vào sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from main import app
from database import check_db_health
import crm_tools

class TestAIService(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_database_health(self):
        """Kiểm tra kết nối tới cơ sở dữ liệu PostgreSQL."""
        healthy = check_db_health()
        self.assertTrue(healthy, "Database PostgreSQL phải kết nối thành công")

    def test_health_endpoint(self):
        """Kiểm tra endpoint /api/health trả về status 200 và thông tin service."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "online")
        self.assertTrue(data["database_connected"])
        self.assertIn("gemini", data["model"])

    def test_quick_prompts_endpoint(self):
        """Kiểm tra endpoint /api/quick-prompts trả về danh sách câu hỏi gợi ý."""
        response = self.client.get("/api/quick-prompts")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("prompts", data)
        self.assertGreaterEqual(len(data["prompts"]), 3)

    def test_format_vietnamese_name(self):
        """Kiểm tra format tên tiếng Việt tự nhiên."""
        name1 = crm_tools.format_vietnamese_name("Nguyen", "Van An")
        self.assertEqual(name1, "Nguyen Van An")

        name2 = crm_tools.format_vietnamese_name("Đức", "Phan Cảnh")
        self.assertEqual(name2, "Phan Cảnh Đức")

    def test_crm_leads_tool(self):
        """Kiểm tra công cụ tra cứu Leads trả về dữ liệu chuẩn."""
        res = crm_tools.get_leads_summary(limit=3)
        self.assertNotIn("error", res)
        self.assertIn("tong_so_lead_toan_he_thong", res)
        self.assertIn("danh_sach_lead", res)
        self.assertIsInstance(res["danh_sach_lead"], list)

    def test_crm_revenue_tool(self):
        """Kiểm tra công cụ tính doanh số và kế hoạch."""
        res = crm_tools.get_revenue_and_forecast(year=2026, month=11)
        self.assertNotIn("error", res)
        self.assertIn("doanh_thu_thang_thuc_te_vnd", res)
        self.assertIn("chi_tieu_ke_hoach_thang_vnd", res)
        self.assertIn("bang_tong_hop_doanh_thu_cac_thang_nam", res)

    def test_crm_products_tool(self):
        """Kiểm tra công cụ tra cứu tồn kho sản phẩm."""
        res = crm_tools.get_products_and_inventory(query="bàn phím")
        self.assertNotIn("error", res)
        self.assertIn("tong_so_san_pham_toan_he_thong", res)
        self.assertGreaterEqual(res["so_san_pham_khop_tim_kiem"], 1)

    def test_crm_orders_tool(self):
        """Kiểm tra công cụ tra cứu đơn hàng."""
        res = crm_tools.get_orders_summary(limit=5)
        self.assertNotIn("error", res)
        self.assertIn("tong_so_don_hang", res)
        self.assertIn("danh_sach_don_hang", res)
        self.assertGreaterEqual(len(res["danh_sach_don_hang"]), 1)

    def test_crm_search_customer_tool(self):
        """Kiểm tra tìm kiếm khách hàng Nguyễn Văn An cùng chi tiết đơn hàng đã mua."""
        res = crm_tools.search_customer("Nguyễn Văn An")
        self.assertNotIn("error", res)
        self.assertIn("khach_hang", res)
        self.assertEqual(res["khach_hang"]["ho_va_ten"], "Nguyen Van An")
        self.assertIn("chi_tiet_don_hang_va_san_pham_da_mua", res)
        self.assertGreaterEqual(len(res["chi_tiet_don_hang_va_san_pham_da_mua"]), 1)

    def test_reset_session_endpoint(self):
        """Kiểm tra reset session chat."""
        response = self.client.post("/api/chat/reset", json={"session_id": "test_session"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["session_id"], "test_session")

if __name__ == "__main__":
    unittest.main()
