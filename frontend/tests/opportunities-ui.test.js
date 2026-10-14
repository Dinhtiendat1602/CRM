import { describe, it } from 'node:test';
import assert from 'node:assert';

// 1. Logic validation form Cơ hội bán hàng (SRS 3.6, BR-01, BR-06)
function validateOpportunityForm(formData) {
  const errors = {};
  if (!formData.lead_id) {
    errors.lead_id = 'Vui lòng chọn khách hàng tiềm năng.';
  }
  if (!formData.product_id) {
    errors.product_id = 'Vui lòng chọn sản phẩm khách quan tâm.';
  }
  const qty = parseInt(formData.quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    errors.quantity = 'Số lượng phải là số nguyên dương lớn hơn 0.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// 2. Logic tính nhẩm giá trị ước tính của Cơ hội (Estimated Value)
function calculateEstimatedValue(quantity, unitPrice) {
  const qty = parseInt(quantity, 10);
  const price = parseFloat(unitPrice);
  if (isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
    return 0;
  }
  return qty * price;
}

// 3. Logic validation form Nhật ký chăm sóc Follow-up (SRS 3.11)
function validateFollowUpForm(formData) {
  const errors = {};
  if (!formData.content || !formData.content.trim()) {
    errors.content = 'Vui lòng nhập nội dung chi tiết tương tác chăm sóc.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// 4. Logic xây dựng Query Params cho Opportunities List (BR-03, BR-04, BR-05, SRS 3.7, 3.8)
function buildOpportunityQueryParams({
  page = 1,
  limit = 20,
  search = '',
  status = '',
  from_date = '',
  to_date = '',
  sortBy = 'created_at',
  sortOrder = 'DESC',
}) {
  const params = {
    page: Number(page) || 1,
    limit: Number(limit) || 20, // Chuẩn BR-03: 20 dòng
    sortBy: sortBy || 'created_at',
    sortOrder: sortOrder || 'DESC',
  };

  if (search && search.trim()) {
    params.search = search.trim();
  }
  if (status && status.trim()) {
    params.status = status.trim();
  }
  if (from_date) {
    params.from_date = from_date;
  }
  if (to_date) {
    params.to_date = to_date;
  }

  return params;
}

// 5. Logic xử lý lỗi 409 Conflict (Chống trùng lặp cơ hội - BR-02, SRS 3.6.2 REQ-4)
function parseDuplicateError(errorResponse) {
  if (errorResponse?.status === 409) {
    return {
      isDuplicate: true,
      message: errorResponse.data?.message || 'Khách hàng này đã có một cơ hội chưa kết thúc cho sản phẩm này.',
    };
  }
  return {
    isDuplicate: false,
    message: errorResponse?.data?.message || 'Có lỗi xảy ra khi lưu cơ hội bán hàng.',
  };
}

// 6. Logic sắp xếp danh sách Timeline Follow-up
function sortTimelineFollowUps(followUps) {
  return [...followUps].sort((a, b) => new Date(b.follow_date) - new Date(a.follow_date));
}

describe('Frontend Opportunities & Follow-up UI Unit Tests (SRS 3.6 - 3.11)', () => {
  it('1. validateOpportunityForm: Báo lỗi khi thiếu lead_id hoặc product_id (BR-01, BR-06)', () => {
    const result = validateOpportunityForm({
      lead_id: '',
      product_id: '',
      quantity: 1,
    });
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.lead_id);
    assert.ok(result.errors.product_id);
  });

  it('2. validateOpportunityForm: Báo lỗi khi số lượng quantity <= 0 hoặc rỗng', () => {
    const result = validateOpportunityForm({
      lead_id: 1,
      product_id: 2,
      quantity: 0,
    });
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.quantity.includes('nguyên dương'));
  });

  it('3. validateOpportunityForm: Hợp lệ khi nhập đầy đủ khách hàng, sản phẩm và số lượng > 0', () => {
    const result = validateOpportunityForm({
      lead_id: 1,
      product_id: 2,
      quantity: 3,
      expected_close_date: '2026-12-31',
    });
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(Object.keys(result.errors).length, 0);
  });

  it('4. calculateEstimatedValue: Tính toán chuẩn xác giá trị ước tính (quantity * unit_price)', () => {
    const val1 = calculateEstimatedValue(2, 35000000); // 2 laptop Dell XPS
    assert.strictEqual(val1, 70000000);

    const val2 = calculateEstimatedValue(3, 49990000); // 3 máy ảnh Sony A7 IV
    assert.strictEqual(val2, 149970000);

    const valInvalid = calculateEstimatedValue(0, 35000000);
    assert.strictEqual(valInvalid, 0);
  });

  it('5. validateFollowUpForm: Bắt buộc phải có nội dung content khi ghi nhật ký chăm sóc (SRS 3.11)', () => {
    const resultInvalid = validateFollowUpForm({ content: '   ' });
    assert.strictEqual(resultInvalid.isValid, false);
    assert.ok(resultInvalid.errors.content);

    const resultValid = validateFollowUpForm({
      content: 'Gọi điện thoại trao đổi cấu hình máy ảnh và ống kính',
    });
    assert.strictEqual(resultValid.isValid, true);
  });

  it('6. buildOpportunityQueryParams: Đảm bảo phân trang 20 dòng mặc định theo BR-03 (SRS 3.7.3 REQ-1)', () => {
    const params = buildOpportunityQueryParams({});
    assert.strictEqual(params.page, 1);
    assert.strictEqual(params.limit, 20);
    assert.strictEqual(params.sortBy, 'created_at');
    assert.strictEqual(params.sortOrder, 'DESC');
  });

  it('7. buildOpportunityQueryParams: Hỗ trợ tìm kiếm theo tên Lead hoặc Sản phẩm (SRS 3.8)', () => {
    const params = buildOpportunityQueryParams({
      search: 'Sony Alpha',
      status: 'QUALIFIED',
    });
    assert.strictEqual(params.search, 'Sony Alpha');
    assert.strictEqual(params.status, 'QUALIFIED');
  });

  it('8. buildOpportunityQueryParams: Hỗ trợ lọc theo khoảng ngày tạo from_date/to_date (BR-05)', () => {
    const params = buildOpportunityQueryParams({
      from_date: '2026-10-01',
      to_date: '2026-10-31',
    });
    assert.strictEqual(params.from_date, '2026-10-01');
    assert.strictEqual(params.to_date, '2026-10-31');
  });

  it('9. parseDuplicateError: Xử lý và nhận diện đúng mã lỗi HTTP 409 Conflict khi trùng lặp cơ hội (BR-02)', () => {
    const mockError409 = {
      status: 409,
      data: {
        isDuplicate: true,
        message: 'Khách hàng này đã có một cơ hội bán hàng đang xử lý đối với sản phẩm này.',
      },
    };
    const parsed = parseDuplicateError(mockError409);
    assert.strictEqual(parsed.isDuplicate, true);
    assert.ok(parsed.message.includes('đang xử lý'));
  });

  it('10. sortTimelineFollowUps: Sắp xếp nhật ký chăm sóc theo thứ tự thời gian giảm dần (mới nhất lên đầu)', () => {
    const mockFollowUps = [
      { id: 1, follow_date: '2026-10-10T09:00:00Z', content: 'Lần 1' },
      { id: 2, follow_date: '2026-10-12T14:30:00Z', content: 'Lần 2' },
      { id: 3, follow_date: '2026-10-11T10:00:00Z', content: 'Lần 1.5' },
    ];
    const sorted = sortTimelineFollowUps(mockFollowUps);
    assert.strictEqual(sorted[0].id, 2); // 12-10 mới nhất
    assert.strictEqual(sorted[1].id, 3); // 11-10
    assert.strictEqual(sorted[2].id, 1); // 10-10
  });
});
