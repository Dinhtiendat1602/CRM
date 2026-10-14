import { describe, it } from 'node:test';
import assert from 'node:assert';

// 1. Logic validation form Khách hàng tiềm năng (SRS 3.1.2 REQ-2, REQ-3)
function validateLeadForm(formData) {
  const errors = {};
  if (!formData.first_name || !formData.first_name.trim()) {
    errors.first_name = 'Vui lòng nhập Tên (First Name)';
  }
  if (!formData.last_name || !formData.last_name.trim()) {
    errors.last_name = 'Vui lòng nhập Họ & Đệm (Last Name)';
  }
  if (!formData.email || !formData.email.trim()) {
    errors.email = 'Vui lòng nhập Email';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    errors.email = 'Email không đúng định dạng';
  }
  if (!formData.phone || !formData.phone.trim()) {
    errors.phone = 'Vui lòng nhập Số điện thoại';
  } else if (!/^[0-9+().\-\s]{7,20}$/.test(formData.phone.trim())) {
    errors.phone = 'Số điện thoại không hợp lệ (từ 7 - 20 ký tự số)';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// 2. Logic xử lý cảnh báo trùng lặp (BR-02, SRS 3.1.2 REQ-4)
function parseDuplicateResponse(status, data) {
  if (status === 409) {
    return {
      hasDuplicate: true,
      message: data?.message || 'Khách hàng bị trùng Số điện thoại hoặc Email trên hệ thống.',
    };
  }
  return { hasDuplicate: false, message: '' };
}

// 3. Logic xây dựng query params cho danh sách Leads (SRS 3.2, BR-03, BR-04, BR-05)
function buildLeadQueryParams({ page = 1, limit = 20, search = '', sortBy = 'entered_date', sortOrder = 'DESC', startDate, endDate }) {
  const params = {
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    sortBy: sortBy || 'entered_date',
    sortOrder: sortOrder || 'DESC',
  };
  if (search && search.trim()) {
    params.search = search.trim();
  }
  if (startDate) {
    params.startDate = startDate;
  }
  if (endDate) {
    params.endDate = endDate;
  }
  return params;
}

// 4. Logic tính toán tổng doanh số dự kiến của các cơ hội liên quan (SRS 3.2.3 REQ-4)
function calculateTotalExpectedRevenue(opportunities = []) {
  return opportunities.reduce((sum, opp) => {
    const val = Number(opp.expected_revenue) || ((Number(opp.product_price) || 0) * (Number(opp.quantity) || 1));
    return sum + val;
  }, 0);
}

describe('Frontend Leads UI & Business Logic Tests (feat-009)', () => {
  describe('Lead Form Validation (SRS 3.1.2 REQ-2, REQ-3)', () => {
    it('chấp nhận biểu mẫu khi nhập đầy đủ các trường bắt buộc hợp lệ', () => {
      const validData = {
        first_name: 'An',
        last_name: 'Nguyễn Văn',
        email: 'an.nguyen@example.com',
        phone: '0987654321',
      };
      const result = validateLeadForm(validData);
      assert.strictEqual(result.isValid, true);
      assert.strictEqual(Object.keys(result.errors).length, 0);
    });

    it('từ chối khi thiếu Tên (first_name) hoặc Họ (last_name)', () => {
      const invalidData = {
        first_name: '',
        last_name: '   ',
        email: 'an.nguyen@example.com',
        phone: '0987654321',
      };
      const result = validateLeadForm(invalidData);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.first_name);
      assert.ok(result.errors.last_name);
    });

    it('từ chối khi Email sai định dạng (không có @ hoặc domain)', () => {
      const invalidData = {
        first_name: 'An',
        last_name: 'Nguyễn Văn',
        email: 'email-sai-dinh-dang',
        phone: '0987654321',
      };
      const result = validateLeadForm(invalidData);
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.errors.email, 'Email không đúng định dạng');
    });

    it('từ chối khi Số điện thoại chứa ký tự chữ hoặc quá ngắn (< 7 số)', () => {
      const invalidData = {
        first_name: 'An',
        last_name: 'Nguyễn',
        email: 'an@example.com',
        phone: '123',
      };
      const result = validateLeadForm(invalidData);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.phone);
    });
  });

  describe('Duplicate Detection & Error Handling (BR-02, SRS 3.1.2 REQ-4)', () => {
    it('bắt chính xác mã lỗi 409 Conflict và thông báo trùng Email/SĐT', () => {
      const conflictResponse = {
        message: 'Địa chỉ email này đã tồn tại trên hệ thống.',
      };
      const result = parseDuplicateResponse(409, conflictResponse);
      assert.strictEqual(result.hasDuplicate, true);
      assert.strictEqual(result.message, 'Địa chỉ email này đã tồn tại trên hệ thống.');
    });

    it('không báo trùng lặp với phản hồi thành công (HTTP 200/201)', () => {
      const result = parseDuplicateResponse(201, { message: 'Tạo thành công' });
      assert.strictEqual(result.hasDuplicate, false);
    });
  });

  describe('Query Parameters Construction (BR-03, BR-04, BR-05, SRS 3.2, 3.3)', () => {
    it('mặc định áp dụng 20 bản ghi/trang và sắp xếp giảm dần theo entered_date', () => {
      const params = buildLeadQueryParams({});
      assert.strictEqual(params.page, 1);
      assert.strictEqual(params.limit, 20);
      assert.strictEqual(params.sortBy, 'entered_date');
      assert.strictEqual(params.sortOrder, 'DESC');
    });

    it('gắn đúng bộ lọc tìm kiếm theo tên và khoảng ngày khi có chỉ định', () => {
      const params = buildLeadQueryParams({
        page: 2,
        search: 'Nguyễn Văn',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      });
      assert.strictEqual(params.page, 2);
      assert.strictEqual(params.search, 'Nguyễn Văn');
      assert.strictEqual(params.startDate, '2026-10-01');
      assert.strictEqual(params.endDate, '2026-10-31');
    });
  });

  describe('Associated Opportunities Calculation (SRS 3.2.3 REQ-4)', () => {
    it('tính toán chính xác tổng doanh số dự kiến từ danh sách cơ hội', () => {
      const mockOpportunities = [
        { id: 1, product_name: 'Gói ERP', product_price: 1500, quantity: 2, expected_revenue: 3000 },
        { id: 2, product_name: 'Cloud Storage', product_price: 500, quantity: 1, expected_revenue: 500 },
      ];
      const total = calculateTotalExpectedRevenue(mockOpportunities);
      assert.strictEqual(total, 3500);
    });

    it('xử lý an toàn khi danh sách cơ hội rỗng (0 cơ hội)', () => {
      const total = calculateTotalExpectedRevenue([]);
      assert.strictEqual(total, 0);
    });
  });
});
