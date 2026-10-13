# AGENTS.md

Khung Harness Kỹ thuật Dự án Zen CRM — Hướng dẫn vận hành AI Coding Agent chuẩn công nghiệp.

## Startup Workflow - Quy trình khởi động trước mỗi phiên

Before writing code (Trước khi bắt đầu viết code):

1. **Xác nhận thư mục làm việc**: Kiểm tra đường dẫn bằng `pwd`.
2. **Đọc kỹ chỉ dẫn tại file này**: Đọc toàn bộ `AGENTS.md`.
3. **Đọc tài liệu phân tích nghiệp vụ & kiến trúc dự án**:
   - Bản kế hoạch tổng thể: [agent.md](file:///Users/zen/CNTT/Fullstack/internship/agent.md)
   - Đặc tả yêu cầu phần mềm: [docs/00-srs-analysis-specification.md](file:///Users/zen/CNTT/Fullstack/internship/docs/00-srs-analysis-specification.md)
   - Phân quyền & Vai trò: [docs/01-roles-and-requirements.md](file:///Users/zen/CNTT/Fullstack/internship/docs/01-roles-and-requirements.md)
   - Thiết kế CSDL PostgreSQL: [docs/02-database-design.md](file:///Users/zen/CNTT/Fullstack/internship/docs/02-database-design.md)
   - Kiến trúc Backend Express: [docs/03-backend-architecture.md](file:///Users/zen/CNTT/Fullstack/internship/docs/03-backend-architecture.md)
   - Kiến trúc Frontend React Vite: [docs/04-frontend-architecture.md](file:///Users/zen/CNTT/Fullstack/internship/docs/04-frontend-architecture.md)
   - Lộ trình 4 tuần & Kịch bản bảo vệ: [docs/05-roadmap-and-defense.md](file:///Users/zen/CNTT/Fullstack/internship/docs/05-roadmap-and-defense.md)
4. **Chạy `./init.sh`**: Kiểm tra toàn bộ môi trường và dependencies của dự án xem có hoạt động bình thường không.
5. **Đọc `feature_list.json`**: Xem danh sách tính năng, trạng thái hiện tại (`status`) và các mối phụ thuộc (`dependencies`).
6. **Kiểm tra lịch sử commit gần nhất**: Chạy `git log --oneline -5` (nếu đã khởi tạo git).

Nếu kiểm tra baseline thất bại, phải ưu tiên sửa lỗi môi trường trước khi thêm mã nguồn mới.

## Working Rules - Nguyên tắc làm việc cốt lõi

- **One feature at a time (Mỗi lần chỉ thực hiện một tính năng)**: Chọn đúng một tính năng chưa hoàn thành từ `feature_list.json`. Không bao giờ làm nhiều tính năng cùng lúc để tránh phân mảnh ngữ cảnh.
- **Verification required (Bắt buộc phải kiểm thử và có bằng chứng)**: Tuyệt đối không tự ý đánh dấu hoàn thành nếu chưa chạy lệnh kiểm thử thực tế và ghi lại kết quả bằng chứng (evidence).
- **Update artifacts (Cập nhật tài nguyên harness)**: Trước khi kết thúc phiên, luôn cập nhật trạng thái vào `progress.md` và `feature_list.json`.
- **Stay in scope (Giữ đúng phạm vi công việc)**: Không chỉnh sửa các file hoặc tính năng nằm ngoài phạm vi của task hiện tại.
- **Leave clean state (Để lại trạng thái mã nguồn sạch sẽ)**: Đảm bảo phiên làm việc tiếp theo có thể chạy ngay `./init.sh` thành công mà không gặp lỗi tồn đọng.

## Required Artifacts - Các tệp bắt buộc trong bộ khung Harness

- `feature_list.json` — Nguồn chân lý (source of truth) theo dõi 20 tính năng, trạng thái và phụ thuộc.
- `progress.md` — Nhật ký phiên làm việc (những việc đã làm, việc đang làm, rủi ro, bằng chứng).
- `init.sh` — Cổng vào khởi động và kiểm thử môi trường tự động, đảm bảo hệ thống clean và restartable.
- `session-handoff.md` — Biên bản bàn giao giữa các phiên làm việc của Agent.

## Definition of Done - Định nghĩa Hoàn thành

A feature is done only when ALL of the following are true (Một tính năng chỉ được xem là hoàn thành khi đáp ứng ĐẦY ĐỦ các tiêu chí sau):

- [ ] Hành vi nghiệp vụ mục tiêu đã được hiện thực hóa đúng 100% theo tài liệu SRS.
- [ ] Các lệnh kiểm thử bắt buộc đã được chạy thực tế (chạy tests / lint / build / type-check / API curl).
- [ ] Bằng chứng kiểm thử (Evidence) được ghi nhận chi tiết vào `feature_list.json` hoặc `progress.md`.
- [ ] Dự án duy trì trạng thái có thể khởi động lại trơn tru từ kịch bản chuẩn `./init.sh`.

## End of Session - Quy trình kết thúc phiên

Before ending a session (Trước khi kết thúc bất kỳ phiên làm việc nào):

1. Cập nhật `progress.md` với hiện trạng mới nhất của hệ thống.
2. Cập nhật `feature_list.json` với trạng thái tính năng và bằng chứng kiểm thử.
3. Ghi nhận mọi rủi ro, vướng mắc (blockers) còn tồn đọng.
4. Tạo commit git với thông điệp rõ ràng khi code đã ở trạng thái an toàn.
5. Để lại trạng thái repo sạch sẽ để phiên làm việc kế tiếp có thể chạy ngay `./init.sh`.

## Verification Commands - Lệnh kiểm tra xác thực

```bash
# Kiểm tra tổng thể toàn bộ hệ thống (Backend + Frontend + Test Suite)
./init.sh

# Chạy riêng toàn bộ test suite tự động
./test.sh
```

Các lệnh kiểm tra chi tiết theo từng phần:
- Backend: `npm test` hoặc `npm run lint` trong thư mục `backend/`
- Frontend: `npm run build` hoặc `npm run lint` trong thư mục `frontend/`

## Escalation - Xử lý vướng mắc & Leo thang quyết định

Nếu gặp tình huống:
- **Quyết định kiến trúc hệ thống**: Tham khảo `docs/03-backend-architecture.md` và `docs/04-frontend-architecture.md`, hoặc xin ý kiến người dùng.
- **Yêu cầu nghiệp vụ chưa rõ**: Tra cứu `docs/00-srs-analysis-specification.md` và `docs/01-roles-and-requirements.md`.
- **Thay đổi cấu trúc CSDL**: Đối chiếu bảng thiết kế tại `docs/02-database-design.md`.
- **Lỗi kiểm thử lặp lại**: Ghi lại vào `progress.md` và báo cáo cho con người xem xét.
- **Mơ hồ về phạm vi**: Đọc lại `feature_list.json` để đối chiếu Definition of Done.
