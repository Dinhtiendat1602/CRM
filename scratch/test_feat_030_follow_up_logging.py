"""
Kịch bản kiểm thử Live E2E cho feat-030:
Trợ Lý AI Tự Động Ghi Nhật Ký Chăm Sóc & Chuyển Đổi Pipeline (Autonomous Follow-up Logging & Pipeline Transition).
"""
import sys
import os
import json
import jwt

# Thêm thư mục ai-agent-service vào PYTHONPATH
sys.path.insert(0, os.path.abspath("ai-agent-service"))

from config.settings import settings
from src.database.connection import query_one, query_all, execute_commit
from src.utils.context import set_current_user, reset_current_user, set_current_token, reset_current_token
from src.tools.lead_tools import create_lead
from src.tools.order_tools import create_opportunity, log_follow_up
from src.agents import crm_agent

def run_feat_030_test():
    print("=" * 70)
    print("🚀 Bắt đầu kiểm thử E2E: feat-030 Autonomous Follow-up Logging")
    print("=" * 70)

    test_phone = "0987334455"
    test_email = "nam.followup.test@gmail.com"

    # 1. Chuẩn bị token JWT cho Salesman (ID 3, username: salesman1)
    salesman_payload = {
        "id": 3,
        "username": "salesman1",
        "email": "salesman1@zencrm.vn",
        "role": "SALESMAN",
        "full_name": "Lê Văn Bán Hàng"
    }
    token = jwt.encode(salesman_payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    salesman_user = {
        **salesman_payload,
        "raw_token": token
    }
    tok_user = set_current_user(salesman_user)
    tok_jwt = set_current_token(token)

    try:
        # Dọn dẹp dữ liệu cũ nếu có
        execute_commit("""
            DELETE FROM follow_ups WHERE opportunity_id IN (
                SELECT o.id FROM opportunities o JOIN leads l ON o.lead_id = l.id WHERE l.phone = %s
            );
            DELETE FROM opportunities WHERE lead_id IN (SELECT id FROM leads WHERE phone = %s);
            DELETE FROM leads WHERE phone = %s OR email = %s;
        """, (test_phone, test_phone, test_phone, test_email))

        # 2. Tạo Lead mới thuộc phụ trách của Salesman 3
        print("\n=== Bước 1: Tạo khách hàng tiềm năng 'Nguyễn Văn Nam' cho Salesman 3 ===")
        lead_res = create_lead(
            first_name="Nam",
            last_name="Nguyễn Văn",
            phone=test_phone,
            email=test_email,
            career="Trưởng phòng kinh doanh",
            address="789 Điện Biên Phủ, Đà Nẵng"
        )
        assert lead_res.get("success") is True, f"Tạo lead mẫu thất bại: {lead_res}"
        lead_id = lead_res["lead"]["id"]
        print(f"✔ Khách hàng mẫu đã tạo thành công: #{lead_id} - {lead_res['lead']['ho_va_ten']} (phụ trách: ID 3)")

        # 3. Tạo Cơ hội bán hàng trạng thái NEW cho khách Nam
        print("\n=== Bước 2: Tạo Cơ hội bán hàng mới trạng thái NEW ===")
        opp_res = create_opportunity(
            lead_id=lead_id,
            product_identifier="CAM-SONY-A7M4",
            expected_quantity=1,
            expected_close_date="2026-11-28",
            notes="Khách hàng quan tâm máy ảnh Sony Alpha A7M4"
        )
        assert opp_res.get("success") is True, f"Tạo cơ hội mẫu thất bại: {opp_res}"
        opp_id = opp_res["opportunity"]["id"]
        print(f"✔ Cơ hội bán hàng mẫu đã tạo thành công: #{opp_id} cho khách {lead_res['lead']['ho_va_ten']}")

        opp_before = query_one("SELECT status FROM opportunities WHERE id = %s", (opp_id,))
        assert opp_before["status"] == "NEW"
        print(f"📌 Trạng thái cơ hội trước khi tương tác: {opp_before['status']}")

        # 4. Gửi câu lệnh ngôn ngữ tự nhiên vào Gemini Chat Agent
        print("\n=== Bước 3: Gửi báo cáo cuộc gọi bằng Ngôn ngữ tự nhiên qua Chat ===")
        prompt = "Vừa gọi điện cho khách Nam, khách hào hứng xin báo giá máy ảnh Sony, kế hoạch ngày mai gửi báo giá qua Zalo"
        session_id = f"test_feat_030_sess_{opp_id}"
        print(f"💬 Prompt: \"{prompt}\"")
        
        reply, actions = crm_agent.chat(
            user_message=prompt,
            session_id=session_id,
            user=salesman_user,
            return_actions=True
        )

        print("\n🤖 Phản hồi của Gemini AI:")
        print("-" * 50)
        print(reply)
        print("-" * 50)
        print("\n📦 Actions trích xuất được:")
        print(json.dumps(actions, ensure_ascii=False, indent=2))

        # Kiểm tra actions trích xuất
        assert len(actions) >= 1, "Phải trích xuất được ít nhất 1 action"
        fu_action = next((a for a in actions if a.get("type") == "follow_up_logged"), None)
        assert fu_action is not None, "Phải có action loại 'follow_up_logged'"
        assert fu_action["status"] == "success", "Action status phải là 'success'"
        
        fu_data = fu_action["follow_up"]
        print(f"\n✔ Action follow_up_logged trích xuất thành công: Nhật ký #{fu_data.get('id')}")
        print(f"   - Khách hàng: {fu_data.get('khach_hang')}")
        print(f"   - Hình thức: {fu_data.get('hinh_thuc')}")
        print(f"   - Pipeline mới: {fu_data.get('trang_thai_moi')}")

        # 5. Kiểm tra CSDL PostgreSQL
        # Kiểm tra bảng follow_ups
        after_fu = query_one("""
            SELECT id, opportunity_id, contact_method, content, customer_response, next_plan, created_by
            FROM follow_ups
            WHERE opportunity_id = %s
            ORDER BY id DESC
            LIMIT 1
        """, (opp_id,))

        assert after_fu is not None, "Bản ghi follow_ups mới phải tồn tại trong CSDL"
        print(f"\n✔ Đã lưu vào bảng follow_ups ID #{after_fu['id']}:")
        print(f"   - Hình thức: {after_fu['contact_method']}")
        print(f"   - Nội dung: {after_fu['content']}")
        print(f"   - Phản hồi khách: {after_fu['customer_response']}")
        print(f"   - Kế hoạch tiếp theo: {after_fu['next_plan']}")
        print(f"   - Người tạo: {after_fu['created_by']}")

        assert after_fu["contact_method"] in ["PHONE", "ZALO"], "Hình thức phải chuẩn hóa là PHONE hoặc ZALO"
        assert after_fu["created_by"] == 3, "Người tạo phải là Salesman 3"

        # Kiểm tra chuyển đổi trạng thái Pipeline trong bảng opportunities
        opp_after = query_one("SELECT status FROM opportunities WHERE id = %s", (opp_id,))
        print(f"\n🔄 Trạng thái cơ hội #{opp_id} sau khi ghi nhật ký: {opp_after['status']}")
        assert opp_after["status"] in ["CONTACTED", "QUALIFIED", "PROPOSAL"], "Cơ hội phải chuyển đổi từ NEW sang CONTACTED hoặc bước tiếp theo"
        print("✔ Tự động chuyển đổi Pipeline thành công theo SRS 3.11 (từ NEW sang CONTACTED)!")

        # 6. Kiểm tra gọi trực tiếp log_follow_up với chuyển đổi trạng thái sang QUALIFIED
        print("\n=== Bước 4: Kiểm tra tool log_follow_up với chuyển trạng thái chủ động (new_status='QUALIFIED') ===")
        tool_res = log_follow_up(
            opportunity_id=opp_id,
            contact_method="MEETING",
            content="Gặp trực tiếp khách hàng tại văn phòng demo sản phẩm",
            customer_response="Khách đánh giá cao tính năng và đồng ý điều khoản dự thảo",
            next_plan="Soạn hợp đồng mua bán chính thức",
            new_status="QUALIFIED"
        )
        assert tool_res.get("success") is True, f"log_follow_up error: {tool_res}"
        assert tool_res.get("status") == "follow_up_logged"
        assert tool_res["follow_up"]["trang_thai_moi"] == "QUALIFIED"

        opp_qualified = query_one("SELECT status FROM opportunities WHERE id = %s", (opp_id,))
        assert opp_qualified["status"] == "QUALIFIED"
        print(f"✔ Trạng thái cơ hội #{opp_id} đã chuyển thành: {opp_qualified['status']}")

        # 7. Dọn dẹp dữ liệu test an toàn
        execute_commit("""
            DELETE FROM follow_ups WHERE opportunity_id = %s;
            DELETE FROM opportunities WHERE id = %s;
            DELETE FROM leads WHERE id = %s;
        """, (opp_id, opp_id, lead_id))
        print("\n>>> Đã dọn dẹp dữ liệu test an toàn!")

        print("\n" + "=" * 70)
        print("🎉 KIỂM THỬ E2E FEAT-030 HOÀN THÀNH XUẤT SẮC 100%!")
        print("=" * 70)
        return True

    finally:
        reset_current_user(tok_user)
        reset_current_token(tok_jwt)

if __name__ == "__main__":
    success = run_feat_030_test()
    sys.exit(0 if success else 1)
