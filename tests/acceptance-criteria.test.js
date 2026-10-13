import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();

test('Acceptance Criteria: Checklist specification matches SRS requirements', () => {
  const roadmapPath = path.join(ROOT_DIR, 'docs/05-roadmap-and-defense.md');
  const content = fs.readFileSync(roadmapPath, 'utf8');

  // Verify all 15 AC items are defined in the acceptance criteria matrix
  const expectedACs = [
    'AC-01', // SRS 3.2.3 REQ-1: Danh sách Lead/Opp hiển thị đúng 20 bản ghi mới nhất
    'AC-02', // SRS 3.1.2 REQ-4: Chặn tạo Lead trùng SĐT hoặc Email
    'AC-03', // SRS 3.2.3 REQ-2,3: Sort & Filter Lead/Opp theo entered_date
    'AC-04', // SRS 3.3.3 REQ-1: Tìm kiếm Lead bằng tên hoặc một phần tên
    'AC-05', // SRS 3.8.3 REQ-1: Tìm kiếm Opp theo tên Lead hoặc tên Sản phẩm
    'AC-06', // SRS 3.11.3 REQ-1: Follow-up lưu đủ: ngày, nội dung, phản hồi, KH tiếp
    'AC-07', // SRS 3.12.3 REQ-1: Make Order: chuyển ORDERED + trừ kho + tạo Order trong 1 Transaction
    'AC-08', // SRS 3.12: Make Order khi hết kho -> Rollback, báo lỗi
    'AC-09', // SRS 3.14.3 REQ-2: Quên mật khẩu -> Email link -> Đổi mật khẩu thành công
    'AC-10', // SRS 3.16.3 REQ-1: ProductDetail hiển thị đúng danh sách Cơ hội liên quan
    'AC-11', // SRS 3.17: ProductDetail hiển thị đúng danh sách Đơn hàng liên quan
    'AC-12', // SRS 3.19.3 REQ-1: Campaign Report liệt kê Lead & đếm Opportunity từ chiến dịch
    'AC-13', // SRS 3.21.3 REQ-1: Performance Report: Month | Plan | Actual | % chính xác
    'AC-14', // SRS 5.3: Tự động Timeout sau đúng 30 phút không tương tác
    'AC-15'  // SRS 5.3: Phân quyền RBAC: User chỉ truy cập chức năng đúng với role
  ];

  for (const ac of expectedACs) {
    assert.ok(content.includes(ac), `Roadmap must define acceptance criteria: ${ac}`);
  }
});

test('SRS & Technical Constraints: Non-functional Requirements and RBAC roles', () => {
  const rolesPath = path.join(ROOT_DIR, 'docs/01-roles-and-requirements.md');
  const rolesContent = fs.readFileSync(rolesPath, 'utf8');

  // Check 3 roles
  assert.ok(rolesContent.includes('ADMIN'), 'Roles doc must define ADMIN');
  assert.ok(rolesContent.includes('SALE_MANAGER'), 'Roles doc must define SALE_MANAGER');
  assert.ok(rolesContent.includes('SALESMAN'), 'Roles doc must define SALESMAN');

  // Check 30-minute idle timeout requirement
  const srsPath = path.join(ROOT_DIR, 'docs/00-srs-analysis-specification.md');
  const srsContent = fs.readFileSync(srsPath, 'utf8');
  assert.ok(srsContent.includes('30 phút') || srsContent.includes('30 minutes'), 'SRS must specify 30-minute timeout');
});
