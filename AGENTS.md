<!-- Chức năng: Hướng dẫn tối thượng cho AI: quy tắc code, tech stack, quy ước đặt tên và lệnh kiểm tra -->

# AGENTS.md

Khung Harness Kỹ thuật Dự án Zen CRM — Hướng dẫn vận hành AI Coding Agent chuẩn công nghiệp.

## Startup Workflow - Quy trình khởi động trước mỗi phiên

Before writing code (Trước khi bắt đầu viết code):

1. **Xác nhận thư mục làm việc**: Kiểm tra đường dẫn bằng `pwd`.
2. **Đọc kỹ chỉ dẫn tại file này**: Đọc toàn bộ `AGENTS.md`.
3. **Đọc tài liệu phân tích nghiệp vụ & kiến trúc dự án**:
   - Kiến trúc tổng thể: [ARCHITECTURE.md](file:///Users/zen/CNTT/Fullstack/internship/ARCHITECTURE.md)
   - Đặc tả yêu cầu phần mềm: [docs/product-specs/index.md](file:///Users/zen/CNTT/Fullstack/internship/docs/product-specs/index.md)
   - Phân quyền & Vai trò: [docs/product-specs/roles-and-requirements.md](file:///Users/zen/CNTT/Fullstack/internship/docs/product-specs/roles-and-requirements.md)
   - Thiết kế CSDL PostgreSQL: [docs/generated/db-schema.md](file:///Users/zen/CNTT/Fullstack/internship/docs/generated/db-schema.md)
   - Kiến trúc Backend Express: [docs/references/backend-architecture-original.md](file:///Users/zen/CNTT/Fullstack/internship/docs/references/backend-architecture-original.md)
   - Kiến trúc Frontend React Vite: [docs/FRONTEND.md](file:///Users/zen/CNTT/Fullstack/internship/docs/FRONTEND.md)
   - Lộ trình 4 tuần & Kịch bản bảo vệ: [docs/PLANS.md](file:///Users/zen/CNTT/Fullstack/internship/docs/PLANS.md)
   - Nguyên tắc cốt lõi: [docs/design-docs/core-beliefs.md](file:///Users/zen/CNTT/Fullstack/internship/docs/design-docs/core-beliefs.md)
   - Quy chuẩn bảo mật: [docs/SECURITY.md](file:///Users/zen/CNTT/Fullstack/internship/docs/SECURITY.md)
   - Chiến lược kiểm thử: [docs/TESTING.md](file:///Users/zen/CNTT/Fullstack/internship/docs/TESTING.md)
4. **Đọc `feature_list.json`**: Xem danh sách tính năng, trạng thái hiện tại (`status`) và các mối phụ thuộc (`dependencies`).
5. **Kiểm tra lịch sử commit gần nhất**: Chạy `git log --oneline -5` (nếu đã khởi tạo git).

## Working Rules - Nguyên tắc làm việc cốt lõi

- **One feature at a time (Mỗi lần chỉ thực hiện một tính năng)**: Chọn đúng một tính năng chưa hoàn thành từ `feature_list.json`. Không bao giờ làm nhiều tính năng cùng lúc để tránh phân mảnh ngữ cảnh.
- **Verification required (Bắt buộc phải kiểm thử và có bằng chứng)**: Tuyệt đối không tự ý đánh dấu hoàn thành nếu chưa chạy lệnh kiểm thử thực tế và ghi lại kết quả bằng chứng (evidence).
- **Update artifacts (Cập nhật trạng thái)**: Trước khi kết thúc phiên, cập nhật trạng thái vào `feature_list.json` và `session-handoff.md`.
- **Stay in scope (Giữ đúng phạm vi công việc)**: Không chỉnh sửa các file hoặc tính năng nằm ngoài phạm vi của task hiện tại.
- **Leave clean state (Để lại trạng thái mã nguồn sạch sẽ)**: Đảm bảo code sạch sẽ, không có lỗi lặt vặt cho phiên tiếp theo.

## Required Artifacts - Các tệp bắt buộc trong bộ khung

- `feature_list.json` — Nguồn chân lý (source of truth) theo dõi các tính năng, trạng thái và phụ thuộc.
- `session-handoff.md` — Biên bản bàn giao giữa các phiên làm việc của Agent.
- `ARCHITECTURE.md` — Tài liệu kiến trúc toàn diện của dự án.
- `AGENTS.md` — Hướng dẫn tối thượng và quy tắc vận hành cho AI.

## Definition of Done - Định nghĩa Hoàn thành

A feature is done only when ALL of the following are true (Một tính năng chỉ được xem là hoàn thành khi đáp ứng ĐẦY ĐỦ các tiêu chí sau):

- [ ] Hành vi nghiệp vụ mục tiêu đã được hiện thực hóa đúng 100% theo tài liệu SRS.
- [ ] Các lệnh kiểm thử bắt buộc đã được chạy thực tế (chạy tests / lint / build / type-check / API curl).
- [ ] Bằng chứng kiểm thử (Evidence) được ghi nhận chi tiết vào `feature_list.json` hoặc `session-handoff.md`.

## End of Session - Quy trình kết thúc phiên

Before ending a session (Trước khi kết thúc bất kỳ phiên làm việc nào):

1. Cập nhật `feature_list.json` với trạng thái tính năng và bằng chứng kiểm thử.
2. Cập nhật `session-handoff.md` ghi lại tiến độ và bước tiếp theo.
3. Ghi nhận mọi rủi ro, vướng mắc (blockers) còn tồn đọng.
4. Tạo commit git với thông điệp rõ ràng khi code đã ở trạng thái an toàn.

## Verification Commands - Lệnh kiểm tra xác thực

Các lệnh kiểm tra chi tiết theo từng phần:
- Backend: `npm test` hoặc `npm run lint` trong thư mục `backend/`
- Frontend: `npm run build` hoặc `npm run lint` trong thư mục `frontend/`

## Escalation - Xử lý vướng mắc & Leo thang quyết định

Nếu gặp tình huống:
- **Quyết định kiến trúc hệ thống**: Tham khảo `ARCHITECTURE.md` và `docs/design-docs/core-beliefs.md`, hoặc xin ý kiến người dùng.
- **Yêu cầu nghiệp vụ chưa rõ**: Tra cứu `docs/product-specs/index.md` và `docs/product-specs/roles-and-requirements.md`.
- **Thay đổi cấu trúc CSDL**: Đối chiếu bảng thiết kế tại `docs/generated/db-schema.md`.
- **Quy chuẩn bảo mật**: Xem `docs/SECURITY.md`.
- **Chiến lược kiểm thử**: Xem `docs/TESTING.md`.
- **Lỗi kiểm thử lặp lại**: Ghi lại vào `session-handoff.md` và báo cáo cho con người xem xét.
- **Mơ hồ về phạm vi**: Đọc lại `feature_list.json` để đối chiếu Definition of Done.
