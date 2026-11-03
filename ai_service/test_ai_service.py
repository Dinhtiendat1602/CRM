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

    def test_crm_leads_tool(self):
        """Kiểm tra công cụ tra cứu Leads trả về dữ liệu chuẩn."""
        res = crm_tools.get_leads_summary(limit=3)
        self.assertNotIn("error", res)
        self.assertIn("tong_so_lead", res)
        self.assertIn("danh_sach_lead", res)
        self.assertIsInstance(res["danh_sach_lead"], list)

    def test_crm_revenue_tool(self):
        """Kiểm tra công cụ tính doanh số và kế hoạch."""
        res = crm_tools.get_revenue_and_forecast(year=2026, month=11)
        self.assertNotIn("error", res)
        self.assertIn("doanh_thu_thang_thuc_te_vnd", res)
        self.assertIn("chi_tieu_ke_hoach_thang_vnd", res)

    def test_crm_products_tool(self):
        """Kiểm tra công cụ tra cứu tồn kho sản phẩm."""
        res = crm_tools.get_products_and_inventory(query="")
        self.assertNotIn("error", res)
        self.assertIn("tong_so_san_pham_tim_thay", res)

    def test_reset_session_endpoint(self):
        """Kiểm tra reset session chat."""
        response = self.client.post("/api/chat/reset", json={"session_id": "test_session"})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["session_id"], "test_session")

if __name__ == "__main__":
    unittest.main()
